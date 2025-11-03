export class ApplicationException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundException extends ApplicationException {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, "NOT_FOUND", 404);
  }
}

export class ValidationException extends ApplicationException {
  constructor(message: string, public readonly errors?: unknown[]) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

