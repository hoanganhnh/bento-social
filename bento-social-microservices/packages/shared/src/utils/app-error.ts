import { HttpException, HttpStatus } from '@nestjs/common';

export class AppError extends HttpException {
  private _logs: string[] = [];

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, statusCode);
  }

  static from(error: Error, statusCode: number = HttpStatus.BAD_REQUEST): AppError {
    return new AppError(error.message, statusCode);
  }

  withLog(log: string): AppError {
    this._logs.push(log);
    return this;
  }

  get logs(): string[] {
    return this._logs;
  }
}

// Common errors
export const ErrNotFound = new Error('Resource not found');
export const ErrUnauthorized = new Error('Unauthorized');
export const ErrForbidden = new Error('Forbidden');
export const ErrBadRequest = new Error('Bad request');
export const ErrInternalServer = new Error('Internal server error');
export const ErrTokenInvalid = new Error('Token is invalid');

