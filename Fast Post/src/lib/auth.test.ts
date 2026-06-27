import { describe, expect, it } from "vitest";
import { authenticateUser, createSessionToken, demoUsers, parseSessionToken, publicSessionFor } from "@/lib/auth";

describe("auth", () => {
  it("authenticates Daniel with the requested password", () => {
    const session = authenticateUser({ username: "Daniel", password: "tokenize32" });

    expect(session).toMatchObject({
      username: "Daniel",
      role: "owner"
    });
  });

  it("authenticates the permanent tester account", () => {
    const session = authenticateUser({ username: "Teste", password: "fastpost-test-2026" });

    expect(session).toMatchObject({
      username: "Teste",
      role: "tester"
    });
  });

  it("rejects invalid credentials without returning a session", () => {
    expect(authenticateUser({ username: "Daniel", password: "wrong" })).toBeNull();
    expect(authenticateUser({ username: "Unknown", password: "tokenize32" })).toBeNull();
  });

  it("does not expose password hashes in public sessions", () => {
    const daniel = demoUsers.find((user) => user.username === "Daniel");

    expect(publicSessionFor(daniel!)).not.toHaveProperty("passwordHash");
    expect(publicSessionFor(daniel!)).toEqual({
      id: "user-daniel",
      name: "Daniel",
      username: "Daniel",
      role: "owner"
    });
  });

  it("round-trips signed session tokens", () => {
    const session = authenticateUser({ username: " Daniel ", password: "tokenize32" });
    const token = createSessionToken(session!);

    expect(parseSessionToken(token)).toEqual(session);
  });

  it("rejects missing, malformed, tampered, and unknown-user session tokens", () => {
    const session = authenticateUser({ username: "Daniel", password: "tokenize32" });
    const token = createSessionToken(session!);
    const [payload, signature] = token.split(".");
    const unknownPayload = Buffer.from(
      JSON.stringify({ id: "missing", name: "Missing", username: "Missing", role: "tester" }),
      "utf8"
    ).toString("base64url");

    expect(parseSessionToken()).toBeNull();
    expect(parseSessionToken("not-a-token")).toBeNull();
    expect(parseSessionToken(`${payload}.bad-${signature}`)).toBeNull();
    expect(parseSessionToken(`${unknownPayload}.${signature}`)).toBeNull();
  });
});
