import { beforeAll, describe, expect, it, vi } from "vitest";

type ReplitAuthModule = typeof import("./replitAuth");

let parseReturnToParam!: ReplitAuthModule["parseReturnToParam"];
let sanitizeReturnTo!: ReplitAuthModule["sanitizeReturnTo"];
let isSafeReturnTo!: ReplitAuthModule["isSafeReturnTo"];

vi.mock("./storage", () => ({
  storage: {
    upsertUser: vi.fn(),
  },
}));

beforeAll(async () => {
  process.env.REPLIT_DOMAINS = "example.com";
  const mod = await import("./replitAuth");
  parseReturnToParam = mod.parseReturnToParam;
  sanitizeReturnTo = mod.sanitizeReturnTo;
  isSafeReturnTo = mod.isSafeReturnTo;
});

describe("parseReturnToParam", () => {
  it("returns the first string value from an array", () => {
    expect(parseReturnToParam(["/dashboard", "/ignored"])).toBe(
      "/dashboard"
    );
  });

  it("ignores non-string array entries", () => {
    expect(parseReturnToParam([123])).toBeUndefined();
  });

  it("returns the string when provided directly", () => {
    expect(parseReturnToParam("/profile")).toBe("/profile");
  });

  it("returns undefined for other input", () => {
    expect(parseReturnToParam(undefined)).toBeUndefined();
    expect(parseReturnToParam(42)).toBeUndefined();
  });
});

describe("sanitizeReturnTo", () => {
  it("allows golfai:// scheme", () => {
    expect(sanitizeReturnTo("golfai://callback")).toBe("golfai://callback");
  });

  it("allows safe relative paths", () => {
    expect(sanitizeReturnTo("/courses/123")).toBe("/courses/123");
  });

  it("rejects network path references", () => {
    expect(sanitizeReturnTo("//example.com")).toBeUndefined();
  });

  it("rejects absolute http urls", () => {
    expect(sanitizeReturnTo("https://example.com")).toBeUndefined();
  });
});

describe("isSafeReturnTo", () => {
  it("returns true for allowed targets", () => {
    expect(isSafeReturnTo("/")).toBe(true);
    expect(isSafeReturnTo("golfai://home")).toBe(true);
  });

  it("returns false for disallowed targets", () => {
    expect(isSafeReturnTo("http://example.com")).toBe(false);
  });
});
