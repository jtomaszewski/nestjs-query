import {
  Filter,
  Query,
  SortDirection,
  SortField,
  FindByIdOptions,
  GetByIdOptions
} from '@ptc-org/nestjs-query-core'
import {
  EntityRepository,
  FilterQuery,
  FindOptions,
  QueryOrder,
  AnyEntity,
  QueryOrderMap
} from '@mikro-orm/core'

import { WhereBuilder } from './where.builder'

export class FilterQueryBuilder<Entity extends AnyEntity<Entity>> {
  private readonly whereBuilder: WhereBuilder<Entity>

  constructor(private readonly repository: EntityRepository<Entity>) {
    this.whereBuilder = new WhereBuilder<Entity>()
  }

  buildQuery(query: Query<Entity>): {
    filterQuery: FilterQuery<Entity>
    options: FindOptions<Entity, never>
  } {
    const filterQuery = this.buildFilterQuery(query.filter)
    const options = this.buildFindOptions(query)
    
    return { filterQuery, options }
  }

  buildIdQuery(
    id: string | number,
    primaryKey: string,
    opts?: FindByIdOptions<Entity> | GetByIdOptions<Entity>
  ): {
    filterQuery: FilterQuery<Entity>
    options: FindOptions<Entity, never>
  } {
    const filterQuery: FilterQuery<Entity> = { [primaryKey]: id } as FilterQuery<Entity>
    
    if (opts?.filter) {
      Object.assign(filterQuery, this.buildFilterQuery(opts.filter))
    }
    
    const options: FindOptions<Entity, never> = {}
    
    if (opts?.relations) {
      options.populate = opts.relations as any
    }
    
    return { filterQuery, options }
  }

  private buildFilterQuery(filter?: Filter<Entity>): FilterQuery<Entity> {
    if (!filter) {
      return {} as FilterQuery<Entity>
    }
    
    return this.whereBuilder.build(filter)
  }

  private buildFindOptions(query: Query<Entity>): FindOptions<Entity, never> {
    const options: FindOptions<Entity, never> = {}
    
    if (query.paging) {
      if (query.paging.limit !== undefined) {
        options.limit = query.paging.limit
      }
      if (query.paging.offset !== undefined) {
        options.offset = query.paging.offset
      }
    }
    
    if (query.sorting && query.sorting.length > 0) {
      options.orderBy = this.buildOrderBy(query.sorting)
    }
    
    return options
  }

  private buildOrderBy(sorting: SortField<Entity>[]): QueryOrderMap<Entity> {
    const orderBy: any = {}
    
    sorting.forEach(sort => {
      const field = sort.field as string
      const direction = sort.direction === SortDirection.DESC ? QueryOrder.DESC : QueryOrder.ASC
      orderBy[field] = direction
    })
    
    return orderBy as QueryOrderMap<Entity>
  }
}