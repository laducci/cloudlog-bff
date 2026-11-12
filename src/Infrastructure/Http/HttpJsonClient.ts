import { UpstreamError } from "../../Domain/Errors";

/** Cliente HTTP mínimo com timeout; converte falhas em UpstreamError. */
export class HttpJsonClient {
  constructor(
    private readonly service: string,
    private readonly baseUrl: string,
    private readonly options: { timeoutMs?: number; headers?: Record<string, string>; fetchFn?: typeof fetch } = {},
  ) {}

  async request<T>(method: string, path: string, body?: unknown, query?: Record<string, string | undefined>): Promise<T> {
    const url = new URL(this.baseUrl.replace(/\/+$/, "") + path);
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, v);
    const fetchFn = this.options.fetchFn ?? fetch;
    let res: Response;
    try {
      res = await fetchFn(url, {
        method,
        headers: { accept: "application/json", ...(body !== undefined ? { "content-type": "application/json" } : {}), ...this.options.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 10000),
      });
    } catch (err) {
      throw new UpstreamError(this.service, 503, `${this.service} indisponível (${(err as Error).name}).`);
    }
    if (res.status === 204) return undefined as T;
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new UpstreamError(this.service, res.status, payload.error ?? `${this.service} respondeu ${res.status}.`);
    return payload as T;
  }
}
