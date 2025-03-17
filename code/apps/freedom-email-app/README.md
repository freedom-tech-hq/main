# Freedom Email App

The Freedom Email web application

## Preparing Environment

- Edit: `/etc/hosts` (using `sudo` if required), add a line like:

   ```plaintext
   127.0.0.1       www.local.dev.freedommail.me
   ```

- Run: `yarn generate-https-key-and-cert`
- Add `.ssl/cert.pem` to your keychain and set it to be trusted (this will let you use `https://www.local.dev.freedommail.me:3443`)

## Running Locally

_Be sure to run `yarn prep` (or `yarn prep:dev`) in `../../` before running._

- Run: `yarn start:https`
- Open: <https://www.local.dev.freedommail.me:3443> in your browser
