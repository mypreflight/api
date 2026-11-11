import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { FlightServiceType } from '../../model/flight.model';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { flightBodyCacheKeys } from '../../../../core/cache/cache.key';

export class UpdateFlightCommand {
  constructor(
    public readonly flightId: string,
    public readonly serviceType?: FlightServiceType,
  ) {}
}

@CommandHandler(UpdateFlightCommand)
export class UpdateFlightHandler implements ICommandHandler<UpdateFlightCommand> {
  constructor(
    private readonly flightsRepository: FlightsRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async execute(command: UpdateFlightCommand): Promise<void> {
    const { flightId, serviceType } = command;
    const flight = await this.flightsRepository.load(flightId);

    if (serviceType === undefined) {
      return;
    }

    flight.changeServiceType(serviceType);

    await this.flightsRepository.save(flight);

    await Promise.all(
      flightBodyCacheKeys(flightId).map((key) => this.cacheManager.del(key)),
    );
  }
}
