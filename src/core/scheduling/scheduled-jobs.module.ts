import { Module } from '@nestjs/common';
import { PrismaModule } from '../provider/prisma/prisma.module';
import { ScheduledJobLeaseRepository } from './scheduled-job-lease.repository';
import { ScheduledJobs } from './scheduled-jobs.service';

@Module({
  imports: [PrismaModule],
  providers: [ScheduledJobLeaseRepository, ScheduledJobs],
  exports: [ScheduledJobs],
})
export class ScheduledJobsModule {}
