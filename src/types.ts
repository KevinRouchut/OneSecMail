import { z } from "zod";
import { shortMessageSchema, attachmentSchema, messageSchema } from "./schemas.js";

export type ShortMessage = z.infer<typeof shortMessageSchema>;

export type Attachment = z.infer<typeof attachmentSchema>;

export type Message = z.infer<typeof messageSchema>;

export type Options = {
  retry: number;
  timeout: number;
};
