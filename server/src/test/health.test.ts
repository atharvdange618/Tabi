import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.ts";

describe("Health Check API", () => {
  it("should return 200 OK and a timestamp", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
  });
});
