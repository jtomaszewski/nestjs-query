import { MikroORM, Options } from '@mikro-orm/core'
import { SqliteDriver } from '@mikro-orm/sqlite'
import { TestEntity } from './test.entity'
import { TestRelation } from './test-relation.entity'

export const CONNECTION_OPTIONS: Options<SqliteDriver> = {
  type: 'sqlite',
  dbName: ':memory:',
  entities: [TestEntity, TestRelation],
  debug: false,
  allowGlobalContext: true
}

export async function createTestConnection(): Promise<MikroORM> {
  const orm = await MikroORM.init(CONNECTION_OPTIONS)
  const generator = orm.getSchemaGenerator()
  
  await generator.dropSchema()
  await generator.createSchema()
  
  return orm
}

export async function closeTestConnection(orm: MikroORM): Promise<void> {
  await orm.close(true)
}

export async function truncate(orm: MikroORM): Promise<void> {
  const em = orm.em.fork()
  
  await em.nativeDelete(TestRelation, {})
  await em.nativeDelete(TestEntity, {})
  await em.flush()
}

export async function seed(orm: MikroORM): Promise<void> {
  const em = orm.em.fork()
  
  const entities: TestEntity[] = []
  const relations: TestRelation[] = []
  
  for (let i = 0; i < 10; i++) {
    const entity = em.create(TestEntity, {
      testEntityPk: `test-entity-${i}`,
      stringType: `foo${i}`,
      boolType: i % 2 === 0,
      numberType: i + 1,
      dateType: new Date(`2020-02-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`)
    })
    entities.push(entity)
    
    for (let j = 0; j < 3; j++) {
      const relation = em.create(TestRelation, {
        testRelationPk: `test-relations-${i}-${j}`,
        relationName: `Test Relation ${i}-${j}`,
        testEntity: entity
      })
      relations.push(relation)
    }
  }
  
  await em.persistAndFlush([...entities, ...relations])
}