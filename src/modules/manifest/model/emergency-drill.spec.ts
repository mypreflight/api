import { drillFor } from './emergency-drill';
import { COMMODITIES } from '../data/cargo-commodities';
import { DRILL_LETTERS, DRILL_NUMBERS, DrillLetter } from './commodity.model';

describe('drillFor', () => {
  it('reports the drill the hazard class maps to', () => {
    const responseCode = {
      drillNumber: 3 as const,
      drillLetters: [DrillLetter.OtherRiskLowOrNone],
    };
    const paint = drillFor(responseCode);

    expect(paint.responseCode).toEqual(responseCode);
    expect(paint.inherentRisk).toContain('Flammable liquid');
    expect(paint.additionalRisks).toEqual([
      'No significant risk beyond the drill itself.',
    ]);
  });

  it('names one additional risk per drill letter', () => {
    const drill = drillFor({
      drillNumber: 6,
      drillLetters: [DrillLetter.Toxic, DrillLetter.Corrosive],
    });

    expect(drill.additionalRisks).toHaveLength(2);
    expect(drill.additionalRisks[0]).toContain('Toxic');
    expect(drill.additionalRisks[1]).toContain('Corrosive');
  });

  it('carries an inherent risk, a risk to the aircraft and a procedure for every drill', () => {
    const incomplete = DRILL_NUMBERS.map((drillNumber) =>
      drillFor({ drillNumber, drillLetters: [] }),
    ).filter(
      (drill) =>
        drill.inherentRisk.length === 0 ||
        drill.riskToAircraftAndOccupants.length === 0 ||
        drill.spillAndFireProcedure.length === 0,
    );

    expect(incomplete).toEqual([]);
  });

  it('knows an additional risk for every letter in the vocabulary', () => {
    const unmapped = DRILL_LETTERS.filter(
      (letter) =>
        drillFor({ drillNumber: 3, drillLetters: [letter] }).additionalRisks
          .length === 0,
    );

    expect(unmapped).toEqual([]);
  });

  it('answers a drill for every dangerous goods entry in the catalogue', () => {
    const declared = COMMODITIES.flatMap((commodity) =>
      commodity.dangerousGoods ? [commodity.dangerousGoods] : [],
    );

    expect(declared.length).toBeGreaterThan(0);
    expect(
      declared.map((profile) => drillFor(profile.responseCode).responseCode),
    ).toEqual(declared.map((profile) => profile.responseCode));
  });
});
