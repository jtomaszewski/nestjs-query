import { FilterFieldComparison } from '@ptc-org/nestjs-query-core'
import { FilterQuery, AnyEntity } from '@mikro-orm/core'

export class ComparisonBuilder<Entity extends AnyEntity<Entity>> {
  build(
    field: string,
    comparison: FilterFieldComparison<Entity[keyof Entity]>
  ): FilterQuery<Entity> {
    const result: FilterQuery<Entity> = {}
    const comp = comparison as any

    if (comp.eq !== undefined) {
      result[field as keyof FilterQuery<Entity>] = comp.eq
    }

    if (comp.neq !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $ne: comp.neq } as any
    }

    if (comp.gt !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $gt: comp.gt } as any
    }

    if (comp.gte !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $gte: comp.gte } as any
    }

    if (comp.lt !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $lt: comp.lt } as any
    }

    if (comp.lte !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $lte: comp.lte } as any
    }

    if (comp.like !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $like: comp.like } as any
    }

    if (comp.notLike !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $not: { $like: comp.notLike } } as any
    }

    if (comp.iLike !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $ilike: comp.iLike } as any
    }

    if (comp.notILike !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $not: { $ilike: comp.notILike } } as any
    }

    if (comp.in !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $in: comp.in } as any
    }

    if (comp.notIn !== undefined) {
      result[field as keyof FilterQuery<Entity>] = { $nin: comp.notIn } as any
    }

    if (comp.is !== undefined) {
      if (comp.is === null) {
        result[field as keyof FilterQuery<Entity>] = null as any
      } else if (comp.is === true || comp.is === false) {
        result[field as keyof FilterQuery<Entity>] = comp.is as any
      }
    }

    if (comp.isNot !== undefined) {
      if (comp.isNot === null) {
        result[field as keyof FilterQuery<Entity>] = { $ne: null } as any
      } else if (comp.isNot === true || comp.isNot === false) {
        result[field as keyof FilterQuery<Entity>] = { $ne: comp.isNot } as any
      }
    }

    if (comp.between !== undefined) {
      const { lower, upper } = comp.between
      result[field as keyof FilterQuery<Entity>] = { $gte: lower, $lte: upper } as any
    }

    if (comp.notBetween !== undefined) {
      const { lower, upper } = comp.notBetween
      result[field as keyof FilterQuery<Entity>] = {
        $or: [{ [field]: { $lt: lower } }, { [field]: { $gt: upper } }]
      } as any
    }

    return result
  }
}