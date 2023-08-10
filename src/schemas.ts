import { z } from "zod";

export const shortMessageSchema = z.object({
  id: z.number().int().safe().positive(),
  from: z.string().email(),
  subject: z.string(),
  date: z.string().nonempty(),
});

export const attachmentSchema = z.object({
  filename: z.string().nonempty(),
  contentType: z.string().nonempty(),
  size: z.number().int().safe().nonnegative(),
});

export const messageSchema = shortMessageSchema.extend({
  attachments: z.array(attachmentSchema),
  body: z.string(),
  textBody: z.string(),
  htmlBody: z.string(),
});
