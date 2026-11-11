import { Injectable } from '@nestjs/common';
import { PrismaService } from '../provider/prisma/prisma.service';

@Injectable()
export class ScheduledJobLeaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async claim(job: string, seconds: number): Promise<boolean> {
    const claimed = await this.prisma.$queryRaw<{ job: string }[]>`
      INSERT INTO "scheduled_job_lease" ("job", "heldUntil")
      VALUES (${job}, now() + make_interval(secs => ${seconds}))
      ON CONFLICT ("job") DO UPDATE SET "heldUntil" = EXCLUDED."heldUntil"
      WHERE "scheduled_job_lease"."heldUntil" <= now()
      RETURNING "job"
    `;

    return claimed.length > 0;
  }
}
