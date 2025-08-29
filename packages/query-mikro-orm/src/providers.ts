import { FactoryProvider } from '@nestjs/common'
import { getRepositoryToken } from '@mikro-orm/nestjs'
import { EntityRepository, AnyEntity } from '@mikro-orm/core'
import { getQueryServiceToken } from '@ptc-org/nestjs-query-core'

import { MikroOrmQueryService } from './services'

export function createMikroOrmQueryServiceProviders(
  entities: (new () => AnyEntity)[]
): FactoryProvider[] {
  return entities.map((entity) => ({
    provide: getQueryServiceToken(entity),
    useFactory: (repository: EntityRepository<AnyEntity>) => {
      return new MikroOrmQueryService(repository)
    },
    inject: [getRepositoryToken(entity)]
  }))
}