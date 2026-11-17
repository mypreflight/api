import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { AirportWeatherRepository } from '../../../infra/database/airport-weather.repository';
import {
  AirportsRepository,
  WeatherAirport,
} from '../../../infra/database/airports.repository';
import { WeatherClient } from '../../../../../core/provider/weather/client/weather.client';
import { SayIntentionsClient } from '../../../../../core/provider/sayintentions/client/say-intentions.client';
import { FaaDatisClient } from '../../../../../core/provider/faa-datis/client/faa-datis.client';
import { AtisGuruClient } from '../../../../../core/provider/atis-guru/client/atis-guru.client';
import { VatsimClient } from '../../../../../core/provider/vatsim/client/vatsim.client';
import {
  AtisByIcao,
  AtisKind,
  PublishedAtis,
} from '../../../../../core/provider/atis/published-atis';
import {
  WeatherInformationType,
  WeatherSource,
} from '../../../model/airport-weather.model';
import { WeatherReport } from '../../../infra/database/airport-weather.repository';
import { withoutReportTypeToken } from '../../../model/report-type-token';
import { getErrorMessage } from '../../../../../core/utils/error-message';
import { AtisRunwaysResolver } from '../../../infra/service/atis-runways.resolver';

const SAY_INTENTIONS_CONCURRENCY = 4;
const ATIS_GURU_CONCURRENCY = 2;
const ATIS_GURU_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const ATIS_INFORMATION_TYPES: Record<AtisKind, WeatherInformationType> = {
  [AtisKind.Combined]: WeatherInformationType.Atis,
  [AtisKind.Arrival]: WeatherInformationType.AtisArrival,
  [AtisKind.Departure]: WeatherInformationType.AtisDeparture,
};

export class RefreshWeatherCommand {
  constructor(public readonly airportIds?: string[]) {}
}

@CommandHandler(RefreshWeatherCommand)
export class RefreshWeatherHandler implements ICommandHandler<RefreshWeatherCommand> {
  private readonly logger = new Logger(RefreshWeatherHandler.name);

  constructor(
    private readonly weatherRepository: AirportWeatherRepository,
    private readonly airportsRepository: AirportsRepository,
    private readonly weatherClient: WeatherClient,
    private readonly sayIntentionsClient: SayIntentionsClient,
    private readonly faaDatisClient: FaaDatisClient,
    private readonly atisGuruClient: AtisGuruClient,
    private readonly vatsimClient: VatsimClient,
    private readonly atisRunwaysResolver: AtisRunwaysResolver,
  ) {}

