import { Test, TestingModule } from '@nestjs/testing'
import { MikroOrmModule } from '@mikro-orm/nestjs'
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

describe('MikroOrmQueryService', () => {
  let moduleRef: TestingModule
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

    it('should return entities with paging', async () => {
      const result = await testEntityService.query({
        paging: { limit: 2, offset: 3 }
      })
      
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject(PLAIN_TEST_ENTITIES[3])
      expect(result[1]).toMatchObject(PLAIN_TEST_ENTITIES[4])
    })

    it('should handle complex filters', async () => {
      const result = await testEntityService.query({
        filter: {
          or: [
            { stringType: { eq: 'foo1' } },
            { numberType: { gte: 8 } }
          ]
        }
      })
      
      expect(result).toHaveLength(4)
    })

    it('should handle between filters', async () => {
      const result = await testEntityService.query({
        filter: {
          numberType: { between: { lower: 3, upper: 7 } }
        }
      })
      
      expect(result).toHaveLength(5)
      result.forEach(entity => {
        expect(entity.numberType).toBeGreaterThanOrEqual(3)
        expect(entity.numberType).toBeLessThanOrEqual(7)
      })
    })

    it('should handle in filters', async () => {
      const result = await testEntityService.query({
        filter: {
          stringType: { in: ['foo1', 'foo3', 'foo5'] }
        }
      })
      
      expect(result).toHaveLength(3)
      expect(result.map(e => e.stringType).sort()).toEqual(['foo1', 'foo3', 'foo5'])
    })

    it('should handle notIn filters', async () => {
      const result = await testEntityService.query({
        filter: {
          numberType: { notIn: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
        }
      })
      
      expect(result).toHaveLength(1)
      expect(result[0].numberType).toBe(10)
    })

    it('should handle like filters', async () => {
      const result = await testEntityService.query({
        filter: {
          stringType: { like: '%foo1%' }
        }
      })
      
      expect(result).toHaveLength(1)
      expect(result[0].stringType).toBe('foo1')
    })

    it('should handle null filters', async () => {
      const result = await testEntityService.query({
        filter: {
          boolType: { is: true }
        }
      })
      
      expect(result).toHaveLength(5)
      result.forEach(entity => {
        expect(entity.boolType).toBe(true)
      })
    })
  })

  describe('#aggregate', () => {
    it('should return aggregate results', async () => {
      const result = await testEntityService.aggregate(
        {},
        {
          count: [{ field: 'testEntityPk', args: {} }],
          avg: [{ field: 'numberType', args: {} }],
          sum: [{ field: 'numberType', args: {} }],
          max: [
            { field: 'numberType', args: {} },
            { field: 'stringType', args: {} }
          ],
          min: [
            { field: 'numberType', args: {} },
            { field: 'stringType', args: {} }
          ]
        }
      )
      
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: { testEntityPk: 10 },
        avg: { numberType: 5.5 },
        sum: { numberType: 55 },
        max: {
          numberType: 10,
          stringType: 'foo9'
        },
        min: {
          numberType: 1,
          stringType: 'foo0'
        }
      })
    })

    it('should return aggregate results with filter', async () => {
      const result = await testEntityService.aggregate(
        { numberType: { gte: 5 } },
        {
          count: [{ field: 'testEntityPk', args: {} }],
          avg: [{ field: 'numberType', args: {} }]
        }
      )
      
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: { testEntityPk: 6 },
        avg: { numberType: 7.5 }
      })
    })
  })

  describe('#count', () => {
    it('should return count of all entities', async () => {
      const count = await testEntityService.count({})
      expect(count).toBe(10)
    })

    it('should return count with filter', async () => {
      const count = await testEntityService.count({
        boolType: { is: true }
      })
      expect(count).toBe(5)
    })
  })

  describe('#findById', () => {
    it('should find entity by id', async () => {
      const entity = await testEntityService.findById('test-entity-1')
      expect(entity).toMatchObject(PLAIN_TEST_ENTITIES[1])
    })

    it('should return undefined for non-existent id', async () => {
      const entity = await testEntityService.findById('non-existent')
      expect(entity).toBeUndefined()
    })

    it('should apply filter options', async () => {
      const entity = await testEntityService.findById('test-entity-1', {
        filter: { stringType: { eq: 'foo0' } }
      })
      expect(entity).toBeUndefined()
    })
  })

  describe('#getById', () => {
    it('should get entity by id', async () => {
      const entity = await testEntityService.getById('test-entity-1')
      expect(entity).toMatchObject(PLAIN_TEST_ENTITIES[1])
    })

    it('should throw for non-existent id', async () => {
      await expect(testEntityService.getById('non-existent')).rejects.toThrow(
        'Unable to find TestEntity with id: non-existent'
      )
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

    it('should throw if entity already exists', async () => {
      const duplicate = {
        testEntityPk: 'test-entity-1',
        stringType: 'duplicate',
        numberType: 100,
        dateType: new Date()
      }
      
      await expect(testEntityService.createOne(duplicate)).rejects.toThrow(
        'Entity already exists'
      )
    })
  })

  describe('#createMany', () => {
    it('should create multiple entities', async () => {
      const newEntities = [
        {
          testEntityPk: 'new-entity-1',
          stringType: 'new1',
          numberType: 101,
          dateType: new Date('2020-03-01')
        },
        {
          testEntityPk: 'new-entity-2',
          stringType: 'new2',
          numberType: 102,
          dateType: new Date('2020-03-02')
        }
      ]
      
      const created = await testEntityService.createMany(newEntities)
      expect(created).toHaveLength(2)
      expect(created[0]).toMatchObject(newEntities[0])
      expect(created[1]).toMatchObject(newEntities[1])
      
      const count = await testEntityService.count({})
      expect(count).toBe(12)
    })

    it('should throw if any entity already exists', async () => {
      const entities = [
        {
          testEntityPk: 'new-entity',
          stringType: 'new',
          numberType: 100,
          dateType: new Date()
        },
        {
          testEntityPk: 'test-entity-1',
          stringType: 'duplicate',
          numberType: 100,
          dateType: new Date()
        }
      ]
      
      await expect(testEntityService.createMany(entities)).rejects.toThrow(
        'Entity already exists'
      )
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

    it('should throw if entity does not exist', async () => {
      await expect(
        testEntityService.updateOne('non-existent', { stringType: 'updated' })
      ).rejects.toThrow('Unable to find TestEntity with id: non-existent')
    })

    it('should throw if id is present in update', async () => {
      await expect(
        testEntityService.updateOne('test-entity-1', {
          testEntityPk: 'different-id',
          stringType: 'updated'
        } as any)
      ).rejects.toThrow('Id cannot be specified when updating')
    })
  })

  describe('#updateMany', () => {
    it('should update multiple entities', async () => {
      const result = await testEntityService.updateMany(
        { stringType: 'bulk-updated' },
        { numberType: { gte: 5 } }
      )
      
      expect(result.updatedCount).toBe(6)
      
      const updated = await testEntityService.query({
        filter: { stringType: { eq: 'bulk-updated' } }
      })
      
      expect(updated).toHaveLength(6)
    })

    it('should throw if id is present in update', async () => {
      await expect(
        testEntityService.updateMany(
          { testEntityPk: 'id', stringType: 'updated' } as any,
          {}
        )
      ).rejects.toThrow('Id cannot be specified when updating')
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

    it('should throw if entity does not exist', async () => {
      await expect(testEntityService.deleteOne('non-existent')).rejects.toThrow(
        'Unable to find TestEntity with id: non-existent'
      )
    })
  })

  describe('#deleteMany', () => {
    it('should delete multiple entities', async () => {
      const result = await testEntityService.deleteMany({
        numberType: { gte: 7 }
      })
      
      expect(result.deletedCount).toBe(4)
      
      const count = await testEntityService.count({})
      expect(count).toBe(6)
    })

    it('should return zero if no entities match', async () => {
      const result = await testEntityService.deleteMany({
        stringType: { eq: 'non-existent' }
      })
      
      expect(result.deletedCount).toBe(0)
    })
  })

  describe('relations', () => {
    it('should query with relation filters', async () => {
      const results = await testRelationService.query({
        filter: {
          testEntity: {
            stringType: { in: ['foo0', 'foo1'] }
          }
        }
      })
      
      expect(results).toHaveLength(6)
    })
  })
})