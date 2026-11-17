-- CreateEnum
CREATE TYPE "RunwayOperation" AS ENUM ('arrival', 'departure');

-- AlterTable
ALTER TABLE "airport_weather" ADD COLUMN     "runwaysResolved" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "airport_weather_runway" (
    "airportWeatherId" UUID NOT NULL,
    "runwayId" UUID NOT NULL,
    "operation" "RunwayOperation" NOT NULL,

    CONSTRAINT "airport_weather_runway_pkey" PRIMARY KEY ("airportWeatherId","runwayId","operation")
);

-- CreateIndex
CREATE INDEX "airport_weather_runway_runwayId_idx" ON "airport_weather_runway"("runwayId");

-- AddForeignKey
ALTER TABLE "airport_weather_runway" ADD CONSTRAINT "airport_weather_runway_airportWeatherId_fkey" FOREIGN KEY ("airportWeatherId") REFERENCES "airport_weather"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airport_weather_runway" ADD CONSTRAINT "airport_weather_runway_runwayId_fkey" FOREIGN KEY ("runwayId") REFERENCES "runway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
