import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';

export class ListStaleCheckInsQuery extends Query<string[]> {
  constructor(public readonly checkedInBefore: Date) {
    super();
  }
}

@QueryHandler(ListStaleCheckInsQuery)
export class ListStaleCheckInsHandler implements IQueryHandler<ListStaleCheckInsQuery> {
  constructor(private readonly repository: FlightsRepository) {}

  async execute(query: ListStaleCheckInsQuery): Promise<string[]> {
    return this.repository.findStaleCheckIns(query.checkedInBefore);
  }
}
