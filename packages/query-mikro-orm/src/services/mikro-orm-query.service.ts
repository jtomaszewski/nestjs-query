import { NotFoundException } from '@nestjs/common'
import {
  AggregateQuery,
  AggregateResponse,
  DeepPartial,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  FindByIdOptions,
  GetByIdOptions,
  Query,
  QueryService,
  UpdateManyResponse,
  UpdateOneOptions
} from '@ptc-org/nestjs-query-core'
import {
  EntityManager,
  EntityRepository,
  FilterQuery,
  FindOptions,
  wrap,
  EntityData,
  RequiredEntityData,
  AnyEntity,
  Primary
} from '@mikro-orm/core'
import lodashPick from 'lodash.pick'

import { FilterQueryBuilder } from '../query'
import { RelationQueryService } from './relation-query.service'

export class MikroOrmQueryService<Entity extends AnyEntity<Entity>>
  extends RelationQueryService<Entity>
  implements QueryService<Entity, DeepPartial<Entity>, DeepPartial<Entity>>
{
  readonly filterQueryBuilder: FilterQueryBuilder<Entity>

  constructor(
    readonly repository: EntityRepository<Entity>,
    readonly entityManager?: EntityManager
  ) {
    super()
    this.filterQueryBuilder = new FilterQueryBuilder<Entity>(repository)
  }

  public async query(query: Query<Entity>): Promise<Entity[]> {
    const { filterQuery, options } = this.filterQueryBuilder.buildQuery(query)
    return this.repository.find(filterQuery, options as any)
  }

  public async aggregate(
    filter: Filter<Entity>,
    aggregate: AggregateQuery<Entity>
  ): Promise<AggregateResponse<Entity>[]> {
    const em = this.getEntityManager()
    const { filterQuery } = this.filterQueryBuilder.buildQuery({ filter })
    const qb = em.createQueryBuilder(this.repository.getEntityName())
    
    const aggregateResponse: AggregateResponse<Entity> = {}
    
    if (aggregate.count) {
      for (const countField of aggregate.count) {
        const field = countField.field as string
        const count = await qb.clone().where(filterQuery).count(field)
        if (!aggregateResponse.count) aggregateResponse.count = {}
        aggregateResponse.count[field as keyof Entity] = count
      }
    }
    
    if (aggregate.sum) {
      for (const sumField of aggregate.sum) {
        const field = sumField.field as string
        const result = await qb.clone().where(filterQuery).select(`sum(${field})`).execute('get')
        if (!aggregateResponse.sum) aggregateResponse.sum = {}
        aggregateResponse.sum[field as keyof Entity] = result ? Number(result[`sum`]) : 0
      }
    }
    
    if (aggregate.avg) {
      for (const avgField of aggregate.avg) {
        const field = avgField.field as string
        const result = await qb.clone().where(filterQuery).select(`avg(${field})`).execute('get')
        if (!aggregateResponse.avg) aggregateResponse.avg = {}
        aggregateResponse.avg[field as keyof Entity] = result ? Number(result[`avg`]) : 0
      }
    }
    
    if (aggregate.max) {
      for (const maxField of aggregate.max) {
        const field = maxField.field as string
        const result = await qb.clone().where(filterQuery).select(`max(${field})`).execute('get')
        if (!aggregateResponse.max) aggregateResponse.max = {}
        aggregateResponse.max[field as keyof Entity] = result ? result[`max`] : null
      }
    }
    
    if (aggregate.min) {
      for (const minField of aggregate.min) {
        const field = minField.field as string
        const result = await qb.clone().where(filterQuery).select(`min(${field})`).execute('get')
        if (!aggregateResponse.min) aggregateResponse.min = {}
        aggregateResponse.min[field as keyof Entity] = result ? result[`min`] : null
      }
    }
    
    return [aggregateResponse]
  }

  public async count(filter: Filter<Entity>): Promise<number> {
    const { filterQuery } = this.filterQueryBuilder.buildQuery({ filter })
    return this.repository.count(filterQuery)
  }

  public async findById(
    id: string | number,
    opts?: FindByIdOptions<Entity>
  ): Promise<Entity | undefined> {
    const primaryKey = this.getPrimaryKey()
    const { filterQuery, options } = this.filterQueryBuilder.buildIdQuery(id, primaryKey, opts)
    const entity = await this.repository.findOne(filterQuery, options as any)
    return entity ?? undefined
  }

  public async getById(
    id: string | number,
    opts?: GetByIdOptions<Entity>
  ): Promise<Entity> {
    const entity = await this.findById(id, opts)
    if (!entity) {
      throw new NotFoundException(`Unable to find ${this.repository.getEntityName()} with id: ${id}`)
    }
    return entity
  }

  public async createOne(record: DeepPartial<Entity>): Promise<Entity> {
    await this.ensureEntityDoesNotExist(record)
    const entity = this.repository.create(record as RequiredEntityData<Entity>)
    await this.getEntityManager().persistAndFlush(entity)
    return entity
  }

  public async createMany(records: DeepPartial<Entity>[]): Promise<Entity[]> {
    await Promise.all(records.map((r) => this.ensureEntityDoesNotExist(r)))
    
    const entities = records.map(record => 
      this.repository.create(record as RequiredEntityData<Entity>)
    )
    
    await this.getEntityManager().persistAndFlush(entities)
    return entities
  }

  public async updateOne(
    id: number | string,
    update: DeepPartial<Entity>,
    opts?: UpdateOneOptions<Entity>
  ): Promise<Entity> {
    this.ensureIdIsNotPresent(update)
    const entity = await this.getById(id, opts)
    
    wrap(entity).assign(update as any)
    await this.getEntityManager().persistAndFlush(entity)
    
    return entity
  }

  public async updateMany(
    update: DeepPartial<Entity>,
    filter: Filter<Entity>
  ): Promise<UpdateManyResponse> {
    this.ensureIdIsNotPresent(update)
    
    const { filterQuery } = this.filterQueryBuilder.buildQuery({ filter })
    const em = this.getEntityManager()
    
    const count = await em.nativeUpdate(
      this.repository.getEntityName(),
      filterQuery,
      update as EntityData<Entity>
    )
    
    return { updatedCount: count }
  }

  public async deleteOne(
    id: string | number,
    opts?: DeleteOneOptions<Entity>
  ): Promise<Entity> {
    const entity = await this.getById(id, opts)
    await this.getEntityManager().removeAndFlush(entity)
    return entity
  }

  public async deleteMany(filter: Filter<Entity>): Promise<DeleteManyResponse> {
    const { filterQuery } = this.filterQueryBuilder.buildQuery({ filter })
    const em = this.getEntityManager()
    
    const count = await em.nativeDelete(
      this.repository.getEntityName(),
      filterQuery
    )
    
    return { deletedCount: count }
  }

  private getEntityManager(): EntityManager {
    return this.entityManager ?? this.repository.getEntityManager()
  }

  private getPrimaryKey(): string {
    const meta = this.repository.getEntityManager().getMetadata().get(this.repository.getEntityName())
    return meta.primaryKeys[0]
  }

  private async ensureEntityDoesNotExist(entity: DeepPartial<Entity>): Promise<void> {
    const primaryKey = this.getPrimaryKey()
    const pkValue = (entity as any)[primaryKey]
    
    if (pkValue !== undefined && pkValue !== null) {
      const found = await this.repository.findOne({ [primaryKey]: pkValue } as FilterQuery<Entity>)
      if (found) {
        throw new Error('Entity already exists')
      }
    }
  }

  private ensureIdIsNotPresent(entity: DeepPartial<Entity>): void {
    const primaryKey = this.getPrimaryKey()
    if ((entity as any)[primaryKey] !== undefined) {
      throw new Error('Id cannot be specified when updating')
    }
  }
}