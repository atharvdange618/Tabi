import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateMetadata } from "./layout";

const getToken = vi.fn<() => Promise<string | null>>();

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ getToken }),
}));

const fetchMock = vi.fn<typeof fetch>();

const params = Promise.resolve({ id: "trip123" });

const tripResponse = () =>
  new Response(
    JSON.stringify({ data: { title: "Kyoto", destination: "Japan" } }),
  );

describe("trip layout generateMetadata", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    getToken.mockResolvedValue("token");
    fetchMock.mockResolvedValue(tripResponse());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("prefers API_URL over NEXT_PUBLIC_API_URL", async () => {
    vi.stubEnv("API_URL", "http://server:8000");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");

    await generateMetadata({ params });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://server:8000/api/v1/trips/trip123",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
      }),
    );
  });

  it("falls back to NEXT_PUBLIC_API_URL when API_URL is unset", async () => {
    vi.stubEnv("API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");

    await generateMetadata({ params });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8000/api/v1/trips/trip123",
    );
  });

  it("uses the trip title when the fetch succeeds", async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe("Kyoto");
    expect(metadata.description).toBe("Collaborative trip to Japan");
  });

  it("skips the fetch and returns defaults when signed out", async () => {
    getToken.mockResolvedValue(null);

    const metadata = await generateMetadata({ params });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(metadata.title).toBe("Trip Details");
  });

  it("returns defaults when the API errors", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const metadata = await generateMetadata({ params });

    expect(metadata.title).toBe("Trip Details");
  });
});
