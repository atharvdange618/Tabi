/**
 * error-handler.test.ts
 *
 * Unit tests for how errorHandler maps errors to HTTP responses.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "../middleware/errorHandler.ts";

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

function run(err: Error) {
  const res = mockRes();
  errorHandler(
    err,
    {} as Request,
    res as unknown as Response,
    vi.fn() as NextFunction,
  );
  return res;
}

describe("errorHandler", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps a Mongoose validation error to 400", () => {
    const err = new mongoose.Error.ValidationError();
    err.addError(
      "description",
      new mongoose.Error.ValidatorError({
        message: "Description is too long",
        path: "description",
      }),
    );

    const res = run(err);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Description is too long" });
  });

  it("maps a malformed ObjectId (BSONError) to 400", () => {
    let err: Error = new Error("unreachable");
    try {
      new mongoose.Types.ObjectId("not-an-id");
    } catch (e) {
      err = e as Error;
    }

    const res = run(err);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Invalid ID format" });
  });

  it("hides the raw message of unknown errors outside development", () => {
    vi.stubEnv("NODE_ENV", "production");

    const res = run(new Error("connection string leaked: mongodb://secret"));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
