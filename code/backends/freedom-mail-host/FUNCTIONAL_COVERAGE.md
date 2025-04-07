# Freedom Mail Host Functional Coverage

## Scenarios

### **[inbound]** An inbound email is received from another server

**[inbound.plain]** Deliver a plain email to our user.
**[inbound.plain.cc]** Deliver to our user in Cc.
**[inbound.plain.bcc]** Deliver to our user in Bcc.
**[inbound.negative.user]** Reject email from outside to our domain but wrong user.
**[inbound.negative.domain]** Reject email from outside to non-our domain.
**[inbound.mixed.rcpt]** Process when To header contains a mix of valid and invalid addresses.
- Our user
- Our domain, not a user
- Not our domain
- Same for Cc
- Same for Bcc
**[inbound.negative.from]** Reject when FROM command and From header are different.
**[inbound.negative.too-big]** Reject when the size of email is too big.
**[inbound.negative.interrupt]** Handle interrupted body transfer gracefully.
**[inbound.negative.internal-error]** Handle internal server error gracefully.
**[inbound.pgp]** Deliver a PGP-encrypted email to our user.

### **[outbound]** An email is sent by our user

**[outbound.plain]** Send a plain email to external user.
**[outbound.negative.wrong-credentials]** Reject wrong user credentials.
**[outbound.mixed.rcpt]** Process when To header contains a mix of valid and invalid addresses.
- Our user
- Our domain, not a user
- Not our domain
- Same for Cc
- Same for Bcc

## Module to scenario mapping

### smtp-server

#### Sub-module defineSmtpServer()

#### smtp-server itself
