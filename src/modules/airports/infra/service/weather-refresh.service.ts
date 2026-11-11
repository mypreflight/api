import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshWeatherCommand } from '../../application/command/weather/refresh-weather.command';
import { getErrorMessage } from '../../../../core/utils/error-message';
import {
  EVERY_5_MINUTES_SECONDS,
  ScheduledJobs,
} from '../../../../core/scheduling/scheduled-jobs.service';

@Injectable()
export class WeatherRefreshService {
  private readonly logger = new Logger(WeatherRefreshService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly scheduledJobs: ScheduledJobs,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshMonitoredAirports(): Promise<void> {
    try {
      await this.scheduledJobs.runExclusively(
        'weather-refresh',
        EVERY_5_MINUTES_SECONDS,
        () => this.commandBus.execute(new RefreshWeatherCommand()),
      );
    } catch (error) {
      this.logger.error(
        `Scheduled weather refresh failed: ${getErrorMessage(error)}`,
      );
    }
  }
}
