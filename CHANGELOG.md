# Changelog

## 0.1.1

- Contact address corrected to `support@certyneo.com`. The 0.1.0 metadata
  pointed at `api-support@certyneo.com`, a mailbox nobody reads — which also
  meant n8n's ownership-verification token was sent into a void.

## 0.1.0

First release.

### Nodes

- **Certyneo** — envelopes (create, send, get, get many, download the signed
  document, get the audit trail) and templates (get many). The template field
  loads the account's templates by name, since template ids are opaque
  strings.
- **Certyneo Trigger** — starts a workflow on any of the eleven signature
  lifecycle events. The webhook subscription is registered with Certyneo when
  the workflow is activated and removed when it is deactivated.

### Credentials

- **Certyneo API** — bearer API key, with a test request against
  `/account/me`. Also sends `X-Certyneo-Source: n8n`, which is what lets the
  Certyneo dashboard show the connection as active: n8n's outbound
  User-Agent is axios', so attribution cannot be inferred from it.

### Known limitations

- Document upload is not exposed as an operation. Certyneo expects
  `multipart/form-data`, which the declarative style cannot express cleanly —
  use the built-in HTTP Request node, as described in the README.
- The trigger does not verify the HMAC signature. By the time the node runs
  the body has been parsed, and a re-serialised body can differ from the
  bytes that were signed, so a check here would reject valid events. The
  signature is passed through in the node output.
- Calls go to `certyneo.com/api/v1`, not the `api.certyneo.com/v1` the
  OpenAPI document advertises: that host currently redirects to a 404.