  async execute(command: RefreshWeatherCommand): Promise<void> {
    const airports = command.airportIds
      ? await this.airportsRepository.getIcaoCodes(command.airportIds)
      : await this.airportsRepository.listMonitored();

    if (airports.length === 0) {
      return;
    }

    const refreshes: [WeatherSource, Promise<void>][] = [
      [
        WeatherSource.AviationWeatherGov,
        this.refreshFromAviationWeatherGov(airports),
      ],
      [WeatherSource.SayIntentions, this.refreshFromSayIntentions(airports)],
      [WeatherSource.FaaDatis, this.refreshFromFaaDatis(airports)],
      [WeatherSource.AtisGuru, this.refreshFromAtisGuru(airports)],
      [WeatherSource.Vatsim, this.refreshFromVatsim(airports)],
    ];

    const results = await Promise.allSettled(
      refreshes.map(([, refresh]) => refresh),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const [source] = refreshes[index];

        this.logger.error(
          `Weather refresh from ${source} failed: ${getErrorMessage(result.reason)}`,
        );
      }
    });
  }

  private async refreshFromAviationWeatherGov(
    airports: WeatherAirport[],
  ): Promise<void> {
    const icaoCodes = airports.map((airport) => airport.icaoCode);
    const lastFetched = new Date();
    const [metars, tafs] = await Promise.all([
      this.weatherClient.fetchMetar(icaoCodes),
      this.weatherClient.fetchTaf(icaoCodes),
    ]);

    for (const { airportId, icaoCode } of airports) {
      const reports = this.collect(lastFetched, {
        [WeatherInformationType.Metar]: metars.get(icaoCode),
        [WeatherInformationType.Taf]: tafs.get(icaoCode),
      });

      await this.store(
        airportId,
        icaoCode,
        WeatherSource.AviationWeatherGov,
        reports,
      );
    }
  }

  private async refreshFromSayIntentions(
    airports: WeatherAirport[],
  ): Promise<void> {
    await this.inBatches(airports, SAY_INTENTIONS_CONCURRENCY, (airport) =>
      this.refreshAirportFromSayIntentions(airport),
    );
  }

  private async refreshAirportFromSayIntentions({
    airportId,
    icaoCode,
  }: WeatherAirport): Promise<void> {
    try {
      const lastFetched = new Date();
      const weather = await this.sayIntentionsClient.fetchWeather(icaoCode);

      const reports = this.collect(lastFetched, {
        [WeatherInformationType.Atis]: weather.atis,
        [WeatherInformationType.Metar]: weather.metar,
        [WeatherInformationType.Taf]: weather.taf,
      });

      await this.store(
        airportId,
        icaoCode,
        WeatherSource.SayIntentions,
        reports,
      );
    } catch (error) {
      this.logger.error(
        `Could not refresh ${WeatherSource.SayIntentions} weather for ${icaoCode}: ${getErrorMessage(error)}`,
      );
    }
  }

  private async refreshFromFaaDatis(airports: WeatherAirport[]): Promise<void> {
    const lastFetched = new Date();
    const atis = await this.faaDatisClient.fetchAtis(
      airports.map((airport) => airport.icaoCode),
    );

    await this.replaceAtisOfEach(
      airports,
      WeatherSource.FaaDatis,
      atis,
      lastFetched,
    );
  }

  private async refreshFromVatsim(airports: WeatherAirport[]): Promise<void> {
    const lastFetched = new Date();
    const atis = await this.vatsimClient.fetchAtis(
      airports.map((airport) => airport.icaoCode),
    );

    await this.replaceAtisOfEach(
      airports,
      WeatherSource.Vatsim,
      atis,
      lastFetched,
    );
  }

  private async refreshFromAtisGuru(airports: WeatherAirport[]): Promise<void> {
    await this.inBatches(airports, ATIS_GURU_CONCURRENCY, (airport) =>
      this.refreshAirportFromAtisGuru(airport),
    );
  }

  private async refreshAirportFromAtisGuru({
    airportId,
    icaoCode,
  }: WeatherAirport): Promise<void> {
    try {
      const lastFetched = new Date();
      const published = await this.atisGuruClient.fetchAtis(icaoCode);
      const recent = published.filter(
        ({ publishedAt }) =>
          publishedAt !== null &&
          lastFetched.getTime() - publishedAt.getTime() <= ATIS_GURU_MAX_AGE_MS,
      );

      await this.replaceAtis(
        airportId,
        icaoCode,
        WeatherSource.AtisGuru,
        recent,
        lastFetched,
      );
    } catch (error) {
      this.logger.error(
        `Could not refresh ${WeatherSource.AtisGuru} ATIS for ${icaoCode}: ${getErrorMessage(error)}`,
      );
    }
  }

  private async replaceAtisOfEach(
    airports: WeatherAirport[],
    source: WeatherSource,
    atis: AtisByIcao,
    lastFetched: Date,
  ): Promise<void> {
    for (const { airportId, icaoCode } of airports) {
      try {
        await this.replaceAtis(
          airportId,
          icaoCode,
          source,
          atis.get(icaoCode) ?? [],
          lastFetched,
        );
      } catch (error) {
        this.logger.error(
          `Could not store ${source} ATIS for ${icaoCode}: ${getErrorMessage(error)}`,
        );
      }
    }
  }

  private async replaceAtis(
    airportId: string,
    icaoCode: string,
    source: WeatherSource,
    published: PublishedAtis[],
    lastFetched: Date,
  ): Promise<void> {
    const byType = new Map<WeatherInformationType, WeatherReport>();

    for (const { kind, content, publishedAt } of published) {
      const informationType = ATIS_INFORMATION_TYPES[kind];

      if (!byType.has(informationType)) {
        byType.set(informationType, {
          informationType,
          content,
          lastFetched,
          publishedAt,
        });
      }
    }

    const reports = await this.atisRunwaysResolver.resolve(
      airportId,
      icaoCode,
      source,
      [...byType.values()],
    );
    await this.weatherRepository.replaceReports(airportId, source, reports);

    if (reports.length > 0) {
      this.logger.log(
        `Refreshed ${source} ${this.describe(reports)} for ${icaoCode}`,
      );
    }
  }

  private async inBatches<T>(
    items: T[],
    size: number,
    work: (item: T) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += size) {
      await Promise.all(items.slice(i, i + size).map(work));
    }
  }

  private collect(
    lastFetched: Date,
    contents: Partial<Record<WeatherInformationType, string | undefined>>,
  ): WeatherReport[] {
    return Object.entries(contents)
      .filter(([, content]) => content !== undefined)
      .map(([informationType, content]) => ({
        informationType: informationType as WeatherInformationType,
        content: withoutReportTypeToken(
          informationType as WeatherInformationType,
          content as string,
        ),
        lastFetched,
        publishedAt: null,
      }));
  }

  private async store(
    airportId: string,
    icaoCode: string,
    source: WeatherSource,
    reports: WeatherReport[],
  ): Promise<void> {
    if (reports.length === 0) {
      this.logger.warn(`No ${source} weather returned for ${icaoCode}`);
      return;
    }

    await this.weatherRepository.saveReports(
      airportId,
      source,
      await this.atisRunwaysResolver.resolve(
        airportId,
        icaoCode,
        source,
        reports,
      ),
    );
    this.logger.log(
      `Refreshed ${source} ${this.describe(reports)} for ${icaoCode}`,
    );
  }

  private describe(reports: WeatherReport[]): string {
    return reports
      .map((report) => report.informationType.toUpperCase())
      .join(' + ');
  }
}
