import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { FlightLoadsheetsRepository } from '../../infra/database/repository/flight-loadsheets.repository';
import { Loadsheet, LoadsheetKind } from '../../model/loadsheet.model';
import { PreliminaryLoadsheetWasUpdatedEvent } from '../../../../core/domain/events/dto/flight.events';
import { FlightEventScope } from '../../model/event.model';
import { DomainEventEmitter } from '../../../../core/domain/events/domain-event-emitter';
import {
  assertFuelBreakdownConsistent,
  assertPassengerBreakdownConsistent,
  assertPayloadAccountsForLoad,
  withPlannedPassengerMass,
} from '../../model/loadsheet.policy';
import { GetSeatCapacityQuery } from '../../../manifest/application/query/get-seat-capacity.query';
import { SeatCapacityExceededError } from '../../../manifest/model/error/manifest.error';
import { assertBreakdownFitsCabins } from '../../../manifest/model/manifest-generation';
import { CabinCapacity } from '../../../cabin-layouts/model/cabin-capacity.model';
import { GetCurrentLoadsheetQuery } from '../query/get-current-loadsheet.query';

export class UpdatePreliminaryLoadsheetCommand {
  constructor(
    public readonly flightId: string,
    public readonly initiatorId: string,
    public readonly loadsheet: Loadsheet,
  ) {}
}

@CommandHandler(UpdatePreliminaryLoadsheetCommand)
export class UpdatePreliminaryLoadsheetHandler implements ICommandHandler<UpdatePreliminaryLoadsheetCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly flightsRepository: FlightsRepository,
    private readonly loadsheetsRepository: FlightLoadsheetsRepository,
    private readonly domainEvents: DomainEventEmitter,
  ) {}

  async execute(command: UpdatePreliminaryLoadsheetCommand): Promise<void> {
    const { flightId, initiatorId, loadsheet } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.assertCanUpdatePreliminaryLoadsheet();

    const currentQuery = new GetCurrentLoadsheetQuery(
      flightId,
      LoadsheetKind.Preliminary,
    );
    const current = await this.queryBus.execute(currentQuery);

    const planned = withPlannedPassengerMass(loadsheet, current?.passengerMass);

    assertFuelBreakdownConsistent(planned);
    assertPassengerBreakdownConsistent(planned);
    assertPayloadAccountsForLoad(planned);

    const capacityQuery = new GetSeatCapacityQuery(flight.aircraftId);
    const capacity: CabinCapacity | null =
      await this.queryBus.execute(capacityQuery);

    if (capacity) {
      if (planned.passengers > capacity.totalSeats) {
        throw new SeatCapacityExceededError(
          planned.passengers,
          capacity.totalSeats,
        );
      }

      if (planned.passengersByCabin) {
        assertBreakdownFitsCabins(
          capacity.cabinSizes,
          planned.passengersByCabin,
        );
      }
    }

    await this.loadsheetsRepository.issuePreliminary(
      flightId,
      planned,
      initiatorId,
    );
    await this.domainEvents.emitAsync(
      new PreliminaryLoadsheetWasUpdatedEvent({
        flightId,
        scope: FlightEventScope.Operations,
        actorId: initiatorId,
      }),
    );
  }
}
