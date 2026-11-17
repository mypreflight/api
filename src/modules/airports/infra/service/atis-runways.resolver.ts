import { Injectable, Logger } from '@nestjs/common';
import { OpenAiClient } from '../../../../core/provider/openai/client/openai.client';
import {
  AirportWeatherRepository,
  AtisRunways,
  WeatherReport,
} from '../database/airport-weather.repository';
import { RunwaysRepository } from '../database/runways.repository';
import {
  WeatherInformationType,
  WeatherSource,
} from '../../model/airport-weather.model';
import { readAtisRunways } from '../../model/atis-runways';
import { getErrorMessage } from '../../../../core/utils/error-message';

const LANGUAGE_MODEL = 'gpt-6-luna';
const LANGUAGE_MODEL_PAUSE_MS = 5 * 60 * 1000;
const MAX_OUTPUT_TOKENS = 200;

const ATIS_SERVES: Partial<Record<WeatherInformationType, string>> = {
  [WeatherInformationType.Atis]: 'arrivals and departures',
  [WeatherInformationType.AtisArrival]: 'arrivals',
  [WeatherInformationType.AtisDeparture]: 'departures',
};

const INSTRUCTIONS = [
  "You read an airport's ATIS and say which of the airport's runways it puts in use for arrivals (landing) and which for departures (take-off).",
  "Answer only with designators from the airport's runway list. Map the ATIS wording onto them: 4R, RWY 04 RIGHT and runway four right are all 04R.",
  'Count a runway only where the ATIS says it is used for landing or take-off, or is in use. Ignore runways named only as closed, out of service, for holding short, crossing, taxiing, vacating, wind, surface condition or equipment, and anything in the NOTAMs.',
  'A runway the ATIS puts in use without saying for what counts for both on an ATIS that serves both, and for its own operation on an ATIS that serves only arrivals or only departures.',
  'Leave a list empty when the ATIS does not say.',
].join('\n');

type RunwayDesignators = {
  arrival: string[];
  departure: string[];
};

@Injectable()
export class AtisRunwaysResolver {
  private readonly logger = new Logger(AtisRunwaysResolver.name);
  private languageModelPausedUntil = 0;

  constructor(
    private readonly weatherRepository: AirportWeatherRepository,
    private readonly runwaysRepository: RunwaysRepository,
    private readonly openAiClient: OpenAiClient,
  ) {}

  async resolve(
    airportId: string,
    icaoCode: string,
    source: WeatherSource,
    reports: WeatherReport[],
  ): Promise<WeatherReport[]> {
    if (!reports.some((report) => ATIS_SERVES[report.informationType])) {
      return reports;
    }

    try {
      const stored = await this.weatherRepository.findAtisResolutions(
        airportId,
        source,
      );
      const pending = reports.filter(
        (report) =>
          ATIS_SERVES[report.informationType] &&
          !stored.some(
            (resolution) =>
              resolution.informationType === report.informationType &&
              resolution.content === report.content &&
              resolution.runwaysResolved,
          ),
      );

      if (pending.length === 0) {
        return reports;
      }

      const runways = await this.runwaysRepository.findAll(airportId);
      const runwayIds = new Map(
        runways.map((runway) => [runway.designator, runway.id]),
      );
      const resolved = new Map<WeatherReport, AtisRunways>();

      for (const report of pending) {
        const {
          arrival,
          departure,
          resolved: settled,
        } = await this.read(icaoCode, source, report, [...runwayIds.keys()]);

        resolved.set(report, {
          arrival: arrival.flatMap(
            (designator) => runwayIds.get(designator) ?? [],
          ),
          departure: departure.flatMap(
            (designator) => runwayIds.get(designator) ?? [],
          ),
          resolved: settled,
        });
      }

      return reports.map((report) =>
        resolved.has(report)
          ? { ...report, runways: resolved.get(report) }
          : report,
      );
    } catch (error) {
      this.logger.error(
        `Could not determine the runways in use at ${icaoCode} from ${source}: ${getErrorMessage(error)}`,
      );

      return reports;
    }
  }

  private async read(
    icaoCode: string,
    source: WeatherSource,
    report: WeatherReport,
    designators: string[],
  ): Promise<RunwayDesignators & { resolved: boolean }> {
    const reading = readAtisRunways(
      report.content,
      report.informationType,
      designators,
    );

    const { arrival, departure } = reading;

    if (reading.settled) {
      return { arrival, departure, resolved: true };
    }

    if (Date.now() < this.languageModelPausedUntil) {
      return { arrival, departure, resolved: false };
    }

    try {
      const answer =
        await this.openAiClient.createStructuredResponse<RunwayDesignators>({
          model: LANGUAGE_MODEL,
          reasoningEffort: 'none',
          instructions: INSTRUCTIONS,
          input: [
            `ATIS for: ${ATIS_SERVES[report.informationType]}`,
            `Airport runways: ${designators.join(', ')}`,
            'ATIS:',
            report.content,
          ].join('\n'),
          schemaName: 'runways_in_use',
          schema: schemaFor(designators),
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        });

      this.logger.log(
        `Read the runways in use at ${icaoCode} from its ${source} ${report.informationType} with ${LANGUAGE_MODEL}`,
      );

      return {
        arrival: knownOnly(answer.arrival, designators),
        departure: knownOnly(answer.departure, designators),
        resolved: true,
      };
    } catch (error) {
      this.languageModelPausedUntil = Date.now() + LANGUAGE_MODEL_PAUSE_MS;
      this.logger.warn(
        `Could not ask ${LANGUAGE_MODEL} for the runways in use at ${icaoCode}: ${getErrorMessage(error)}`,
      );

      return { arrival, departure, resolved: false };
    }
  }
}

function schemaFor(designators: string[]): Record<string, unknown> {
  const runways = {
    type: 'array',
    items: { type: 'string', enum: designators },
  };

  return {
    type: 'object',
    properties: { arrival: runways, departure: runways },
    required: ['arrival', 'departure'],
    additionalProperties: false,
  };
}

function knownOnly(answer: unknown, designators: string[]): string[] {
  if (!Array.isArray(answer)) {
    return [];
  }

  return [
    ...new Set(
      answer.filter(
        (designator): designator is string =>
          typeof designator === 'string' && designators.includes(designator),
      ),
    ),
  ];
}
