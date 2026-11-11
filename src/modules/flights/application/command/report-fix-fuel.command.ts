import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FlightsRepository } from '../../infra/database/repository/flights.repository';
import { RouteFixDoesNotExistError } from '../../model/error/flight.error';

export class ReportFixFuelCommand {
  constructor(
    public readonly flightId: string,
    public readonly ordinal: number,
    public readonly actualOnBoard: number,
    public readonly reportedAt: Date,
  ) {}
}

@CommandHandler(ReportFixFuelCommand)
export class ReportFixFuelHandler implements ICommandHandler<ReportFixFuelCommand> {
  constructor(private readonly repository: FlightsRepository) {}

  async execute(command: ReportFixFuelCommand): Promise<void> {
    const { flightId, ordinal, actualOnBoard, reportedAt } = command;

    const flight = await this.repository.load(flightId);

    flight.assertCanReportFixFuel(reportedAt);

    const route = await this.repository.findPlannedRoute(flightId);
    if (!route?.fixes.some((fix) => fix.ordinal === ordinal)) {
      throw new RouteFixDoesNotExistError();
    }

    await this.repository.saveFixFuelReport(
      flightId,
      ordinal,
      actualOnBoard,
      reportedAt,
    );
  }
}
