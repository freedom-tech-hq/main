/**
 * Handler for sent emails (with authentication)
 */
export async function onSentEmail(_userId: string, _emailData: string): Promise<void> {
  throw new Error("Not implemented. We probably don't need it as the outgoing emails should come from HTTP API");
  // await processEmail('sent', emailData);
  //
  // // Create mail upstream component to send emails
  // const mailUpstream = defineSmtpUpstream();
  //
  // // Forward the email to the upstream mail server
  // // TODO: Deliver to local users differently
  // await mailUpstream.deliverOutboundEmail(emailData);
}
