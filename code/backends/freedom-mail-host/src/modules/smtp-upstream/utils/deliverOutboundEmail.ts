import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { StoredMail } from 'freedom-email-sync';


import * as config from '../../../config.ts';

// Module-wide singleton transporter
const transporter: Transporter = nodemailer.createTransport({
  host: config.SMTP_UPSTREAM_HOST,
  port: config.SMTP_UPSTREAM_PORT,

  // TODO: Enable TLS, these two are now in the same docker deployment, but in the future it could be different physical servers
  // [ERR_TLS_CERT_ALTNAME_INVALID]: Hostname/IP does not match certificate's altnames: Host: delivery-host. is not in the cert's altnames: DNS:smtp1.dev.linefeedr.com
  // Maybe a delivery host should be a separate deployment, but it will require authentication
  // Or use hosts in compose.yaml?
  secure: false,
  ignoreTLS: true,
  requireTLS: false
});

/**
 * Deliver an email to an external server.
 * Returns sucessfully if the email is accepted by the upstream server. In our setup this means that our delivery
 * server has validated and queued it internally.
 * @param mail - The stored mail object containing email data
 * @returns Promise that resolves when the email is sent
 */
export async function deliverOutboundEmail(mail: StoredMail): Promise<void> {
  await transporter.sendMail({
    from: mail.from,
    to: mail.to,
    cc: mail.cc,
    bcc: mail.bcc,
    subject: mail.subject,
    text: mail.body,
  });
}
