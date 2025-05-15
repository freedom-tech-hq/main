import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';

import * as config from '../../../../config.ts';

// Module-wide singleton transporter
export const transporter: Transporter = nodemailer.createTransport({
  // Upstream server host and port
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
