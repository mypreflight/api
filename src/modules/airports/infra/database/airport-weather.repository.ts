import { Injectable } from '@nestjs/common';
import { Prisma } from 'prisma/client/client';
import { PrismaService } from '../../../../core/provider/prisma/prisma.service';
import {
  WeatherInformationType,
  WeatherSource,
} from '../../model/airport-weather.model';

const selectWeather = {
  id: true,
  source: true,
  informationType: true,
  content: true,
  lastFetched: true,
  publishedAt: true,
} as const satisfies Prisma.AirportWeatherSelect;

export type AirportWeatherView = Prisma.AirportWeatherGetPayload<{
  select: typeof selectWeather;
}>;

export type WeatherReport = {
  informationType: WeatherInformationType;
  content: string;
  lastFetched: Date;
  publishedAt: Date | null;
};

@Injectable()
export class AirportWeatherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAirportId(
    airportId: string,
    source?: WeatherSource,
  ): Promise<AirportWeatherView[]> {
    return this.prisma.airportWeather.findMany({
      where: { airportId, ...(source && { source }) },
      orderBy: [{ source: 'asc' }, { informationType: 'asc' }],
      select: selectWeather,
    });
  }

  async findLatestMetarByIataCode(iataCode: string): Promise<string | null> {
    const report = await this.prisma.airportWeather.findFirst({
      where: {
        airport: { iataCode },
        informationType: WeatherInformationType.Metar,
      },
      orderBy: { lastFetched: 'desc' },
      select: { content: true },
    });

    return report?.content ?? null;
  }

  async saveReports(
    airportId: string,
    source: WeatherSource,
    reports: WeatherReport[],
  ): Promise<void> {
    if (reports.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      reports.map((report) => this.upsert(airportId, source, report)),
    );
  }

  async replaceReports(
    airportId: string,
    source: WeatherSource,
    reports: WeatherReport[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.airportWeather.deleteMany({
        where: {
          airportId,
          source,
          informationType: {
            notIn: reports.map((report) => report.informationType),
          },
        },
      }),
      ...reports.map((report) => this.upsert(airportId, source, report)),
    ]);
  }

  private upsert(
    airportId: string,
    source: WeatherSource,
    report: WeatherReport,
  ) {
    return this.prisma.airportWeather.upsert({
      where: {
        airportId_source_informationType: {
          airportId,
          source,
          informationType: report.informationType,
        },
      },
      create: {
        airportId,
        source,
        informationType: report.informationType,
        content: report.content,
        lastFetched: report.lastFetched,
        publishedAt: report.publishedAt,
      },
      update: {
        content: report.content,
        lastFetched: report.lastFetched,
        publishedAt: report.publishedAt,
      },
    });
  }
}
