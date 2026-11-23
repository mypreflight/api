import { Continent } from '../../airports/model/airport.model';
import {
  NotocHeaderContext,
  emergencyTelephoneOf,
  notocHeaderFor,
} from './notoc-header';

function context(
  overrides: Partial<NotocHeaderContext> = {},
): NotocHeaderContext {
  return {
    flightId: '0b1c9d7e-4c38-4a3c-9d1e-0d7f4c3e2a11',
    flightNumber: 'BA178',
    scheduledOffBlock: new Date('2026-11-23T18:40:00.000Z'),
    operatorName: 'British Airways',
    operatorIataCode: 'BA',
    departure: {
      iataCode: 'JFK',
      city: 'New York',
      country: 'US',
      continent: Continent.NorthAmerica,
    },
    aircraftRegistration: 'G-STBA',
    aircraftType: 'B77W',
    ...overrides,
  };
}

const ISSUED_AT = new Date('2026-11-23T17:05:00.000Z');

describe('notocHeaderFor', () => {
  it('carries the flight, the port of loading and the aircraft', () => {
    expect(notocHeaderFor(context(), ISSUED_AT)).toMatchObject({
      operatorName: 'British Airways',
      flightNumber: 'BA178',
      flightDate: '2026-11-23',
      stationOfLoading: 'JFK',
      stationOfLoadingCity: 'New York',
      aircraftRegistration: 'G-STBA',
      aircraftType: 'B77W',
    });
  });

  it('dates an unscheduled flight by the moment it was issued', () => {
    const header = notocHeaderFor(
      context({ scheduledOffBlock: null }),
      ISSUED_AT,
    );

    expect(header.flightDate).toBe('2026-11-23');
  });

  it('names the same two people on every issue of one flight', () => {
    const first = notocHeaderFor(context(), ISSUED_AT);
    const second = notocHeaderFor(context(), new Date());

    expect(second.preparedBy).toBe(first.preparedBy);
    expect(second.loadingSupervisor).toBe(first.loadingSupervisor);
  });

  it('names two different people', () => {
    const header = notocHeaderFor(context(), ISSUED_AT);

    expect(header.preparedBy).not.toBe(header.loadingSupervisor);
  });

  it('writes names in the Latin alphabet at a station whose locale does not', () => {
    const header = notocHeaderFor(
      context({
        departure: {
          iataCode: 'PVG',
          city: 'Shanghai',
          country: 'CN',
          continent: Continent.Asia,
        },
      }),
      ISSUED_AT,
    );

    expect(header.preparedBy).toMatch(/^[\p{Script=Latin}\s.'-]+$/u);
    expect(header.loadingSupervisor).toMatch(/^[\p{Script=Latin}\s.'-]+$/u);
  });
});

describe('emergencyTelephoneOf', () => {
  it('draws from the range reserved for drama, so it reaches no one', () => {
    expect(emergencyTelephoneOf('BA')).toMatch(/^\+44 20 7946 0\d{3}$/);
  });

  it('gives an operator the same number every time', () => {
    expect(emergencyTelephoneOf('LH')).toBe(emergencyTelephoneOf('LH'));
  });
});
