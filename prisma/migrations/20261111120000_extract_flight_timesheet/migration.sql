-- AlterTable
ALTER TABLE "flight" ADD COLUMN     "actualArrivalTime" TIMESTAMP(3),
ADD COLUMN     "actualOffBlockTime" TIMESTAMP(3),
ADD COLUMN     "actualOnBlockTime" TIMESTAMP(3),
ADD COLUMN     "actualTakeoffTime" TIMESTAMP(3),
ADD COLUMN     "estimatedArrivalTime" TIMESTAMP(3),
ADD COLUMN     "estimatedOffBlockTime" TIMESTAMP(3),
ADD COLUMN     "estimatedOnBlockTime" TIMESTAMP(3),
ADD COLUMN     "estimatedTakeoffTime" TIMESTAMP(3),
ADD COLUMN     "predictedArrivalTime" TIMESTAMP(3),
ADD COLUMN     "predictedOffBlockTime" TIMESTAMP(3),
ADD COLUMN     "predictedOnBlockTime" TIMESTAMP(3),
ADD COLUMN     "predictedTakeoffTime" TIMESTAMP(3),
ADD COLUMN     "scheduledArrivalTime" TIMESTAMP(3),
ADD COLUMN     "scheduledOffBlockTime" TIMESTAMP(3),
ADD COLUMN     "scheduledOnBlockTime" TIMESTAMP(3),
ADD COLUMN     "scheduledTakeoffTime" TIMESTAMP(3);

DO $$
DECLARE
    leftovers bigint;
BEGIN
    PERFORM set_config('TimeZone', 'UTC', true);

    WITH schedules AS (
        SELECT f."id", s.name, s.value
        FROM "flight" f
        CROSS JOIN LATERAL jsonb_each(
            CASE WHEN jsonb_typeof(f."timesheet") = 'object' THEN f."timesheet" ELSE '{}'::jsonb END
        ) AS s(name, value)
    ),
    times AS (
        SELECT s."id", t.name, t.value
        FROM schedules s
        CROSS JOIN LATERAL jsonb_each(
            CASE WHEN jsonb_typeof(s.value) = 'object' THEN s.value ELSE '{}'::jsonb END
        ) AS t(name, value)
    )
    SELECT
        (SELECT count(*) FROM "flight" WHERE jsonb_typeof("timesheet") NOT IN ('object', 'null'))
        + (SELECT count(*) FROM schedules
           WHERE jsonb_typeof(value) <> 'null'
             AND (name NOT IN ('scheduled', 'estimated', 'actual', 'predicted')
                  OR jsonb_typeof(value) <> 'object'))
        + (SELECT count(*) FROM times
           WHERE jsonb_typeof(value) <> 'null'
             AND (name NOT IN ('offBlockTime', 'takeoffTime', 'arrivalTime', 'onBlockTime')
                  OR jsonb_typeof(value) <> 'string'))
    INTO leftovers;

    IF leftovers > 0 THEN
        RAISE EXCEPTION
            'flight.timesheet holds % entries the time columns cannot take; nothing was copied', leftovers;
    END IF;

    UPDATE "flight" SET
        "scheduledOffBlockTime" = ("timesheet" #>> '{scheduled,offBlockTime}')::timestamptz AT TIME ZONE 'UTC',
        "scheduledTakeoffTime"  = ("timesheet" #>> '{scheduled,takeoffTime}')::timestamptz AT TIME ZONE 'UTC',
        "scheduledArrivalTime"  = ("timesheet" #>> '{scheduled,arrivalTime}')::timestamptz AT TIME ZONE 'UTC',
        "scheduledOnBlockTime"  = ("timesheet" #>> '{scheduled,onBlockTime}')::timestamptz AT TIME ZONE 'UTC',
        "estimatedOffBlockTime" = ("timesheet" #>> '{estimated,offBlockTime}')::timestamptz AT TIME ZONE 'UTC',
        "estimatedTakeoffTime"  = ("timesheet" #>> '{estimated,takeoffTime}')::timestamptz AT TIME ZONE 'UTC',
        "estimatedArrivalTime"  = ("timesheet" #>> '{estimated,arrivalTime}')::timestamptz AT TIME ZONE 'UTC',
        "estimatedOnBlockTime"  = ("timesheet" #>> '{estimated,onBlockTime}')::timestamptz AT TIME ZONE 'UTC',
        "actualOffBlockTime"    = ("timesheet" #>> '{actual,offBlockTime}')::timestamptz AT TIME ZONE 'UTC',
        "actualTakeoffTime"     = ("timesheet" #>> '{actual,takeoffTime}')::timestamptz AT TIME ZONE 'UTC',
        "actualArrivalTime"     = ("timesheet" #>> '{actual,arrivalTime}')::timestamptz AT TIME ZONE 'UTC',
        "actualOnBlockTime"     = ("timesheet" #>> '{actual,onBlockTime}')::timestamptz AT TIME ZONE 'UTC',
        "predictedOffBlockTime" = ("timesheet" #>> '{predicted,offBlockTime}')::timestamptz AT TIME ZONE 'UTC',
        "predictedTakeoffTime"  = ("timesheet" #>> '{predicted,takeoffTime}')::timestamptz AT TIME ZONE 'UTC',
        "predictedArrivalTime"  = ("timesheet" #>> '{predicted,arrivalTime}')::timestamptz AT TIME ZONE 'UTC',
        "predictedOnBlockTime"  = ("timesheet" #>> '{predicted,onBlockTime}')::timestamptz AT TIME ZONE 'UTC';

    ALTER TABLE "flight" DROP COLUMN "timesheet";
END $$;

-- CreateIndex
CREATE INDEX "flight_scheduledOffBlockTime_idx" ON "flight"("scheduledOffBlockTime");

-- CreateIndex
CREATE INDEX "flight_actualOnBlockTime_idx" ON "flight"("actualOnBlockTime");
