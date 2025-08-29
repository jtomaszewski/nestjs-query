import { TestEntity } from './test.entity'
import { TestRelation } from './test-relation.entity'

export const PLAIN_TEST_ENTITIES: Partial<TestEntity>[] = []
export const PLAIN_TEST_RELATIONS: Partial<TestRelation>[] = []

for (let i = 0; i < 10; i++) {
  const testEntity: Partial<TestEntity> = {
    testEntityPk: `test-entity-${i}`,
    stringType: `foo${i}`,
    boolType: i % 2 === 0,
    numberType: i + 1,
    dateType: new Date(`2020-02-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`)
  }
  PLAIN_TEST_ENTITIES.push(testEntity)

  for (let j = 0; j < 3; j++) {
    PLAIN_TEST_RELATIONS.push({
      testRelationPk: `test-relations-${i}-${j}`,
      relationName: `Test Relation ${i}-${j}`,
      testEntityId: testEntity.testEntityPk
    })
  }
}