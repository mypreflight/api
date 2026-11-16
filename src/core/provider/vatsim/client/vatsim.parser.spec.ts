import { parseVatsimAtis } from './vatsim.parser';
import { AtisKind } from '../../atis/published-atis';

describe('parseVatsimAtis', () => {
  const entries = [
    {
      callsign: 'EDDF_A_ATIS',
      atis_code: 'T',
      text_atis: ['ARR-ATIS EDDF T', ' TRL 70 ', '', 'QNH1006'],
      last_updated: '2026-11-16T16:19:05.7342242Z',
    },
    {
      callsign: 'EDDF_D_ATIS',
      atis_code: 'R',
      text_atis: ['DEP-ATIS EDDF R'],
      last_updated: '2026-11-16T16:18:41Z',
    },
    {
      callsign: 'KJFK_ATIS',
      atis_code: 'H',
      text_atis: ['KJFK ATIS INFO H 1551Z.'],
      last_updated: null,
    },
    {
      callsign: 'EGKK_ATIS',
      text_atis: ['EGKK COM ATIS T.'],
      last_updated: '2026-11-16T16:19:02Z',
    },
  ];

  it('reads the airport and kind from the callsign', () => {
    const atis = parseVatsimAtis(entries, ['EDDF', 'KJFK']);

    expect(atis.get('EDDF')).toEqual([
      {
        kind: AtisKind.Arrival,
        content: 'ARR-ATIS EDDF T\nTRL 70\nQNH1006',
        publishedAt: new Date('2026-11-16T16:19:05.734Z'),
      },
      {
        kind: AtisKind.Departure,
        content: 'DEP-ATIS EDDF R',
        publishedAt: new Date('2026-11-16T16:18:41.000Z'),
      },
    ]);
    expect(atis.get('KJFK')).toEqual([
      {
        kind: AtisKind.Combined,
        content: 'KJFK ATIS INFO H 1551Z.',
        publishedAt: null,
      },
    ]);
    expect(atis.has('EGKK')).toBe(false);
  });

  it('accepts the long arrival and departure suffixes', () => {
    const atis = parseVatsimAtis(
      [
        { callsign: 'EPWA_ARR_ATIS', text_atis: ['ARR'] },
        { callsign: 'EPWA_DEP_ATIS', text_atis: ['DEP'] },
      ],
      ['EPWA'],
    );

    expect(atis.get('EPWA')?.map((report) => report.kind)).toEqual([
      AtisKind.Arrival,
      AtisKind.Departure,
    ]);
  });

  it('skips stations that are not ATIS or carry no text', () => {
    const atis = parseVatsimAtis(
      [
        { callsign: 'EPWA_TWR', text_atis: ['TOWER'] },
        { callsign: 'EPWA_ATIS', text_atis: null },
        { callsign: 'EPWA_X_ATIS', text_atis: ['ODD'] },
        { callsign: null, text_atis: ['NO CALLSIGN'] },
      ],
      ['EPWA'],
    );

    expect(atis.size).toBe(0);
  });
});
