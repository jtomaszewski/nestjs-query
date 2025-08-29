import {
  AggregateQuery,
  AggregateResponse,
  Filter,
  FindRelationOptions,
  GetByIdOptions,
  ModifyRelationOptions,
  Query,
  RelationQueryService as BaseRelationQueryService
} from '@ptc-org/nestjs-query-core'
import { AnyEntity } from '@mikro-orm/core'

export abstract class RelationQueryService<Entity extends AnyEntity<Entity>>
  implements BaseRelationQueryService<Entity, unknown, unknown>
{
  abstract query(query: Query<Entity>): Promise<Entity[]>

  abstract aggregate(
    filter: Filter<Entity>,
    aggregate: AggregateQuery<Entity>
  ): Promise<AggregateResponse<Entity>[]>

  abstract count(filter: Filter<Entity>): Promise<number>

  abstract findById(
    id: string | number,
    opts?: GetByIdOptions<Entity>
  ): Promise<Entity | undefined>

  abstract getById(
    id: string | number,
    opts?: GetByIdOptions<Entity>
  ): Promise<Entity>

  abstract createOne(record: unknown): Promise<Entity>

  abstract createMany(records: unknown[]): Promise<Entity[]>

  abstract updateOne(
    id: string | number,
    record: unknown,
    opts?: GetByIdOptions<Entity>
  ): Promise<Entity>

  abstract updateMany(
    update: unknown,
    filter: Filter<Entity>
  ): Promise<{ updatedCount: number }>

  abstract deleteOne(
    id: string | number,
    opts?: GetByIdOptions<Entity>
  ): Promise<Entity>

  abstract deleteMany(filter: Filter<Entity>): Promise<{ deletedCount: number }>

  queryRelations<Relation>(
    RelationClass: new () => Relation,
    relationName: string,
    entities: Entity[],
    query: Query<Relation>
  ): Promise<Map<Entity, Relation[]>> {
    throw new Error('queryRelations is not implemented')
  }

  aggregateRelations<Relation>(
    RelationClass: new () => Relation,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<Map<Entity, AggregateResponse<Relation>[]>> {
    throw new Error('aggregateRelations is not implemented')
  }

  countRelations<Relation>(
    RelationClass: new () => Relation,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>
  ): Promise<Map<Entity, number>> {
    throw new Error('countRelations is not implemented')
  }

  findRelation<Relation>(
    RelationClass: new () => Relation,
    relationName: string,
    entity: Entity,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined> {
    throw new Error('findRelation is not implemented')
  }

  addRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    throw new Error('addRelations is not implemented')
  }

  setRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    throw new Error('setRelations is not implemented')
  }

  setRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    throw new Error('setRelation is not implemented')
  }

  removeRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    throw new Error('removeRelations is not implemented')
  }

  removeRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    throw new Error('removeRelation is not implemented')
  }
}