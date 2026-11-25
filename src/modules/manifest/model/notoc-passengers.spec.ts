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

  it('puts a battery wheelchair in the aftmost compartment holding baggage', () => {
    const [entry] = specialPassengersOf(
      [passenger('34C', PassengerSpecialService.WheelchairLithiumBattery)],
      loadWithBaggageIn([3, 5]),
    );

    expect(entry).toEqual({
      seat: '34C',
      ssr: PassengerSpecialService.WheelchairLithiumBattery,
      mobilityAid: { compartment: 5 },
    });
  });

  it('names no compartment when no baggage has one', () => {
    const [entry] = specialPassengersOf(
      [passenger('8F', PassengerSpecialService.WheelchairDryBattery)],
      null,
    );

    expect(entry.mobilityAid).toEqual({ compartment: null });
  });

  it('gives no mobility aid to a passenger travelling without one', () => {
    const [entry] = specialPassengersOf(
      [passenger('8F', PassengerSpecialService.WheelchairRamp)],
      loadWithBaggageIn([5]),
    );

    expect(entry.mobilityAid).toBeNull();
  });
});
