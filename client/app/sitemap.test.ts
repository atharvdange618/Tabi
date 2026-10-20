import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";

const fetchMock = vi.fn<typeof fetch>();

const page = (ids: string[], hasMore: boolean) =>
  new Response(
    JSON.stringify({
      data: {
        trips: ids.map((id) => ({
          _id: id,
          updatedAt: "2026-10-01T00:00:00.000Z",
        })),
        total: 3,
        hasMore,
      },
    }),
  );

const urls = (entries: Awaited<ReturnType<typeof sitemap>>) =>
  entries.map((e) => e.url);

describe("sitemap", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it("pages through public trips and uses their updatedAt", async () => {
    fetchMock
      .mockResolvedValueOnce(page(["a", "b"], true))
      .mockResolvedValueOnce(page(["c"], false));

    const entries = await sitemap();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("skip=2");
    const trip = entries.find((e) => e.url.endsWith("/public/c"));
    expect(trip?.lastModified).toBe("2026-10-01T00:00:00.000Z");
    expect(urls(entries).filter((u) => u.includes("/public/"))).toHaveLength(3);
  });

  it("still returns static pages when the API is down", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const entries = await sitemap();

    expect(urls(entries)).toContain("https://tabi.atharvdange.com/discover");
    expect(urls(entries).some((u) => u.includes("/public/"))).toBe(false);
  });

  it("leaves out auth pages and fake lastModified dates", async () => {
    fetchMock.mockResolvedValue(page([], false));

    const entries = await sitemap();

    expect(urls(entries).some((u) => /sign-(in|up)/.test(u))).toBe(false);
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });
});
