import {
  parseAtisGuruPage,
  UnrecognisedAtisGuruPageError,
} from './atis-guru.parser';
import { AtisKind } from '../../atis/published-atis';

function card(title: string, subtitle: string | null, text: string): string {
  const received =
    subtitle === null
      ? ''
      : `<h6 class="card-subtitle mb-2 text-muted" data-placement="top" title="Requested by TEST01 (D-TEST)">${subtitle}</h6>`;

  return `<div class="card"><div class="card-body"><h5 class="card-title" data-toggle="tooltip">
      ${title}
    </h5>
    ${received}
    <div class="atis">${text}</div></div></div>`;
}

function page(streamed: string): string {
  return `<html><body><h1>D-ATIS for EDDF</h1><p><em>No ATIS available...</em></p>
    <blazor-ssr><template blazor-component-id="15">${streamed}</template></blazor-ssr></body></html>`;
}

describe('parseAtisGuruPage', () => {
  it('reads each ATIS card with the time it was received', () => {
    const html = page(
      card(
        'Arrival ATIS',
        '2026-11-16 16:18 UTC',
        'EDDF ARR ATIS X&#xA;1550Z&#xD;&#xA;RWY 25R 25L&#xD;&#xA;&#xD;&#xA;END OF ATIS X',
      ) +
        card(
          'Departure ATIS',
          '2026-11-16 15:09 UTC',
          'EDDF DEP ATIS A&#xA;&#x9;-RWY 25C 18&#xA;&#x9;-QNH1006 &amp; TEMPO',
        ) +
        card('METAR', null, 'METAR EDDF 161550Z AUTO 22006KT 9999'),
    );

    expect(parseAtisGuruPage(html)).toEqual([
      {
        kind: AtisKind.Arrival,
        content: 'EDDF ARR ATIS X\n1550Z\nRWY 25R 25L\n\nEND OF ATIS X',
        publishedAt: new Date('2026-11-16T16:18:00.000Z'),
      },
      {
        kind: AtisKind.Departure,
        content: 'EDDF DEP ATIS A\n\t-RWY 25C 18\n\t-QNH1006 & TEMPO',
        publishedAt: new Date('2026-11-16T15:09:00.000Z'),
      },
    ]);
  });

  it('reads a single ATIS card as the combined ATIS', () => {
    const html = page(card('ATIS', '2026-11-16 16:18 UTC', 'LKPR ATIS N'));

    expect(parseAtisGuruPage(html)).toEqual([
      {
        kind: AtisKind.Combined,
        content: 'LKPR ATIS N',
        publishedAt: new Date('2026-11-16T16:18:00.000Z'),
      },
    ]);
  });

  it('keeps an ATIS whose received time it cannot read, without a time', () => {
    const html = page(card('Arrival ATIS', 'yesterday', 'EDDF ARR ATIS X'));

    expect(parseAtisGuruPage(html)).toEqual([
      { kind: AtisKind.Arrival, content: 'EDDF ARR ATIS X', publishedAt: null },
    ]);
  });

  it('answers no ATIS for an airport atis.guru has none for', () => {
    const html = page(
      '<h1>D-ATIS for EPRZ</h1><p><em>No ATIS available...</em></p>',
    );

    expect(parseAtisGuruPage(html)).toEqual([]);
  });

  it('answers no ATIS when the page holds weather but no ATIS card', () => {
    const html = page(card('METAR', null, 'METAR EPRZ 161530Z 17007KT'));

    expect(parseAtisGuruPage(html)).toEqual([]);
  });

  it('rejects a page that is not an airport ATIS page', () => {
    expect(() =>
      parseAtisGuruPage('<html><body>Just a moment...</body></html>'),
    ).toThrow(UnrecognisedAtisGuruPageError);
  });
});
