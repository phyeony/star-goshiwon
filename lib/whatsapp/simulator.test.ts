import { describe, expect, it, vi } from "vitest";
import { markRead, sendTemplate, sendText } from "./graph";
import { isSimulatedPhone, simMessageId, simPhoneFor, simulatorEnabled } from "./simulator";

describe("simulator", () => {
  it("is on only on staging and in next dev", () => {
    expect(simulatorEnabled({ STAGING: "true" })).toBe(true);
    expect(simulatorEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(simulatorEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(simulatorEnabled({})).toBe(false);
  });

  it("test numbers can't be mistaken for real ones", () => {
    expect(simPhoneFor("Test 3!")).toBe("sim-test-3");
    expect(simPhoneFor("  ")).toBe("sim-guest");
    expect(isSimulatedPhone("sim-test-3")).toBe(true);
    expect(isSimulatedPhone("821012345678")).toBe(false);
  });

  it("nothing addressed to a test chat reaches Meta", async () => {
    const fetchImpl = vi.fn();
    const cfg = { accessToken: "t", phoneNumberId: "1", fetchImpl: fetchImpl as unknown as typeof fetch };
    expect(await sendText(cfg, "sim-test", "hi")).toMatch(/^sim\./);
    expect(await sendTemplate(cfg, "sim-test", { name: "x", language: "en", bodyParams: [] })).toMatch(/^sim\./);
    await markRead(cfg, simMessageId());
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
