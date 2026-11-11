-- CreateTable
CREATE TABLE "scheduled_job_lease" (
    "job" TEXT NOT NULL,
    "heldUntil" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scheduled_job_lease_pkey" PRIMARY KEY ("job")
);

