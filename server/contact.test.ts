import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("contact submissions", () => {
  it("rejects incomplete public submissions", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.contact.submit({
        name: "A",
        email: "not-an-email",
        message: "short",
      }),
    ).rejects.toThrow();
  });

  it("rejects unsupported attachment types before storage upload", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.contact.submit({
        name: "Jane Smith",
        email: "jane@example.com",
        message: "I would like to learn more about Auralis One.",
        attachment: {
          filename: "malware.exe",
          mimeType: "application/x-msdownload",
          size: 128,
          data: "ZmFrZQ==",
        },
      }),
    ).rejects.toThrow("That attachment type is not supported.");
  });

  it("keeps inquiry listing admin-only", async () => {
    const caller = appRouter.createCaller(createContext({
      id: 7,
      openId: "regular-user",
      name: "Regular User",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.contact.list()).rejects.toThrow("You do not have required permission");
  });

  it("keeps inquiry responses admin-only", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.contact.update({ id: 1, status: "replied", replyMessage: "Thanks for reaching out." }),
    ).rejects.toThrow("You do not have required permission");
  });
});
