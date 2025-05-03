TODO: Implement
- Host the domains
- List the roles we use, even if not used in Terraform's code

## New Server Manual Setup

For the servers created not by Terraform, use this process.

1. Configure PTR record for the server.
  - It is **not** the mail domain, it is the domain name of this particular host.
  - E.g. `smtp1.dev.linefeedr.com.`
2. Sign in to the server as `root` at least once to confirm it works for you.
  - It should be `root`. Sudoers are not supported in the init script execution.
3. Run `./init-new-server.sh <server-ip> <hostname>`.
  - Example `./init-new-server.sh 999.9.9.9 smtp1.dev.linefeedr.com`.
  - Hostname is the same as the PTR record (without the trailing dot.)
  - There're commented out lines in the end if you need to debug what it executes.
  - If you use password authentication, it will ask for the server's `root` password once.
4. Add the IP to the intended deployment.
5. Follow the extra steps demanded by the intended deployment. E.g. Let's Encrypt.
