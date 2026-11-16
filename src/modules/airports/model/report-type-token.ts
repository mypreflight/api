import { WeatherInformationType } from './airport-weather.model';

const LEADING_TOKENS: Partial<Record<WeatherInformationType, RegExp>> = {
  [WeatherInformationType.Metar]: /^\s*METAR\s+(?=\S)/,
  [WeatherInformationType.Taf]: /^\s*TAF\s+(?=\S)/,
};

export function withoutReportTypeToken(
  informationType: WeatherInformationType,
  content: string,
): string {
  const token = LEADING_TOKENS[informationType];

  return token === undefined ? content : content.replace(token, '');
}
