import { specialPassengersOf } from './notoc-passengers';
import { PassengerSpecialService, PassengerStatus } from './manifest.model';
import {
  CargoContentClassName,
  CargoUnitEntry,
  FlightCargoManifest,
} from './cargo-manifest.model';

function passenger(
  designator: string,
  ssr: PassengerSpecialService | null,
  status = PassengerStatus.Boarded,
) {
  return { designator, ssr, status };
}

function loadWithBaggageIn(compartments: number[]): FlightCargoManifest {
  return {
    units: compartments.map(
      (compartment) =>
        ({
          compartment,
          contentClass: CargoContentClassName.Baggage,
        }) as CargoUnitEntry,
    ),
  } as FlightCargoManifest;
}

describe('specialPassengersOf', () => {
  it('lists the special category passengers aboard by seat', () => {
    const listed = specialPassengersOf(
      [
        passenger('34C', PassengerSpecialService.UnaccompaniedMinor),
        passenger('12A', PassengerSpecialService.Infant),
        passenger('12B', null),
      ],
      null,
    );

    expect(listed.map((entry) => entry.seat)).toEqual(['12A', '34C']);
  });

  it('leaves out a passenger who did not board', () => {
    const listed = specialPassengersOf(
      [
        passenger(
          '20D',
          PassengerSpecialService.WheelchairRamp,
          PassengerStatus.NoShow,
        ),
      ],
      null,
    );

    expect(listed).toEqual([]);
  });

  it('leaves out meet and assist, which the commander need not know', () => {
    expect(
      specialPassengersOf(
        [passenger('3A', PassengerSpecialService.MeetAndAssist)],
        null,
      ),
    ).toEqual([]);
  });

  it('says where a lithium battery wheelchair and its battery travel', () => {
    const [entry] = specialPassengersOf(
      [passenger('34C', PassengerSpecialService.WheelchairLithiumBattery)],
      loadWithBaggageIn([3, 5]),
    );

    expect(entry).toEqual({
      seat: '34C',
      ssr: PassengerSpecialService.WheelchairLithiumBattery,
      remarks: [
        'LITHIUM BATTERY REMOVED, IN CABIN AT 34C',
        'MOBILITY AID IN HOLD, CPT 5',
      ],
    });
  });

  it('names only the hold when no baggage has a compartment', () => {
    const [entry] = specialPassengersOf(
      [passenger('8F', PassengerSpecialService.WheelchairDryBattery)],
      null,
    );

    expect(entry.remarks).toEqual([
      'NON-SPILLABLE BATTERY INSTALLED',
      'MOBILITY AID IN HOLD',
    ]);
  });
});
