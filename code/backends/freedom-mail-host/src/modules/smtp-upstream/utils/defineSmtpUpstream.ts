import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import * as config from '../../../config.ts';

/**
 * Mail upstream interface for sending emails to an upstream SMTP server
 * TODO: Revise do we need an instance or a static function is enough
 */
export interface SmtpUpstream {
  /**
   * Forwards an email to the upstream mail server
   * @param emailData - The raw email data
   * @returns Promise that resolves when the email is sent
   */
  deliverOutboundEmail(emailData: string): Promise<void>;
}

/**
 * Creates an SMTP upstream component
 * It is now a wrapper for nodemailer and could implement a queue in the future
 */
export function defineSmtpUpstream(): SmtpUpstream {
  // Create a nodemailer transporter
  const transporter: Transporter = nodemailer.createTransport({
    host: config.SMTP_UPSTREAM_HOST,
    port: config.SMTP_UPSTREAM_PORT,
    secure: false, // TODO: Enable TLS
  });

  return {
    deliverOutboundEmail: async (emailData) => {
      // Send the raw email data
      await transporter.sendMail({
        raw: emailData,
      });
    },
  };
}
