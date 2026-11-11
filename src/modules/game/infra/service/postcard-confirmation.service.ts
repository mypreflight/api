import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfirmDrawnPostcardsCommand } from '../../application/command/postcard/confirm-drawn-postcards.command';
import { getErrorMessage } from '../../../../core/utils/error-message';
import {
  EVERY_MINUTE_SECONDS,
  ScheduledJobs,
} from '../../../../core/scheduling/scheduled-jobs.service';

@Injectable()
export class PostcardConfirmationService {
  private readonly logger = new Logger(PostcardConfirmationService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly scheduledJobs: ScheduledJobs,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async confirmDrawnPostcards(): Promise<void> {
    try {
      await this.scheduledJobs.runExclusively(
        'postcard-confirmation',
        EVERY_MINUTE_SECONDS,
        () => this.commandBus.execute(new ConfirmDrawnPostcardsCommand()),
      );
    } catch (error) {
      this.logger.error(
        `Scheduled postcard confirmation failed: ${getErrorMessage(error)}`,
      );
    }
  }
}
