import { buildNonceMessage } from "./walletLinkService";

describe("walletLinkService", () => {
  it("builds a deterministic nonce message", () => {
    const message = buildNonceMessage("abc123");
    expect(message).toContain("abc123");
    expect(message).toMatch(/^Sign this message/);
  });
});
