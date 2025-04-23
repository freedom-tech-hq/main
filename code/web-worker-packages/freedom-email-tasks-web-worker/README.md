# freedom-email-tasks-web-worker

## Summary

freedom-email-tasks-web-worker implements a set of asynchronous tasks for email and user management, designed to run inside a web worker and exposed via Comlink for use by the main thread. This enables offloading heavy or asynchronous operations from the UI, improving responsiveness and security in the Freedom project.

## Overview

This package exposes a collection of tasks related to email and user operations. The main export is a set of functions (grouped in the `TasksImpl` class), which are made available to the main thread using Comlink.

### Provided Tasks

- **Email Credential Management**
  - Activate users with locally stored encrypted email credentials
  - List locally stored encrypted email credentials
- **Mail Management**
  - Create mail drafts
  - Retrieve mail for a thread
  - Fetch mail collections
  - Get mail threads for a collection
- **User Management**
  - Create a user
  - Restore a user
  - Start a sync service
- **Development Helper**
  - Forward environment variables for development

All tasks are asynchronous and inject a trace context for logging and debugging. The actual logic for each task is dynamically imported on demand.

## Usage

This package is intended to be used as a web worker, with tasks accessed via Comlink from the main thread. Each task is designed to be called asynchronously.
