import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isPublicRoute } from "./proxy";

const req = (path: string) =>
  new NextRequest(`https://tabi.atharvdange.com${path}`);

describe("isPublicRoute", () => {
  it.each(["/robots.txt", "/sitemap.xml", "/api/og", "/api/og?title=Kyoto"])(
    "allows crawler asset %s",
    (path) => {
      expect(isPublicRoute(req(path))).toBe(true);
    },
  );

  it.each(["/dashboard", "/trips/abc", "/api/v1/trips"])(
    "protects %s",
    (path) => {
      expect(isPublicRoute(req(path))).toBe(false);
    },
  );
});
