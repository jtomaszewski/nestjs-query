import { Filter, FilterFieldComparison } from '@ptc-org/nestjs-query-core'
import { FilterQuery, AnyEntity } from '@mikro-orm/core'

import { ComparisonBuilder } from './comparison.builder'

export class WhereBuilder<Entity extends AnyEntity<Entity>> {
  private readonly comparisonBuilder: ComparisonBuilder<Entity>

  constructor() {
    this.comparisonBuilder = new ComparisonBuilder<Entity>()
  }

  build(filter: Filter<Entity>): FilterQuery<Entity> {
    const { and = [], or = [] } = filter
    const where: FilterQuery<Entity> = {}

    const filters = Object.keys(filter).filter(
      (f) => f !== 'and' && f !== 'or'
    ) as (keyof Entity)[]

    filters.forEach((field) => {
      const value = filter[field as keyof Filter<Entity>]
      
      if (value !== undefined) {
        if (this.isFilterComparison(value)) {
          const comparison = this.comparisonBuilder.build(
            field as string,
            value as FilterFieldComparison<Entity[keyof Entity]>
          )
          Object.assign(where, comparison)
        } else if (this.isNestedFilter(value)) {
          Object.assign(where, {
            [field]: this.build(value as Filter<any>)
          })
        } else {
          Object.assign(where, { [field]: value })
        }
      }
    })

    if (and.length > 0) {
      const andConditions = and.map((andFilter) => this.build(andFilter))
      if (andConditions.length > 0) {
        Object.assign(where, { $and: andConditions })
      }
    }

    if (or.length > 0) {
      const orConditions = or.map((orFilter) => this.build(orFilter))
      if (orConditions.length > 0) {
        Object.assign(where, { $or: orConditions })
      }
    }

    return where
  }

  private isFilterComparison(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    
    const comparisonKeys = [
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'notLike', 'iLike', 'notILike',
      'in', 'notIn', 'is', 'isNot',
      'between', 'notBetween'
    ]
    
    return Object.keys(value).some((key) => comparisonKeys.includes(key))
  }

  private isNestedFilter(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    
    const keys = Object.keys(value)
    return keys.length > 0 && !this.isFilterComparison(value)
  }
}