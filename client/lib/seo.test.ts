import { describe, expect, it } from "vitest";
import {
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebSiteSchema,
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
