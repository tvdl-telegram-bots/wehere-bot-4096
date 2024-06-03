export type RouteHandler<Context> = (
  request: Request,
  context: Context
) => Promise<Response>;
