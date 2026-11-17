import {
  ConflictError,
  NotFoundError,
} from '../../../../core/errors/domain-error';

export class AircraftNotFoundError extends NotFoundError {
  constructor() {
    super('Aircraft with given ID not found.');
  }
}

export class AircraftWithRegistrationAlreadyExistsError extends ConflictError {
  constructor() {
    super('Aircraft with given registration already exists.');
  }
}

export class AircraftTypeMismatchError extends ConflictError {
  constructor(
    registration: string,
    registeredType: string,
    plannedType: string,
  ) {
    super(
      `Aircraft ${registration} is registered as ${registeredType}, but the flight plan uses ${plannedType}.`,
    );
  }
}

export class AircraftInUseError extends ConflictError {
  constructor() {
    super('Aircraft is related to other resources and cannot be removed.');
  }
}
