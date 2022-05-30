const CAN_SET_PROTOTYPE = 'setPrototypeOf' in Object;

export class InsufficientReservesError extends Error {
  public readonly isInsufficientReservesError: true = true

  public constructor () {
    super();
    this.name = this.constructor.name;
    if (CAN_SET_PROTOTYPE) Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientInputAmountError extends Error {
  public readonly isInsufficientInputAmountError: true = true

  public constructor () {
    super();
    this.name = this.constructor.name;
    if (CAN_SET_PROTOTYPE) Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CalculationError extends Error {
  public readonly isCalculationError: true = true

  public constructor () {
    super();
    this.name = this.constructor.name;
    if (CAN_SET_PROTOTYPE) Object.setPrototypeOf(this, new.target.prototype);
  }
}
