import { readNotocDocument } from './notoc.read';
import { HazardClass } from './commodity.model';

describe('readNotocDocument', () => {
  it('reads a notification issued before the form fields were recorded', () => {
    const document = readNotocDocument({
      statement: 'Dangerous goods loaded as listed below.',
      dangerousGoods: [
        {
          awb: '001-11111118',
          hazardClass: HazardClass.FlammableLiquid,
          unNumber: '1263',
        },
      ],
      specialLoads: [{ awb: '001-22222225', shc: ['AVI'] }],
      coldChain: [],
      summary: {},
    });

    expect(document.header).toBeNull();
    expect(document.specialPassengers).toEqual([]);
    expect(document.dangerousGoods[0]).toMatchObject({
      classOrDivision: HazardClass.FlammableLiquid,
      quantityIsTotal: false,
      radioactive: null,
      impCode: null,
      uldId: null,
    });
    expect(document.specialLoads[0]).toMatchObject({
      pieces: null,
      supplementaryInformation: [],
      uldId: null,
    });
  });
});
