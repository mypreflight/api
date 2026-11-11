import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';

export class RemoveFlightCommand {
  constructor(public readonly flightId: string) {}
}

@CommandHandler(RemoveFlightCommand)
export class RemoveFlightHandler implements ICommandHandler<RemoveFlightCommand> {
  constructor(private readonly flightsRepository: FlightsRepository) {}

  async execute(command: RemoveFlightCommand): Promise<void> {
    const { flightId } = command;
    const flight = await this.flightsRepository.load(flightId);

    flight.assertCanBeRemoved();

    await this.flightsRepository.remove(flightId);
  }
}
