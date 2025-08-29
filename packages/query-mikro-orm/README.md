# @ptc-org/nestjs-query-mikro-orm

MikroORM adapter for `@ptc-org/nestjs-query-core`.

## Installation

```bash
npm install @ptc-org/nestjs-query-mikro-orm @mikro-orm/core @mikro-orm/nestjs
```

## Usage

### Basic Setup

```typescript
import { Module } from '@nestjs/common'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { NestjsQueryMikroOrmModule } from '@ptc-org/nestjs-query-mikro-orm'
import { TodoEntity } from './todo.entity'

@Module({
  imports: [
    MikroOrmModule.forFeature([TodoEntity]),
    NestjsQueryMikroOrmModule.forFeature([TodoEntity])
  ]
})
export class TodoModule {}
```

### Using the QueryService

```typescript
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@mikro-orm/nestjs'
import { EntityRepository } from '@mikro-orm/core'
import { MikroOrmQueryService } from '@ptc-org/nestjs-query-mikro-orm'
import { TodoEntity } from './todo.entity'

@Injectable()
export class TodoService extends MikroOrmQueryService<TodoEntity> {
  constructor(
    @InjectRepository(TodoEntity) repo: EntityRepository<TodoEntity>
  ) {
    super(repo)
  }
}
```

### Query Examples

```typescript
// Find all todos with pagination
const todos = await todoService.query({
  filter: { completed: { is: false } },
  paging: { limit: 10, offset: 0 },
  sorting: [{ field: 'created', direction: SortDirection.DESC }]
})

// Aggregate query
const stats = await todoService.aggregate(
  { completed: { is: true } },
  {
    count: [{ field: 'id', args: {} }],
    avg: [{ field: 'priority', args: {} }],
    sum: [{ field: 'estimatedHours', args: {} }]
  }
)

// Create multiple todos
const created = await todoService.createMany([
  { title: 'Todo 1', completed: false },
  { title: 'Todo 2', completed: false }
])

// Update many
const result = await todoService.updateMany(
  { completed: true },
  { dueDate: { lt: new Date() } }
)

// Delete many
const deleted = await todoService.deleteMany({
  completed: { is: true },
  created: { lt: new Date('2020-01-01') }
})
```

## Features

- Full support for complex filtering with nested conditions
- Aggregation queries (count, sum, avg, min, max)
- Pagination and sorting
- Bulk operations (createMany, updateMany, deleteMany)
- Relation filtering
- Type-safe queries

## License

MIT