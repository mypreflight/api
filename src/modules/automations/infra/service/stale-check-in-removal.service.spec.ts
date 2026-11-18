import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { StaleCheckInRemovalService } from './stale-check-in-removal.service';
import { ScheduledJobs } from '../../../../core/scheduling/scheduled-jobs.service';
import { ListStaleCheckInsQuery } from '../../../flights/application/query/list-stale-check-ins.query';
import { RemoveStaleCheckInCommand } from '../../../flights/application/command/remove-stale-check-in.command';
import { staleCheckInCutoff } from '../../model/stale-check-in.constants';

const NOW = new Date('2026-11-18T12:00:00.000Z');

function serviceFor(flightIds: string[], failing: string[] = []) {
  const queryBus = { execute: jest.fn().mockResolvedValue(flightIds) };
  const commandBus = {
    execute: jest.fn((command: RemoveStaleCheckInCommand) =>
      failing.includes(command.flightId)
        ? Promise.reject(new Error('moved on'))
        : Promise.resolve(),
    ),
  };
  const service = new StaleCheckInRemovalService(
    queryBus as unknown as QueryBus,
    commandBus as unknown as CommandBus,
    {} as ScheduledJobs,
  );

  return { service, queryBus, commandBus };
}

describe('staleCheckInCutoff', () => {
  it('is 24 hours before now', () => {
    expect(staleCheckInCutoff(NOW)).toEqual(
      new Date('2026-11-17T12:00:00.000Z'),
    );
  });
});

describe('StaleCheckInRemovalService', () => {
  it('removes every flight checked in more than 24 hours ago', async () => {
    const { service, queryBus, commandBus } = serviceFor(['a', 'b']);

    await service.removeExpired(NOW);

    expect(queryBus.execute).toHaveBeenCalledWith(
      new ListStaleCheckInsQuery(new Date('2026-11-17T12:00:00.000Z')),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      new RemoveStaleCheckInCommand('a'),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      new RemoveStaleCheckInCommand('b'),
    );
  });

  it('carries on past a flight that could not be removed', async () => {
    const { service, commandBus } = serviceFor(['a', 'b'], ['a']);

    await expect(service.removeExpired(NOW)).resolves.toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
  });
});
