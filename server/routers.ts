import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createContactSubmission, listContactSubmissions, updateContactSubmission } from "./db";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const allowedAttachmentTypes = new Set([
  "application/pdf", "audio/mpeg", "audio/wav", "audio/x-wav",
  "image/jpeg", "image/png", "image/webp",
]);

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "attachment";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(320),
        message: z.string().trim().min(10).max(5000),
        attachment: z.object({
          filename: z.string().min(1).max(255),
          mimeType: z.string().min(1).max(160),
          size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
          data: z.string().min(1),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        let attachmentFields: {
          attachmentKey?: string; attachmentUrl?: string; attachmentName?: string;
          attachmentType?: string; attachmentSize?: number;
        } = {};

        if (input.attachment) {
          if (!allowedAttachmentTypes.has(input.attachment.mimeType)) throw new Error("That attachment type is not supported.");
          if (input.attachment.data.length > 7_000_000) throw new Error("That attachment is too large to upload.");
          const file = Buffer.from(input.attachment.data, "base64");
          if (file.byteLength !== input.attachment.size || file.byteLength > MAX_ATTACHMENT_BYTES) throw new Error("The attachment size could not be verified.");

          const uploaded = await storagePut(`contact-attachments/${Date.now()}-${safeFilename(input.attachment.filename)}`, file, input.attachment.mimeType);
          attachmentFields = {
            attachmentKey: uploaded.key, attachmentUrl: uploaded.url, attachmentName: input.attachment.filename,
            attachmentType: input.attachment.mimeType, attachmentSize: input.attachment.size,
          };
        }

        const id = await createContactSubmission({ name: input.name, email: input.email, message: input.message, ...attachmentFields });
        return { success: true as const, id };
      }),
    list: adminProcedure
      .input(z.object({
        search: z.string().max(120).optional(),
        status: z.enum(["all", "new", "read", "replied"]).default("all"),
        sortBy: z.enum(["createdAt", "name", "status"]).default("createdAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
      }).default({ status: "all", sortBy: "createdAt", sortDir: "desc" }))
      .query(({ input }) => listContactSubmissions(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["new", "read", "replied"]).optional(),
        replyMessage: z.string().trim().max(5000).optional(),
      }))
      .mutation(async ({ input }) => {
        const hasReply = Boolean(input.replyMessage?.trim());
        await updateContactSubmission(input.id, {
          ...(input.status ? { status: input.status } : {}),
          ...(input.replyMessage !== undefined ? { replyMessage: input.replyMessage.trim() || null } : {}),
          ...(hasReply || input.status === "replied" ? { repliedAt: new Date() } : {}),
        });
        return { success: true as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
