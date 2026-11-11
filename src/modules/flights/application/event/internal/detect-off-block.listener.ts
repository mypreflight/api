import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommandBus } from '@nestjs/cqrs';
import {
  FlightEventType,
  FlightPathWasUpdatedEvent,
} from '../../../../../core/domain/events/dto/flight.events';
import { ReportOffBlockCommand } from '../../command/report-off-block.command';
import { FlightsRepository } from '../../../infra/database/repository/flights.repository';
import { firstMovingPosition } from '../../../../../core/utils/ground-speed';

export const OFF_BLOCK_GROUND_SPEED_THRESHOLD_KNOTS = 3;

@Injectable()
export class DetectOffBlockListener {
  private readonly logger = new Logger(DetectOffBlockListener.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly flightsRepository: FlightsRepository,
  ) {}

  @OnEvent(FlightEventType.FlightPathWasUpdated)
  async onFlightPathWasUpdated(
    event: FlightPathWasUpdatedEvent,
  ): Promise<void> {
    const { flightId } = event.payload;

    const flight = await this.flightsRepository.load(flightId);

    if (!flight.canReportOffBlock()) {
      return;
    }

    const path = await this.flightsRepository.getFlightPath(flightId);
    const firstMoving = firstMovingPosition(
      path,
      OFF_BLOCK_GROUND_SPEED_THRESHOLD_KNOTS,
    );

    if (!firstMoving) {
      return;
    }

    const command = new ReportOffBlockCommand(
      flightId,
      null,
      firstMoving.date,
      true,
    );
    await this.commandBus.execute(command);

    this.logger.log(
      `Automatically reported off-block for flight ${flightId} at ${firstMoving.date.toISOString()}.`,
    );
  }
}
