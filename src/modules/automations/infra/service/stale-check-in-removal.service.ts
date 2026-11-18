import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ListStaleCheckInsQuery } from '../../../flights/application/query/list-stale-check-ins.query';
import { RemoveStaleCheckInCommand } from '../../../flights/application/command/remove-stale-check-in.command';
import { staleCheckInCutoff } from '../../model/stale-check-in.constants';
import {
  EVERY_5_MINUTES_SECONDS,
  ScheduledJobs,
} from '../../../../core/scheduling/scheduled-jobs.service';

@Injectable()
export class StaleCheckInRemovalService {
  private readonly logger = new Logger(StaleCheckInRemovalService.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly scheduledJobs: ScheduledJobs,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async removeStaleCheckIns(): Promise<void> {
    await this.scheduledJobs.runExclusively(
      'stale-check-in-removal',
      EVERY_5_MINUTES_SECONDS,
      () => this.removeExpired(new Date()),
    );
  }

  async removeExpired(now: Date): Promise<void> {
    const flightIds: string[] = await this.queryBus.execute(
      new ListStaleCheckInsQuery(staleCheckInCutoff(now)),
    );

    for (const flightId of flightIds) {
      try {
        await this.commandBus.execute(new RemoveStaleCheckInCommand(flightId));
        this.logger.log(
          `Removed flight ${flightId}, checked in but not boarded for 24 hours.`,
        );
      } catch (error) {
        this.logger.warn(
          `Could not remove stale check-in ${flightId}: ${error}`,
        );
      }
    }
  }
}
