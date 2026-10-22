export class AppError extends Error {
  constructor(public status: number, message: string, public fieldErrors?: Record<string, string[]>) {
    super(message);
  }
}
