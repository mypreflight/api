import { WeatherInformationType } from './airport-weather.model';
import { withoutReportTypeToken } from './report-type-token';

describe('withoutReportTypeToken', () => {
  it('drops the METAR token aviationweather.gov puts before the station', () => {
    expect(
      withoutReportTypeToken(
        WeatherInformationType.Metar,
        'METAR KBOS 161654Z 30008KT 10SM FEW050 10/M01 A3030',
      ),
    ).toBe('KBOS 161654Z 30008KT 10SM FEW050 10/M01 A3030');
  });

  it('drops the TAF token and keeps an amendment marker after it', () => {
    expect(
      withoutReportTypeToken(
        WeatherInformationType.Taf,
        'TAF AMD KBOS 161456Z 1615/1718 30010KT P6SM FEW050',
      ),
    ).toBe('AMD KBOS 161456Z 1615/1718 30010KT P6SM FEW050');
  });

  it('keeps SPECI, which says the observation was unscheduled', () => {
    expect(
      withoutReportTypeToken(
        WeatherInformationType.Metar,
        'SPECI EDDF 161620Z 24012G25KT 4000 TSRA',
      ),
    ).toBe('SPECI EDDF 161620Z 24012G25KT 4000 TSRA');
  });

  it('leaves a report that already starts with the station unchanged', () => {
    expect(
      withoutReportTypeToken(
        WeatherInformationType.Metar,
        'EPWA 101030Z 15009KT CAVOK 29/12 Q1013',
      ),
    ).toBe('EPWA 101030Z 15009KT CAVOK 29/12 Q1013');
  });

  it('leaves a TAF token inside a METAR alone', () => {
    expect(
      withoutReportTypeToken(
        WeatherInformationType.Metar,
        'TAF EDDF 1612/1718',
      ),
    ).toBe('TAF EDDF 1612/1718');
  });

  it('never touches ATIS text', () => {
    expect(
      withoutReportTypeToken(
        WeatherInformationType.Atis,
        'METAR information follows',
      ),
    ).toBe('METAR information follows');
  });

  it('keeps a lone token rather than storing an empty report', () => {
    expect(withoutReportTypeToken(WeatherInformationType.Taf, 'TAF')).toBe(
      'TAF',
    );
  });
});
