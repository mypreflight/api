import { Module } from '@nestjs/common';
import { DelayAutoApprovalService } from './infra/service/delay-auto-approval.service';
import { ScheduledJobsModule } from '../../core/scheduling/scheduled-jobs.module';

@Module({
  imports: [ScheduledJobsModule],
  providers: [DelayAutoApprovalService],
})
export class AutomationsModule {}
