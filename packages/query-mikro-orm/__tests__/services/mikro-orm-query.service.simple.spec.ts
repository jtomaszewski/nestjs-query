import { MikroORM, EntityRepository } from '@mikro-orm/core'
import { SortDirection } from '@ptc-org/nestjs-query-core'

import { MikroOrmQueryService } from '../../src'
import { TestEntity } from '../__fixtures__/test.entity'
import { TestRelation } from '../__fixtures__/test-relation.entity'
import {
  CONNECTION_OPTIONS,
  createTestConnection,
  closeTestConnection,
  truncate,
  seed
} from '../__fixtures__/mikro-orm.fixture'
import { PLAIN_TEST_ENTITIES, PLAIN_TEST_RELATIONS } from '../__fixtures__/seeds'

describe('MikroOrmQueryService (Simple)', () => {
  let orm: MikroORM
  let testEntityService: MikroOrmQueryService<TestEntity>
  let testRelationService: MikroOrmQueryService<TestRelation>

  beforeAll(async () => {
    orm = await createTestConnection()
  })

  afterAll(async () => {
    await closeTestConnection(orm)
  })

  beforeEach(async () => {
    await truncate(orm)
    await seed(orm)
    
    const testEntityRepo = orm.em.getRepository(TestEntity)
    const testRelationRepo = orm.em.getRepository(TestRelation)
    
    testEntityService = new MikroOrmQueryService(testEntityRepo, orm.em)
    testRelationService = new MikroOrmQueryService(testRelationRepo, orm.em)
  })

  describe('#query', () => {
    it('should return entities matching the filter', async () => {
      const result = await testEntityService.query({
        filter: { stringType: { eq: 'foo1' } }
      })
      
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject(PLAIN_TEST_ENTITIES[1])
    })

    it('should return entities with sorting', async () => {
      const result = await testEntityService.query({
        sorting: [{ field: 'numberType', direction: SortDirection.DESC }],
        paging: { limit: 3 }
      })
      
      expect(result).toHaveLength(3)
      expect(result[0].numberType).toBe(10)
      expect(result[1].numberType).toBe(9)
      expect(result[2].numberType).toBe(8)
    })
  })

  describe('#count', () => {
    it('should return count of all entities', async () => {
      const count = await testEntityService.count({})
      expect(count).toBe(10)
    })
  })

  describe('#createOne', () => {
    it('should create a single entity', async () => {
      const newEntity = {
        testEntityPk: 'new-entity',
        stringType: 'new',
        numberType: 100,
        dateType: new Date('2020-03-01')
      }
      
      const created = await testEntityService.createOne(newEntity)
      expect(created).toMatchObject(newEntity)
      
      const found = await testEntityService.findById('new-entity')
      expect(found).toMatchObject(newEntity)
    })
  })

  describe('#updateOne', () => {
    it('should update a single entity', async () => {
      const updated = await testEntityService.updateOne('test-entity-1', {
        stringType: 'updated'
      })
      
      expect(updated.stringType).toBe('updated')
      expect(updated.numberType).toBe(2)
      
      const found = await testEntityService.findById('test-entity-1')
      expect(found?.stringType).toBe('updated')
    })
  })

  describe('#deleteOne', () => {
    it('should delete a single entity', async () => {
      const deleted = await testEntityService.deleteOne('test-entity-1')
      expect(deleted).toMatchObject(PLAIN_TEST_ENTITIES[1])
      
      const found = await testEntityService.findById('test-entity-1')
      expect(found).toBeUndefined()
      
      const count = await testEntityService.count({})
      expect(count).toBe(9)
    })
  })
})