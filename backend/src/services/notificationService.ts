import nodemailer from "nodemailer";
import { config } from "../config";
import { logger } from "../utils/logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!config.email.smtpHost) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpPort === 465,
      auth: config.email.smtpUser
        ? { user: config.email.smtpUser, pass: config.email.smtpPass }
        : undefined,
    });
  }
  return transporter;
}

/** Sends an "NFT unlocked" email notification; a no-op if SMTP isn't configured. */
export async function sendUnlockEmail(toEmail: string, nftName: string): Promise<void> {
  const client = getTransporter();
  if (!client) {
    logger.info({ toEmail, nftName }, "SMTP not configured — skipping unlock email");
    return;
  }

  await client.sendMail({
    from: config.email.fromAddress,
    to: toEmail,
    subject: `Your NFT "${nftName}" is unlocked!`,
    text: `Good news! Your NFT "${nftName}" has been unlocked and is ready to claim. Log in to claim it.`,
  });
}
