import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection
} from '@mikro-orm/core'
import { TestEntity } from './test.entity'

@Entity()
export class TestRelation {
  @PrimaryKey()
  testRelationPk!: string

  @Property()
  relationName!: string

  @Property({ nullable: true })
  testEntityId?: string

  @ManyToOne(() => TestEntity, { nullable: true })
  testEntity?: TestEntity

  @OneToMany(() => TestEntity, (entity) => entity.manyTestRelation)
  manyTestEntities = new Collection<TestEntity>(this)
}