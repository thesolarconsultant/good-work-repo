// Shared by the Telegram webhook and its setup endpoint.
import { createHash } from "node:crypto";

export const webhookSecret = () =>
  createHash("sha256").update("bh-telegram:" + (process.env.TELEGRAM_BOT_TOKEN || "")).digest("hex").slice(0, 48);
