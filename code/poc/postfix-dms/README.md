# Evaluating Docker Mailserver

[source](https://docker-mailserver.github.io/docker-mailserver/latest/examples/tutorials/basic-installation/#using-dms-as-a-local-mail-relay-for-containers)

**Alternative versions of Postfix configuration**

- [Minimum and simple](https://github.com/Glavic/Docker-postfix/blob/master/Dockerfile)
- [With quite detailed README](https://github.com/bokysan/docker-postfix)
- Also search for 'postfix dkim docker' - there are lots of them

## Status

- It works.
- The current configuration requires a user, and it respectively uses Dovecot. We don't need this in production.
- So the next step is to implement the same without Dovecot, and the input should be limited to the certain isolated Docker network.

## Opinion

Looks comprehensive. Documentation is well-structured - answers my questions.

An organizational contradiction:
- We cannot run it on a localhost, because we use ARM Macs.
- We cannot run a test version remotely because `config` should be mounted in a git folder to capture changes. Later note: not in the source code git, but into some credentials vault.
- So docker-mailserver needs its own configuration process to be thoroughly defined as it mixes configuration changes with runtime commands. Aspects:
  - Configuration (process and how to test it locally or in a dev env)
  - Remote deployment process
  - Key renew (or rotation) process
  - Scaling process. Connect centralized resources (DNS) and per instance resources (various certs).

## Decisions

## Test

```bash
swaks --to nowhere@no-server.koryagin.com \
      --from user1@mail-host.dev.linefeedr.com \
      --server 127.0.0.1:587 \
      --tls \
      --auth PLAIN \
      --auth-user user1@mail-host.dev.linefeedr.com \
      --auth-password password123 \
      --body "This is a test email"
```

```bash
swaks --to pavel.koryagin@freedomtechhq.com \
      --from user1@mail-host.dev.linefeedr.com \
      --server 127.0.0.1:587 \
      --tls \
      --auth PLAIN \
      --auth-user user1@mail-host.dev.linefeedr.com \
      --auth-password password123 \
      --body "This is a test email"
```

```bash
swaks --to nowhere@no-server.koryagin.com \
      --from user1@mail-host.dev.linefeedr.com \
      --server smtp1.dev.linefeedr.com:587 \
      --tls \
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
      --body "This is a test email from Dev Server"
```

## Caveats

- MacOS is not supported officially.
- On mounts, nuances are captured in `compose.yaml`. MacOS problems included.
- On Mac with ARM processor, dovecot crashes on start with a rosetta error message
```
$ cat /var/log/supervisor/dovecot.log
rosetta error: mmap_anonymous_rw mmap failed, size=1000
```
- For DKIM and related we should use default key size. It is often 2048, and it is [recommended for compatibility](https://datatracker.ietf.org/doc/html/rfc8301#section-3.2).
- DKIM TXT for GCP should be split into 255 char blocks. mail.txt contains it already split.
- Terraform cannot include mail.txt as it contains a DNS record, while Terraform needs a plain text file with data to include.
- DKIM key rotation process should be designed. [nice resource]
  (https://www.m3aawg.org/sites/default/files/m3aawg-dkim-key-rotation-bp-2019-03.pdf)

## Setting up a server

### Install docker

### Get a certificate
   - Self-signed could be made during the deployment anywhere
   - Let's Encrypt needs some attention and should run at the target server (or use DNS mode)

Remote:

```bash
apt install certbot

certbot certonly --standalone --non-interactive --agree-tos \
  -d smtp1.dev.linefeedr.com \
  --email pavel.koryagin@freedomtechhq.com
```

Local (with a sudo user - make it manually):

```bash
scp -r root@smtp1.dev.linefeedr.com:/etc/letsencrypt ./docker-data/
```

### Create storage

Remote:

```bash
mkdir -m 770 /var/docker-data
chown root:docker /var/docker-data
mkdir /var/docker-data/mail-data
mkdir /var/docker-data/mail-logs
```

### Configure DKIM

Run in local docker. Execute this there:

```bash
setup config dkim
```

The command is non-interactive, so could be included into a some setup/rotation script.

Add `docker-data/dms/config/opendkim/keys/mail-host.dev.linefeedr.com/mail.txt` to DNS [instruction](https://docker-mailserver.github.io/docker-mailserver/latest/config/best-practices/dkim_dmarc_spf/#dkim-dns)

### Configure DMARC

It is a DNS record and should be in IaC. Should not do it every time.

There's a configurator [available](https://dmarcguide.globalcyberalliance.org/).

Proton [article](https://proton.me/support/anti-spoofing-custom-domain).

### Deploy

Local:

```bash
# Test
COMPOSE_BAKE=true docker --context dev-server compose -f compose.deploy.yaml up --build

# Daemon
COMPOSE_BAKE=true docker --context dev-server compose -f compose.deploy.yaml up --build -d
```

## Evaluation

Tutorial also does not work.

First it is not clear when to create a user. But it is guessable in the end.

Then it starts with many error messages with default configuration:

```
mailserver  | 2025-03-28 23:26:16+01:00 INFO  start-mailserver.sh: Welcome to docker-mailserver v15.0.2
mailserver  | 2025-03-28 23:26:16+01:00 INFO  start-mailserver.sh: Checking configuration
mailserver  | 2025-03-28 23:26:16+01:00 INFO  start-mailserver.sh: Configuring mail server
mailserver  | 2025-03-28 23:26:17+01:00 ERROR sedfile: No difference after call to 'sed' in 'sedfile' (sed -i -e s|include_try /usr/share/dovecot/protocols.d|include_try /etc/dovecot/protocols.d|g /etc/dovecot/dovecot.conf)
mailserver  | 2025-03-28 23:26:17+01:00 ERROR sedfile: No difference after call to 'sed' in 'sedfile' (sed -i -r -e s|^(\s*)#?(mail_plugins =).*|\1\2 $mail_plugins sieve| -e s|^#?(lda_mailbox_autocreate =).*|\1 yes| -e s|^#?(lda_mailbox_autosubscribe =).*|\1 yes| -e s|^#?(postmaster_address =).*|\1 postmaster@dev.linefeedr.com| -e s|^#?(hostname =).*|\1 smtp1.dev.linefeedr.com| /etc/dovecot/conf.d/15-lda.conf)
mailserver  | 2025-03-28 23:26:17+01:00 ERROR sedfile: No difference after call to 'sed' in 'sedfile' (sed -i -e s|#ssl = yes|ssl = yes|g /etc/dovecot/conf.d/10-master.conf)
mailserver  | 2025-03-28 23:26:17+01:00 ERROR sedfile: No difference after call to 'sed' in 'sedfile' (sed -i -e s|#ssl = yes|ssl = required|g /etc/dovecot/conf.d/10-ssl.conf)
mailserver  | 2025-03-28 23:26:17+01:00 ERROR sedfile: No difference after call to 'sed' in 'sedfile' (sed -i -e s|#port = 993|port = 993|g /etc/dovecot/conf.d/10-master.conf)
mailserver  | 2025-03-28 23:26:18+01:00 ERROR sedfile: No difference after call to 'sed' in 'sedfile' (sed -i s|quota_max_mail_size =.*|quota_max_mail_size = 10M|g /etc/dovecot/conf.d/90-quota.conf)
mailserver  | 2025-03-28 23:26:18+01:00 ERROR sedfile: No difference after call to 'sed' in 'sedfile' (sed -i s|quota_rule = \*:storage=.*|quota_rule = *:storage=0|g /etc/dovecot/conf.d/90-quota.conf)
mailserver  | 2025-03-28 23:26:18+01:00 WARN  start-mailserver.sh: You need at least one mail account to start Dovecot (120s left for account creation before shutdown)
mailserver  | 2025-03-28 23:26:29+01:00 WARN  start-mailserver.sh: !! INSECURE !! SSL configured with plain text access - DO NOT USE FOR PRODUCTION DEPLOYMENT
mailserver  | 2025-03-28 23:26:31+01:00 INFO  start-mailserver.sh: Starting daemons
mailserver  | 2025-03-28 23:26:34+01:00 INFO  start-mailserver.sh: smtp1.dev.linefeedr.com is up and running
mailserver  | 2025-03-28T23:26:32.802785+01:00 smtp1 dovecot: master: Dovecot v2.3.19.1 (9b53102964) starting up for imap, lmtp (core dumps disabled)
mailserver  | 2025-03-28T23:26:32.815270+01:00 smtp1 dovecot: master: Error: service(anvil): command startup failed, throttling for 2.000 secs
mailserver  | 2025-03-28T23:26:32.815420+01:00 smtp1 dovecot: master: Error: service(log): child 664 killed with signal 5
mailserver  | 2025-03-28T23:26:32.815432+01:00 smtp1 dovecot: master: Error: service(log): command startup failed, throttling for 2.000 secs
mailserver  | 2025-03-28T23:26:33.210677+01:00 smtp1 opendkim[695]: OpenDKIM Filter v2.11.0 starting (args: -f)
mailserver  | 2025-03-28T23:26:33.439055+01:00 smtp1 opendmarc[701]: OpenDMARC Filter v1.4.2 starting (args: -f -p inet:8893@localhost -P /var/run/opendmarc/opendmarc.pid)
mailserver  | 2025-03-28T23:26:33.439129+01:00 smtp1 opendmarc[701]: additional trusted authentication services: smtp1.dev.linefeedr.com
mailserver  | 2025-03-28T23:26:35.057849+01:00 smtp1 amavis[727]: starting. /usr/sbin/amavisd at smtp1.dev.linefeedr.com amavis-2.13.0 (20230106), Unicode aware, LC_CTYPE="C.UTF-8"
mailserver  | 2025-03-28T23:26:35.057984+01:00 smtp1 amavis[727]: perl=5.036000, user=, EUID: 999 (999);  group=(), EGID: 999 999 (999 999)
mailserver  | 2025-03-28T23:26:35.098101+01:00 smtp1 amavis[727]: Net::Server: Group Not Defined.  Defaulting to EGID '999 999'
mailserver  | 2025-03-28T23:26:35.098130+01:00 smtp1 amavis[727]: Net::Server: User Not Defined.  Defaulting to EUID '999'
mailserver  | 2025-03-28T23:26:35.126024+01:00 smtp1 amavis[727]: No ext program for   .zoo, tried: zoo
mailserver  | 2025-03-28T23:26:35.127120+01:00 smtp1 amavis[727]: No ext program for   .doc, tried: ripole
mailserver  | 2025-03-28T23:26:35.132207+01:00 smtp1 amavis[727]: No ext program for   .zst, tried: unzstd
mailserver  | 2025-03-28T23:26:35.132236+01:00 smtp1 amavis[727]: No decoder for       .F   
mailserver  | 2025-03-28T23:26:35.132241+01:00 smtp1 amavis[727]: No decoder for       .doc 
mailserver  | 2025-03-28T23:26:35.132245+01:00 smtp1 amavis[727]: No decoder for       .zoo 
mailserver  | 2025-03-28T23:26:35.132248+01:00 smtp1 amavis[727]: No decoder for       .zst 
mailserver  | 2025-03-28T23:26:35.246620+01:00 smtp1 postfix/postfix-script[849]: starting the Postfix mail system
mailserver  | 2025-03-28T23:26:35.283947+01:00 smtp1 postfix/master[850]: fatal: chmod socket private/smtpd: Invalid argument
mailserver  | 2025-03-28T23:26:40.957712+01:00 smtp1 postfix/postfix-script[918]: warning: not owned by postfix: /var/lib/postfix/./master.lock
mailserver  | 2025-03-28T23:26:41.129819+01:00 smtp1 postfix/postfix-script[929]: starting the Postfix mail system
mailserver  | 2025-03-28T23:26:41.161657+01:00 smtp1 postfix/master[930]: fatal: chmod socket private/smtpd: Invalid argument
mailserver  | 2025-03-28T23:26:47.365879+01:00 smtp1 postfix/postfix-script[1016]: starting the Postfix mail system
mailserver  | 2025-03-28T23:26:47.396366+01:00 smtp1 postfix/master[1017]: fatal: chmod socket private/smtpd: Invalid argument
mailserver  | 2025-03-28T23:26:53.486673+01:00 smtp1 postfix/postfix-script[1095]: starting the Postfix mail system
mailserver  | 2025-03-28T23:26:53.519657+01:00 smtp1 postfix/master[1096]: fatal: chmod socket private/smtpd: Invalid argument
mailserver  | 2025-03-28T23:26:59.664236+01:00 smtp1 postfix/postfix-script[1174]: starting the Postfix mail system
mailserver  | 2025-03-28T23:26:59.697511+01:00 smtp1 postfix/master[1175]: fatal: chmod socket private/smtpd: Invalid argument
```
