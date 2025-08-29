import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  OneToOne
} from '@mikro-orm/core'
import { TestRelation } from './test-relation.entity'

@Entity()
export class TestEntity {
  @PrimaryKey()
  testEntityPk!: string

  @Property()
  stringType!: string

  @Property({ nullable: true })
  boolType?: boolean

  @Property()
  numberType!: number

  @Property({ type: 'date' })
  dateType!: Date

  @OneToOne(() => TestRelation, { nullable: true })
  oneTestRelation?: TestRelation

  @OneToMany(() => TestRelation, (relation) => relation.testEntity)
  testRelations = new Collection<TestRelation>(this)

  @ManyToOne(() => TestRelation, { nullable: true })
  manyTestRelation?: TestRelation
}