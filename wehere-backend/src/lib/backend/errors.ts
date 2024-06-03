export class ErrorWithStatus extends Error {
  public readonly status: number;

  constructor(status: number, cause: unknown) {
    const message = `${status}: ${
      cause instanceof Error ? cause.message : "unknown error"
    }`;
    super(message, { cause });
    this.status = status;
    this.name = this.constructor.name;
  }
}

export function throwsWithStatus(status: number, error: unknown): never {
  throw new ErrorWithStatus(status, error);
}

export const throws400 = throwsWithStatus.bind(null, 400);
export const throws500 = throwsWithStatus.bind(null, 500);

export function assertWithStatus(
  status: number,
  condition: unknown,
  message?: string,
  options?: ErrorOptions
): asserts condition {
  if (!condition) {
    throw new ErrorWithStatus(status, new Error(message, options));
  }
}
