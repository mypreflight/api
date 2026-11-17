import { AtisRunwaysResolver } from './atis-runways.resolver';
import {
  WeatherInformationType,
  WeatherSource,
} from '../../model/airport-weather.model';
import { WeatherReport } from '../database/airport-weather.repository';

const AIRPORT_ID = 'c03a79fb-c5ae-46c3-95fe-f3b5dc7b85f3';
const FETCHED = new Date('2026-11-17T10:00:00.000Z');

const RUNWAYS = [
  { id: 'id-04L', designator: '04L' },
  { id: 'id-04R', designator: '04R' },
  { id: 'id-09', designator: '09' },
  { id: 'id-27', designator: '27' },
  { id: 'id-33L', designator: '33L' },
];

const CLEAR_ATIS = 'BOS ATIS INFO E 1154Z. ILS RY 4R APCH IN USE. DEPG RY 9.';
const UNCLEAR_ATIS = 'BOS ATIS INFO F 1254Z. OPS AND INFO, RWY 27.';

function atis(
  content: string,
  informationType = WeatherInformationType.Atis,
): WeatherReport {
  return { informationType, content, lastFetched: FETCHED, publishedAt: null };
}

describe('AtisRunwaysResolver', () => {
  let weatherRepository: { findAtisResolutions: jest.Mock };
  let runwaysRepository: { findAll: jest.Mock };
  let openAiClient: { createStructuredResponse: jest.Mock };
  let resolver: AtisRunwaysResolver;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    weatherRepository = {
      findAtisResolutions: jest.fn().mockResolvedValue([]),
    };
    runwaysRepository = { findAll: jest.fn().mockResolvedValue(RUNWAYS) };
    openAiClient = {
      createStructuredResponse: jest
        .fn()
        .mockResolvedValue({ arrival: ['27'], departure: ['27'] }),
    };
    resolver = new AtisRunwaysResolver(
      weatherRepository as never,
      runwaysRepository as never,
      openAiClient as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('leaves METAR and TAF alone without reading anything', async () => {
    const metar: WeatherReport = {
      informationType: WeatherInformationType.Metar,
      content: 'KBOS 081154Z 21009KT 10SM FEW040 24/16 A3000',
      lastFetched: FETCHED,
      publishedAt: null,
    };

    await expect(
      resolver.resolve(AIRPORT_ID, 'KBOS', WeatherSource.AviationWeatherGov, [
        metar,
      ]),
    ).resolves.toEqual([metar]);
    expect(weatherRepository.findAtisResolutions).not.toHaveBeenCalled();
  });

  it('reads a clear ATIS without asking the language model', async () => {
    const [report] = await resolver.resolve(
      AIRPORT_ID,
      'KBOS',
      WeatherSource.FaaDatis,
      [atis(CLEAR_ATIS)],
    );

    expect(report.runways).toEqual({
      arrival: ['id-04R'],
      departure: ['id-09'],
      resolved: true,
    });
    expect(openAiClient.createStructuredResponse).not.toHaveBeenCalled();
  });

  it('keeps the stored runways of an ATIS that has not changed', async () => {
    weatherRepository.findAtisResolutions.mockResolvedValue([
      {
        informationType: WeatherInformationType.Atis,
        content: CLEAR_ATIS,
        runwaysResolved: true,
      },
    ]);

    const [report] = await resolver.resolve(
      AIRPORT_ID,
      'KBOS',
      WeatherSource.FaaDatis,
      [atis(CLEAR_ATIS)],
    );

    expect(report.runways).toBeUndefined();
    expect(runwaysRepository.findAll).not.toHaveBeenCalled();
  });

  it('asks the language model about an unclear ATIS, offering only the airport runways', async () => {
    const [report] = await resolver.resolve(
      AIRPORT_ID,
      'KBOS',
      WeatherSource.Vatsim,
      [atis(UNCLEAR_ATIS)],
    );

    expect(report.runways).toEqual({
      arrival: ['id-27'],
      departure: ['id-27'],
      resolved: true,
    });

    const [request] = openAiClient.createStructuredResponse.mock.calls[0];
    expect(request.model).toBe('gpt-6-luna');
    expect(request.input).toContain(UNCLEAR_ATIS);
    expect(request.input).toContain('ATIS for: arrivals and departures');
    expect(request.schema.properties.arrival.items.enum).toEqual([
      '04L',
      '04R',
      '09',
      '27',
      '33L',
    ]);
  });

  it('drops runways the language model names that the airport does not have', async () => {
    openAiClient.createStructuredResponse.mockResolvedValue({
      arrival: ['27', '28', '27'],
      departure: [],
    });

    const [report] = await resolver.resolve(
      AIRPORT_ID,
      'KBOS',
      WeatherSource.Vatsim,
      [atis(UNCLEAR_ATIS)],
    );

    expect(report.runways).toEqual({
      arrival: ['id-27'],
      departure: [],
      resolved: true,
    });
  });

  it('asks again about an unchanged ATIS the language model could not answer before', async () => {
    weatherRepository.findAtisResolutions.mockResolvedValue([
      {
        informationType: WeatherInformationType.Atis,
        content: UNCLEAR_ATIS,
        runwaysResolved: false,
      },
    ]);

    const [report] = await resolver.resolve(
      AIRPORT_ID,
      'KBOS',
      WeatherSource.Vatsim,
      [atis(UNCLEAR_ATIS)],
    );

    expect(report.runways?.resolved).toBe(true);
    expect(openAiClient.createStructuredResponse).toHaveBeenCalledTimes(1);
  });

  it('keeps its own reading unresolved and pauses the language model when it fails', async () => {
    openAiClient.createStructuredResponse.mockRejectedValue(
      new Error('OpenAI answered 503'),
    );

    const [first] = await resolver.resolve(
      AIRPORT_ID,
      'KBOS',
      WeatherSource.Vatsim,
      [atis(UNCLEAR_ATIS)],
    );
    const [second] = await resolver.resolve(
      AIRPORT_ID,
      'KBOS',
      WeatherSource.AtisGuru,
      [atis(UNCLEAR_ATIS)],
    );

    expect(first.runways).toEqual({
      arrival: ['id-27'],
      departure: ['id-27'],
      resolved: false,
    });
    expect(second.runways?.resolved).toBe(false);
    expect(openAiClient.createStructuredResponse).toHaveBeenCalledTimes(1);
  });

  it('leaves the reports as they are when the runways cannot be read', async () => {
    runwaysRepository.findAll.mockRejectedValue(new Error('connection lost'));
    const report = atis(CLEAR_ATIS);

    await expect(
      resolver.resolve(AIRPORT_ID, 'KBOS', WeatherSource.FaaDatis, [report]),
    ).resolves.toEqual([report]);
  });
});
