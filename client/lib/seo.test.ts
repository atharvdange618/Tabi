import { describe, expect, it } from "vitest";
import {
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateTripSchema,
  generateWebSiteSchema,
  toJsonLd,
} from "./seo";

describe("JSON-LD schemas", () => {
  it("WebSite schema has no SearchAction for a search page that doesn't exist", () => {
    expect(generateWebSiteSchema()).not.toHaveProperty("potentialAction");
  });

  it("SoftwareApplication schema has no self-written rating", () => {
    expect(generateSoftwareApplicationSchema()).not.toHaveProperty(
      "aggregateRating",
    );
  });

  it("Organization schema links the X profile", () => {
    expect(generateOrganizationSchema().sameAs).toContain(
      "https://x.com/atharvdangedev",
    );
  });
});

describe("toJsonLd", () => {
  const title = "</script><script>alert(1)</script>";
  const schema = generateTripSchema({
    name: title,
    url: "https://tabi.atharvdange.com/public/abc",
  });

  it("leaves no raw < that could close the script tag", () => {
    expect(toJsonLd(schema)).not.toContain("<");
  });

  it("still parses back to the original title", () => {
    expect(JSON.parse(toJsonLd(schema)).name).toBe(title);
  });
});
