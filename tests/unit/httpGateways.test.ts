import { UpstreamError } from "../../src/Domain/Errors";
import { HttpDeliveriesGateway, HttpFreightGateway } from "../../src/Infrastructure/Http/HttpGateways";
import { HttpJsonClient } from "../../src/Infrastructure/Http/HttpJsonClient";

const fakeFetch = (status: number, body: unknown, calls: Array<[string, RequestInit]> = []) =>
  (async (url: URL, init: RequestInit) => {
    calls.push([String(url), init]);
    return new Response(status === 204 ? null : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;

describe("Adaptadores HTTP do BFF", () => {
  it("monta URL, query string e corpo JSON", async () => {
    const calls: Array<[string, RequestInit]> = [];
    const gw = new HttpDeliveriesGateway(new HttpJsonClient("Entregas", "https://entregas.example/", { fetchFn: fakeFetch(200, { items: [], total: 0 }, calls) }));
    await gw.list({ status: "Pendente", search: undefined });
    expect(calls[0][0]).toBe("https://entregas.example/deliveries?status=Pendente");
  });

  it("chama a Function com POST /frete em lote", async () => {
    const calls: Array<[string, RequestInit]> = [];
    const gw = new HttpFreightGateway(new HttpJsonClient("Function", "https://fn.example/api", { fetchFn: fakeFetch(200, { items: [], totalFreight: 0 }, calls) }));
    await gw.quoteMany([{ id: "a", distanceKm: 1, weightKg: 1 }]);
    expect(calls[0][0]).toBe("https://fn.example/api/frete");
    expect(JSON.parse(String(calls[0][1].body))).toEqual([{ id: "a", distanceKm: 1, weightKg: 1 }]);
  });

  it("converte erro do serviço e falha de rede em UpstreamError", async () => {
    const gw = new HttpDeliveriesGateway(new HttpJsonClient("Entregas", "https://x", { fetchFn: fakeFetch(422, { error: "regra" }) }));
    await expect(gw.get("1")).rejects.toMatchObject({ status: 422, message: "regra" });
    const down = new HttpDeliveriesGateway(new HttpJsonClient("Entregas", "https://x", { fetchFn: (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch }));
    await expect(down.get("1")).rejects.toBeInstanceOf(UpstreamError);
  });
});
