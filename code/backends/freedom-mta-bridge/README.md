# MTA config & Mail Bridge

This is an MTA host config. It includes a bridge between an MTA (using pipe) and freedom-host-mail (using HTTP).

## Decisions

Not using build for JS as it is supposed to be small and fast.

## Cloud Deployment

See [mail-host](../../deploy/deployments/mail-host/README.md) deployment.

## Development

### Local Run

Not implemented. Debugged with cloud deployment to a local docker.

### Manual Testing

With a local deployment:

```bash
swaks --to user1@my-test.com --from sender@my-test.com --server 127.0.0.1 --body "This is a test email"
```

Test the bridge script directly:

```bash
docker exec -i workspace-smtp-server-1 bash -c "echo 'From sender@example.com Fri Mar 14 00:54:22 2025
Received: from [192.168.65.1] (helo=pavel-mac2.local)
        by 86c532fdbc46 with esmtp (Exim 4.95)
        (envelope-from <sender@example.com>)
        id 1tstJe-000009-2S
        for user1@my-test.com;
        Fri, 14 Mar 2025 00:54:22 +0000
Date: Fri, 14 Mar 2025 01:54:22 +0100
To: user1@my-test.com
From: sender@example.com
Subject: test Fri, 14 Mar 2025 01:54:22 +0100
Message-Id: <20250314015422.078377@pavel-mac2.local>
X-Mailer: swaks v20240103.0 jetmore.org/john/code/swaks/

This is a test email' | /app/bridge_incoming.js && echo 'Test completed successfully'
```
