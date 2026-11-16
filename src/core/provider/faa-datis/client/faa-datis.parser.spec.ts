import { issuedAt, parseFaaDatis } from './faa-datis.parser';
import { AtisKind } from '../../atis/published-atis';

describe('parseFaaDatis', () => {
  const entries = [
    {
      airport: 'KBOS',
      type: 'combined',
      code: 'C',
      datis: ' BOS ATIS INFO C 1554Z. ...ADVS YOU HAVE INFO C. ',
      time: '1554',
      updatedAt: '2026-11-16T16:09:32.8839128Z',
    },
    {
      airport: 'KPHL',
      type: 'arr',
      code: 'H',
      datis: 'PHL ARR INFO H 1554Z.',
      time: '1554',
      updatedAt: '2026-11-16T16:19:07.478071Z',
    },
    {
      airport: 'KPHL',
      type: 'dep',
      code: 'U',
      datis: 'PHL DEP INFO U 1554Z.',
      time: '1554',
      updatedAt: '2026-11-16T16:19:08.5608226Z',
    },
    {
      airport: 'KATL',
      type: 'dep',
      datis: 'ATL DEP INFO N 1552Z.',
      time: '1552',
      updatedAt: '2026-11-16T16:19:07Z',
    },
  ];

  it('returns the ATIS of the requested airports only', () => {
    const atis = parseFaaDatis(entries, ['KBOS', 'KPHL']);

    expect([...atis.keys()]).toEqual(['KBOS', 'KPHL']);
    expect(atis.get('KBOS')).toEqual([
      {
        kind: AtisKind.Combined,
        content: 'BOS ATIS INFO C 1554Z. ...ADVS YOU HAVE INFO C.',
        publishedAt: new Date('2026-11-16T15:54:00.000Z'),
      },
    ]);
  });

  it('tells arrival and departure ATIS apart', () => {
    const atis = parseFaaDatis(entries, ['KPHL']);

    expect(atis.get('KPHL')?.map((report) => report.kind)).toEqual([
      AtisKind.Arrival,
      AtisKind.Departure,
    ]);
  });

  it('skips entries without text or with an unknown type', () => {
    const atis = parseFaaDatis(
      [
        { airport: 'KBOS', type: 'combined', datis: '   ' },
        { airport: 'KBOS', type: 'tower', datis: 'BOS TWR' },
        { airport: null, type: 'combined', datis: 'NO AIRPORT' },
      ],
      ['KBOS'],
    );

    expect(atis.size).toBe(0);
  });
});

describe('issuedAt', () => {
  it('dates the issue time on the day of the last update', () => {
    expect(issuedAt('1551', '2026-11-16T16:17:34.2605975Z')).toEqual(
      new Date('2026-11-16T15:51:00.000Z'),
    );
  });

  it('dates an issue time after the last update on the day before', () => {
    expect(issuedAt('2351', '2026-11-17T00:02:34Z')).toEqual(
      new Date('2026-11-16T23:51:00.000Z'),
    );
  });

  it('allows an issue time a few minutes after the last update', () => {
    expect(issuedAt('1630', '2026-11-16T16:25:00Z')).toEqual(
      new Date('2026-11-16T16:30:00.000Z'),
    );
  });

  it('answers null when either time is missing or malformed', () => {
    expect(issuedAt(undefined, '2026-11-16T16:25:00Z')).toBeNull();
    expect(issuedAt('1630', null)).toBeNull();
    expect(issuedAt('2561', '2026-11-16T16:25:00Z')).toBeNull();
    expect(issuedAt('16:30', '2026-11-16T16:25:00Z')).toBeNull();
    expect(issuedAt('1630', 'yesterday')).toBeNull();
  });
});
