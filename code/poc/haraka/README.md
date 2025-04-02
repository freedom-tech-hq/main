# Haraka as Outbound SMTP Server

This is an evaluation of Haraka to be used as an outbound SMTP server.

## Test

```bash
swaks --to nowhere@no-server.koryagin.com \
      --from user1@mail-host.dev.linefeedr.com \
      --server 127.0.0.1:587 \
      --auth PLAIN \
      --auth-user user1@mail-host.dev.linefeedr.com \
      --auth-password password123 \
      --body "This is a test email"
```

```bash
swaks --to pavel.koryagin@freedomtechhq.com \
      --from user1@mail-host.dev.linefeedr.com \
      --server 127.0.0.1:587 \
      --auth PLAIN \
      --auth-user user1@mail-host.dev.linefeedr.com \
      --auth-password password123 \
      --body "This is a test email"
```

```bash
swaks --to pavel.koryagin@freedomtechhq.com \
      --from user1@mail-host.dev.linefeedr.com \
      --server smtp1.dev.linefeedr.com:587 \
      --tls \
      --auth PLAIN \
      --auth-user user1@mail-host.dev.linefeedr.com \
      --auth-password password123 \
      --body "This is a test email from DO"
```

## Connect to dev server

```bash
docker context create \
    --docker host=ssh://pavel@159.223.161.225 \
    --description="TMP DO server" \
    do-dev
```

Probe:

```bash
docker --context do-dev ps
```

## Deploy

```bash
COMPOSE_BAKE=true docker --context do-dev compose up -d --build
```

## Haraka's default README for this directory

Haraka

Congratulations on creating a new installation of Haraka.

This directory contains two key directories for how Haraka will function:

- config

        This directory contains configuration files for Haraka. The
        directory contains the default configuration. You probably want
        to modify some files in here, particularly 'smtp.ini'.

- plugins

        This directory contains custom plugins which you write to run in
        Haraka. The plugins which ship with Haraka are still available
        to use.

- docs/plugins

        This directory contains documentation for your plugins.

Documentation for Haraka is available via 'haraka -h <name>' where the name
is either the name of a plugin (without the .js extension) or the name of
a core Haraka module, such as 'Connection' or 'Transaction'.

To get documentation on writing a plugin type 'haraka -h Plugins'.
