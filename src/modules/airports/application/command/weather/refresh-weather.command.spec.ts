import {
  RefreshWeatherCommand,
  RefreshWeatherHandler,
} from './refresh-weather.command';
import {
  WeatherInformationType,
  WeatherSource,
} from '../../../model/airport-weather.model';
import { AtisKind } from '../../../../../core/provider/atis/published-atis';

const WARSAW = { airportId: 'a1', icaoCode: 'EPWA' };
const FRANKFURT = { airportId: 'a2', icaoCode: 'EDDF' };
const NOW = new Date('2026-11-16T16:20:00.000Z');
const ISSUED = new Date('2026-11-16T15:50:00.000Z');

describe('RefreshWeatherHandler', () => {
  let weatherRepository: { saveReports: jest.Mock; replaceReports: jest.Mock };
  let airportsRepository: { listMonitored: jest.Mock; getIcaoCodes: jest.Mock };
  let weatherClient: { fetchMetar: jest.Mock; fetchTaf: jest.Mock };
  let sayIntentionsClient: { fetchWeather: jest.Mock };
  let faaDatisClient: { fetchAtis: jest.Mock };
  let atisGuruClient: { fetchAtis: jest.Mock };
  let vatsimClient: { fetchAtis: jest.Mock };
  let handler: RefreshWeatherHandler;

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW, doNotFake: ['setTimeout', 'setImmediate'] });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    weatherRepository = {
      saveReports: jest.fn().mockResolvedValue(undefined),
      replaceReports: jest.fn().mockResolvedValue(undefined),
    };
    airportsRepository = {
      listMonitored: jest.fn().mockResolvedValue([WARSAW, FRANKFURT]),
      getIcaoCodes: jest.fn().mockResolvedValue([WARSAW]),
    };
    weatherClient = {
      fetchMetar: jest.fn().mockResolvedValue(
        new Map([
          ['EPWA', 'METAR EPWA'],
          ['EDDF', 'METAR EDDF'],
        ]),
      ),
      fetchTaf: jest.fn().mockResolvedValue(
        new Map([
          ['EPWA', 'TAF EPWA'],
          ['EDDF', 'TAF EDDF'],
        ]),
      ),
    };
    sayIntentionsClient = {
      fetchWeather: jest.fn().mockResolvedValue({
        metar: 'EPWA raw',
        taf: 'TAF raw',
        atis: 'information Sierra',
      }),
    };

    faaDatisClient = { fetchAtis: jest.fn().mockResolvedValue(new Map()) };
    atisGuruClient = { fetchAtis: jest.fn().mockResolvedValue([]) };
    vatsimClient = { fetchAtis: jest.fn().mockResolvedValue(new Map()) };

    handler = new RefreshWeatherHandler(
      weatherRepository as never,
      airportsRepository as never,
      weatherClient as never,
      sayIntentionsClient as never,
      faaDatisClient as never,
      atisGuruClient as never,
      vatsimClient as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function replacedWith(source: WeatherSource, airportId: string) {
    const calls = weatherRepository.replaceReports.mock.calls.filter(
      (call) => call[0] === airportId && call[1] === source,
    );

    return calls.length === 0
      ? undefined
      : (calls[calls.length - 1][2] as {
          informationType: WeatherInformationType;
          content: string;
          publishedAt: Date | null;
        }[]);
  }

  function savedFor(source: WeatherSource, airportId: string) {
    return weatherRepository.saveReports.mock.calls
      .filter((call) => call[0] === airportId && call[1] === source)
      .flatMap((call) => call[2])
      .map((report) => report.informationType);
  }

  it('makes no upstream request when nothing is monitored', async () => {
    airportsRepository.listMonitored.mockResolvedValue([]);

    await handler.execute(new RefreshWeatherCommand());

    expect(weatherClient.fetchMetar).not.toHaveBeenCalled();
    expect(sayIntentionsClient.fetchWeather).not.toHaveBeenCalled();
    expect(faaDatisClient.fetchAtis).not.toHaveBeenCalled();
    expect(atisGuruClient.fetchAtis).not.toHaveBeenCalled();
    expect(vatsimClient.fetchAtis).not.toHaveBeenCalled();
    expect(weatherRepository.saveReports).not.toHaveBeenCalled();
    expect(weatherRepository.replaceReports).not.toHaveBeenCalled();
  });

  it('stores reports from both sources for every monitored airport', async () => {
    await handler.execute(new RefreshWeatherCommand());

    expect(savedFor(WeatherSource.AviationWeatherGov, 'a1')).toEqual([
      WeatherInformationType.Metar,
      WeatherInformationType.Taf,
    ]);
    expect(savedFor(WeatherSource.SayIntentions, 'a1')).toEqual([
      WeatherInformationType.Atis,
      WeatherInformationType.Metar,
      WeatherInformationType.Taf,
    ]);
    expect(savedFor(WeatherSource.SayIntentions, 'a2')).toHaveLength(3);
  });

  it('batches aviationweather.gov into one call per information type', async () => {
    await handler.execute(new RefreshWeatherCommand());

    expect(weatherClient.fetchMetar).toHaveBeenCalledTimes(1);
    expect(weatherClient.fetchMetar).toHaveBeenCalledWith(['EPWA', 'EDDF']);
    expect(weatherClient.fetchTaf).toHaveBeenCalledTimes(1);
    expect(sayIntentionsClient.fetchWeather).toHaveBeenCalledTimes(2);
  });

  it('stores only the information types a source actually published', async () => {
    sayIntentionsClient.fetchWeather.mockResolvedValue({
      metar: 'EPWA raw',
      atis: 'information Sierra',
    });

    await handler.execute(new RefreshWeatherCommand());

    expect(savedFor(WeatherSource.SayIntentions, 'a1')).toEqual([
      WeatherInformationType.Atis,
      WeatherInformationType.Metar,
    ]);
  });

  it('keeps storing one source when the other is unreachable', async () => {
    weatherClient.fetchMetar.mockRejectedValue(new Error('agov down'));

    await expect(
      handler.execute(new RefreshWeatherCommand()),
    ).resolves.toBeUndefined();

    expect(savedFor(WeatherSource.AviationWeatherGov, 'a1')).toEqual([]);
    expect(savedFor(WeatherSource.SayIntentions, 'a1')).toHaveLength(3);
  });

  it('keeps refreshing the remaining airports when one fails', async () => {
    sayIntentionsClient.fetchWeather.mockImplementation((icao: string) =>
      icao === 'EPWA'
        ? Promise.reject(new Error('rate limited'))
        : Promise.resolve({ metar: 'EDDF raw' }),
    );

    await handler.execute(new RefreshWeatherCommand());

    expect(savedFor(WeatherSource.SayIntentions, 'a1')).toEqual([]);
    expect(savedFor(WeatherSource.SayIntentions, 'a2')).toEqual([
      WeatherInformationType.Metar,
    ]);
  });

  it('refreshes only the airports the command names', async () => {
    await handler.execute(new RefreshWeatherCommand(['a1']));

    expect(airportsRepository.listMonitored).not.toHaveBeenCalled();
    expect(airportsRepository.getIcaoCodes).toHaveBeenCalledWith(['a1']);
    expect(sayIntentionsClient.fetchWeather).toHaveBeenCalledTimes(1);
  });

  it('stores the FAA D-ATIS of each kind an airport publishes', async () => {
    faaDatisClient.fetchAtis.mockResolvedValue(
      new Map([
        [
          'EPWA',
          [
            {
              kind: AtisKind.Arrival,
              content: 'ARR INFO A',
              publishedAt: ISSUED,
            },
            {
              kind: AtisKind.Departure,
              content: 'DEP INFO B',
              publishedAt: ISSUED,
            },
          ],
        ],
      ]),
    );

    await handler.execute(new RefreshWeatherCommand());

    expect(faaDatisClient.fetchAtis).toHaveBeenCalledWith(['EPWA', 'EDDF']);
    expect(replacedWith(WeatherSource.FaaDatis, 'a1')).toEqual([
      {
        informationType: WeatherInformationType.AtisArrival,
        content: 'ARR INFO A',
        lastFetched: NOW,
        publishedAt: ISSUED,
      },
      {
        informationType: WeatherInformationType.AtisDeparture,
        content: 'DEP INFO B',
        lastFetched: NOW,
        publishedAt: ISSUED,
      },
    ]);
  });

  it('clears the ATIS of an airport a source no longer publishes for', async () => {
    vatsimClient.fetchAtis.mockResolvedValue(
      new Map([
        [
          'EDDF',
          [{ kind: AtisKind.Combined, content: 'INFO T', publishedAt: ISSUED }],
        ],
      ]),
    );

    await handler.execute(new RefreshWeatherCommand());

    expect(replacedWith(WeatherSource.Vatsim, 'a1')).toEqual([]);
    expect(replacedWith(WeatherSource.Vatsim, 'a2')).toEqual([
      {
        informationType: WeatherInformationType.Atis,
        content: 'INFO T',
        lastFetched: NOW,
        publishedAt: ISSUED,
      },
    ]);
  });

  it('keeps the first ATIS when a source repeats a kind', async () => {
    vatsimClient.fetchAtis.mockResolvedValue(
      new Map([
        [
          'EPWA',
          [
            { kind: AtisKind.Combined, content: 'INFO A', publishedAt: null },
            { kind: AtisKind.Combined, content: 'INFO B', publishedAt: null },
          ],
        ],
      ]),
    );

    await handler.execute(new RefreshWeatherCommand());

    expect(
      replacedWith(WeatherSource.Vatsim, 'a1')?.map((report) => report.content),
    ).toEqual(['INFO A']);
  });

  it('leaves stored ATIS alone when a source cannot be reached', async () => {
    faaDatisClient.fetchAtis.mockRejectedValue(new Error('atis.info down'));

    await expect(
      handler.execute(new RefreshWeatherCommand()),
    ).resolves.toBeUndefined();

    expect(replacedWith(WeatherSource.FaaDatis, 'a1')).toBeUndefined();
    expect(replacedWith(WeatherSource.Vatsim, 'a1')).toEqual([]);
  });

  it('asks atis.guru for each airport and keeps ATIS received in the last 6 hours', async () => {
    atisGuruClient.fetchAtis.mockImplementation((icao: string) =>
      Promise.resolve(
        icao === 'EPWA'
          ? [
              {
                kind: AtisKind.Arrival,
                content: 'ARR C',
                publishedAt: new Date('2026-11-16T10:20:00.000Z'),
              },
              {
                kind: AtisKind.Departure,
                content: 'DEP V',
                publishedAt: new Date('2026-11-16T10:19:00.000Z'),
              },
              {
                kind: AtisKind.Combined,
                content: 'UNDATED',
                publishedAt: null,
              },
            ]
          : [],
      ),
    );

    await handler.execute(new RefreshWeatherCommand());

    expect(atisGuruClient.fetchAtis).toHaveBeenCalledTimes(2);
    expect(
      replacedWith(WeatherSource.AtisGuru, 'a1')?.map(
        (report) => report.informationType,
      ),
    ).toEqual([WeatherInformationType.AtisArrival]);
    expect(replacedWith(WeatherSource.AtisGuru, 'a2')).toEqual([]);
  });

  it('keeps refreshing atis.guru for the other airports when one page fails', async () => {
    atisGuruClient.fetchAtis.mockImplementation((icao: string) =>
      icao === 'EPWA'
        ? Promise.reject(new Error('unrecognised page'))
        : Promise.resolve([
            { kind: AtisKind.Arrival, content: 'ARR X', publishedAt: NOW },
          ]),
    );

    await handler.execute(new RefreshWeatherCommand());

    expect(replacedWith(WeatherSource.AtisGuru, 'a1')).toBeUndefined();
    expect(replacedWith(WeatherSource.AtisGuru, 'a2')).toHaveLength(1);
  });

  it('keeps storing ATIS for the other airports when one write fails', async () => {
    vatsimClient.fetchAtis.mockResolvedValue(new Map());
    weatherRepository.replaceReports.mockImplementation(
      (airportId: string, source: WeatherSource) =>
        airportId === 'a1' && source === WeatherSource.Vatsim
          ? Promise.reject(new Error('deadlock'))
          : Promise.resolve(),
    );

    await handler.execute(new RefreshWeatherCommand());

    expect(replacedWith(WeatherSource.Vatsim, 'a2')).toEqual([]);
  });
});
