import { Module } from '@nestjs/common';
import { DelayAutoApprovalService } from './infra/service/delay-auto-approval.service';
import { StaleCheckInRemovalService } from './infra/service/stale-check-in-removal.service';
import { ScheduledJobsModule } from '../../core/scheduling/scheduled-jobs.module';

@Module({
  imports: [ScheduledJobsModule],
  providers: [DelayAutoApprovalService, StaleCheckInRemovalService],
})
export class AutomationsModule {}
