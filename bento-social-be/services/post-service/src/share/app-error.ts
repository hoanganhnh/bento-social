export class AppError extends Error {
  constructor(
    public readonly originalError: Error,
    public readonly status: number,
  ) {
    super(originalError.message);
    this.name = 'AppError';
  }

  static from(err: Error, status: number = 400): AppError {
    return new AppError(err, status);
  }

  static notFound(message: string = 'Not found'): AppError {
    return new AppError(new Error(message), 404);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(new Error(message), 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(new Error(message), 403);
  }

  static badRequest(message: string = 'Bad request'): AppError {
    return new AppError(new Error(message), 400);
  }
}
