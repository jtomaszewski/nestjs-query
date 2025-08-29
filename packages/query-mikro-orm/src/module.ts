import { DynamicModule } from '@nestjs/common'
import { AnyEntity } from '@mikro-orm/core'

import { createMikroOrmQueryServiceProviders } from './providers'

export class NestjsQueryMikroOrmModule {
  static forFeature(entities: (new () => AnyEntity)[]): DynamicModule {
    const providers = createMikroOrmQueryServiceProviders(entities)
    
    return {
      module: NestjsQueryMikroOrmModule,
      providers,
      exports: providers
    }
  }
}