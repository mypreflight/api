import { Injectable } from '@nestjs/common';
import { ScheduledJobLeaseRepository } from './scheduled-job-lease.repository';

export const EVERY_MINUTE_SECONDS = 60;
export const EVERY_5_MINUTES_SECONDS = 300;

const LEASE_MARGIN_SECONDS = 5;

@Injectable()
export class ScheduledJobs {
  constructor(private readonly leases: ScheduledJobLeaseRepository) {}

  async runExclusively(
    job: string,
    everySeconds: number,
    run: () => Promise<void>,
  ): Promise<void> {
    const claimed = await this.leases.claim(
      job,
      everySeconds - LEASE_MARGIN_SECONDS,
    );

    if (claimed) {
      await run();
    }
  }
}
