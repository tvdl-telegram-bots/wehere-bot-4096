import {
  ErrorWithStatus,
  assertWithStatus,
} from "wehere-backend/src/lib/backend/errors";
import { formatErrorAsObject } from "wehere-bot/src/utils/format";

function createJsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

export function withDefaultRouteHandler<Context>(
  handler: (request: Request, context: Context) => Promise<Response>
) {
  return async function (request: Request, context: Context) {
    try {
      if (request.method !== "GET") {
        assertWithStatus(
          400,
          request.headers.get("Content-Type") === "application/json",
          "invalid content-type"
        );
      }
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ErrorWithStatus) {
        return createJsonResponse(
          error.status,
          formatErrorAsObject(error.cause)
        );
      } else {
        return createJsonResponse(500, formatErrorAsObject(error));
      }
    }
  };
}

export function getUrl(
  origin: string,
  path: string,
  query: Record<string, string | number | boolean | null | undefined> = {}
) {
  if (origin.endsWith("/")) throw RangeError("invalid origin");
  if (!path.startsWith("/")) throw RangeError("invalid path");

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) {
      search.append(key, value.toString());
    }
  }
  return search.size > 0
    ? origin + path + "?" + search.toString()
    : origin + path;
}

export async function httpPost(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body, null, 2),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => undefined);
    throw new Error(
      `response not ok (status=${response.status}), url=${url}`, //
      { cause: { status: response.status, text } }
    );
  }
  const data = await response.json();
  return data;
}

export async function httpGet(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => undefined);
    throw new Error(
      `response not ok (status=${response.status}), url=${url}`, //
      { cause: { status: response.status, text } }
    );
  }
  const data = await response.json();
  return data;
}
