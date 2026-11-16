import { ApiProperty } from '@nestjs/swagger';

export enum WeatherSource {
  AviationWeatherGov = 'aviation_weather_gov',
  SayIntentions = 'say_intentions',
  FaaDatis = 'faa_datis',
  AtisGuru = 'atis_guru',
  Vatsim = 'vatsim',
}

export enum WeatherInformationType {
  Atis = 'atis',
  AtisArrival = 'atis_arrival',
  AtisDeparture = 'atis_departure',
  Metar = 'metar',
  Taf = 'taf',
}

export class GetAirportWeatherResponse {
  @ApiProperty({
    description: 'Report unique identifier',
    example: '9d1f4c6a-70b6-4a3e-8a4b-4c2d2f8e6b11',
  })
  id!: string;

  @ApiProperty({
    description: 'Provider that published the report',
    example: WeatherSource.AviationWeatherGov,
    enum: WeatherSource,
  })
  source!: WeatherSource;

  @ApiProperty({
    description:
      'Kind of report. `atis` is the one ATIS of an airport that publishes a single ATIS; `atis_arrival` and `atis_departure` are the separate ATIS of an airport that publishes one for arrivals and one for departures. aviationweather.gov provides METAR and TAF; SayIntentions provides METAR, TAF and its own ATIS; FAA D-ATIS, atis.guru and VATSIM provide ATIS only.',
    example: WeatherInformationType.Metar,
    enum: WeatherInformationType,
  })
  informationType!: WeatherInformationType;

  @ApiProperty({
    description:
      'Report as the provider returned it, less a leading METAR or TAF token, which repeats the information type. Coded text for METAR and TAF, spoken text for ATIS. A SPECI token, and an AMD or COR marker after the type, are kept.',
    example: 'EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG',
  })
  content!: string;

  @ApiProperty({
    description: 'When the system last fetched the report from its provider',
    example: '2026-08-10T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  lastFetched!: Date;

  @ApiProperty({
    description:
      'When the provider says it published or received the report: the issue time of an FAA D-ATIS, when an aircraft last requested an atis.guru ATIS, when a VATSIM ATIS was last updated. Null for aviationweather.gov and SayIntentions, which do not say.',
    example: '2026-08-10T10:20:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  publishedAt!: Date | null;
}
