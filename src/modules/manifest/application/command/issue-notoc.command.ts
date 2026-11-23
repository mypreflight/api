import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { NotocRepository } from '../../infra/database/repository/notoc.repository';
import { PassengersRepository } from '../../infra/database/repository/passengers.repository';
import { NotifiablePassenger } from '../../model/notoc-passengers';
import {
  PassengerSpecialService,
  PassengerStatus,
} from '../../model/manifest.model';
import { composeNotoc } from '../../model/notoc';
import { NotocStageName } from '../../model/notoc.model';
import { NotocHeaderContext, notocHeaderFor } from '../../model/notoc-header';
import {
  FlightCargoManifest,
  CargoShipmentStatusName,
} from '../../model/cargo-manifest.model';
import { GetFlightCargoLoadQuery } from '../query/get-flight-cargo-load.query';
import { CargoManifestNotGeneratedError } from '../../model/error/cargo.error';
import { NotocStage, Prisma } from 'prisma/client/client';

export class IssueNotocCommand {
  constructor(
    public readonly flightId: string,
    public readonly stage: NotocStageName,
    public readonly unloadingAirport: string,
    public readonly issuedAt: Date,
    public readonly header: NotocHeaderContext | null = null,
  ) {}
}

@CommandHandler(IssueNotocCommand)
export class IssueNotocHandler implements ICommandHandler<IssueNotocCommand> {
  constructor(
    private readonly notocRepository: NotocRepository,
    private readonly passengersRepository: PassengersRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: IssueNotocCommand): Promise<void> {
    const { flightId, stage, unloadingAirport, issuedAt, header } = command;
    const manifest = await this.loadOf(flightId);
    const passengers = await this.passengersOf(flightId);

    await this.notocRepository.issue(
      flightId,
      stage as unknown as NotocStage,
      issuedAt,
      composeNotoc(
        manifest,
        unloadingAirport,
        header ? notocHeaderFor(header, issuedAt) : null,
        passengers,
      ) as unknown as Prisma.InputJsonValue,
    );
  }

  private async passengersOf(flightId: string): Promise<NotifiablePassenger[]> {
    const rows = await this.passengersRepository.findByFlight(flightId);

    return rows.map((row) => ({
      designator: row.designator,
      status: row.status as unknown as PassengerStatus,
      ssr: row.ssr as PassengerSpecialService | null,
    }));
  }

  private async loadOf(flightId: string): Promise<FlightCargoManifest> {
    const query = new GetFlightCargoLoadQuery(
      flightId,
      CargoShipmentStatusName.Loaded,
    );

    try {
      return await this.queryBus.execute(query);
    } catch (error) {
      if (error instanceof CargoManifestNotGeneratedError) {
        return emptyLoad(flightId);
      }

      throw error;
    }
  }
}

function emptyLoad(flightId: string): FlightCargoManifest {
  return {
    flightId,
    holdVariant: null,
    cargoKg: 0,
    baggageKg: 0,
    bagCount: 0,
    baggageSource: null,
    containerCount: 0,
    bulkLotCount: 0,
    shipmentCount: 0,
    worstColdChainRisk: null,
    dangerousGoodsCount: 0,
    cargoAircraftOnlyCount: 0,
    transferCount: 0,
    tightestConnectionMinutes: null,
    compartmentLoad: [],
    segregationAdvisories: [],
    units: [],
  };
}
