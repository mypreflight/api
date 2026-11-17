import { Controller, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { UserRole } from '../../../../../users/model/user-role';
import {
  CreateFlightRequest,
  GetFlightResponse,
} from '../../request/flight.dto';
import { GenericBadRequestResponse } from '../../../../../../core/http/response/bad-request.response';
import { GenericNotFoundResponse } from '../../../../../../core/http/response/not-found.response';
import { UnauthorizedResponse } from '../../../../../../core/http/response/unauthorized.response';
import { ForbiddenResponse } from '../../../../../../core/http/response/forbidden.response';
import { GenericConflictResponse } from '../../../../../../core/http/response/conflict.response';
import { Role } from '../../../../../../core/http/auth/decorator/role.decorator';
import { AuthorizedRequest } from '../../../../../../core/http/request/authorized.request';
import { CreateFlightFromSimbriefCommand } from '../../../../application/command/create-flight-from-simbrief.command';
import { GetFlightQuery } from '../../../../application/query/get-flight.query';

@ApiTags('flight')
@Controller('api/v1/flight')
export class CreateFlightFromSimbriefAction {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({
    summary: 'Create a flight with SimBrief data',
    description:
      '**NOTE:** This endpoint is only available for users with the ` operations ` role. <br />' +
      '**NOTE:** Simbrief ID must be provided for the user, otherwise import will throw HTTP 400. <br />' +
      '**NOTE:** An aircraft registration not yet in the fleet is created for the flight operator and marked unconfirmed until operations confirm it.',
  })
  @ApiBearerAuth('jwt')
  @ApiBody({ type: CreateFlightRequest })
  @ApiCreatedResponse({ type: GetFlightResponse })
  @ApiBadRequestResponse({ type: GenericBadRequestResponse })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponse })
  @ApiForbiddenResponse({ type: ForbiddenResponse })
  @ApiNotFoundResponse({
    description:
      'The operator or an airport cannot be found, or the aircraft is not in the fleet and its type is not a known airframe',
    type: GenericNotFoundResponse,
  })
  @ApiConflictResponse({
    description:
      'The aircraft is in the fleet with a different type than the plan uses',
    type: GenericConflictResponse,
  })
  @ApiUnprocessableEntityResponse({
    description: 'The plan does not name the aircraft registration and type',
  })
  @Post('/create-with-simbrief')
  @Role(UserRole.Operations)
  async run(@Req() request: AuthorizedRequest): Promise<GetFlightResponse> {
    const flightId = v4();

    const command = new CreateFlightFromSimbriefCommand(
      flightId,
      request.user.sub,
    );
    await this.commandBus.execute(command);

    const query = new GetFlightQuery(flightId);
    return this.queryBus.execute(query);
  }
}
