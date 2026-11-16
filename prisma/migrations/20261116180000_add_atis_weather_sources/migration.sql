-- AlterEnum
ALTER TYPE "WeatherSource" ADD VALUE 'faa_datis';
ALTER TYPE "WeatherSource" ADD VALUE 'atis_guru';
ALTER TYPE "WeatherSource" ADD VALUE 'vatsim';

-- AlterEnum
ALTER TYPE "WeatherInformationType" ADD VALUE 'atis_arrival' BEFORE 'metar';
ALTER TYPE "WeatherInformationType" ADD VALUE 'atis_departure' BEFORE 'metar';

-- AlterTable
ALTER TABLE "airport_weather" ADD COLUMN "publishedAt" TIMESTAMP(3);
