import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";

describe("jwt utils", () => {
  it("signs and verifies an access token", () => {
    const token = signAccessToken({ sub: "user1", role: "admin" });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user1");
    expect(payload.role).toBe("admin");
  });

  it("signs and verifies a refresh token", () => {
    const token = signRefreshToken({ sub: "user1" });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe("user1");
  });

  it("rejects a tampered access token", () => {
    const token = signAccessToken({ sub: "user1", role: "user" });
    expect(() => verifyAccessToken(token + "x")).toThrow();
  });
});
