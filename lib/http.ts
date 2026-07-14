export class HttpResponseError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "HttpResponseError";
  }
}

export async function readJsonResponse<T>(response: Response, fallbackMessage = "Request failed."): Promise<T> {
  const body = await readJsonResponseBody<{ error?: string; message?: string; code?: string; issues?: Array<{ path?: Array<string | number>; message?: string }> }>(response, fallbackMessage);

  if (!response.ok) {
    const issue = Array.isArray(body?.issues) ? body.issues[0] : null;
    const issueMessage = issue?.message ? `${issue.path?.join(".") || "Field"}: ${issue.message}` : "";
    const message = issueMessage || (typeof body?.error === "string" ? body.error : typeof body?.message === "string" ? body.message : fallbackMessage);
    throw new HttpResponseError(message, response.status, typeof body?.code === "string" ? body.code : undefined);
  }

  return body as T;
}

export async function readJsonResponseBody<T extends { error?: string; message?: string } = { error?: string; message?: string }>(response: Response, fallbackMessage = "Request failed."): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (!isJson) {
    const text = await response.text().catch(() => "");
    throw new Error(cleanNonJsonError(response, text, fallbackMessage));
  }

  return (response.status === 204 ? null : await response.json().catch(() => {
    throw new Error(`${fallbackMessage} The server returned invalid JSON.`);
  })) as T;
}

function cleanNonJsonError(response: Response, text: string, fallbackMessage: string) {
  const trimmed = text.trim();
  const isHtml = /^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed);
  if (isHtml) {
    return response.ok
      ? "The server returned an HTML page instead of JSON."
      : `${fallbackMessage} The server returned an error page instead of JSON. Check the Vercel deployment logs and database environment variables.`;
  }
  const detail = trimmed ? ` ${trimmed.slice(0, 220)}` : "";
  return response.ok
    ? `The server response was not JSON.${detail}`
    : `${fallbackMessage}${detail}`;
}
