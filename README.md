# n8n-nodes-certyneo

An [n8n](https://n8n.io) community node for [Certyneo](https://certyneo.com),
an eIDAS-compliant electronic signature platform hosted in Europe.

Send documents out for signature, follow envelopes through their lifecycle,
and start workflows the moment something is signed, declined or expired.

[Installation](#installation) · [Credentials](#credentials) ·
[Operations](#operations) · [Trigger](#trigger) ·
[Known limitations](#known-limitations) · [Resources](#resources)

## Installation

Follow the
[community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
and search for `n8n-nodes-certyneo`.

## Credentials

You need a Certyneo account on a plan that includes API access.

1. In Certyneo, open **Settings → REST API**.
2. Create a key with the `envelopes:read`, `envelopes:write` and
   `webhooks:write` scopes.
3. Copy it immediately — the key is shown only once.
4. In n8n, create a **Certyneo API** credential and paste the key.

Keys starting with `sk_test_` run against the sandbox: the whole flow works
end to end and no email reaches a real signer. Keys starting with `sk_live_`
send for real.

## Operations

### Envelope

| Operation | What it does |
| --- | --- |
| Create | Builds an envelope from a Certyneo template or from documents already uploaded, with its recipients |
| Send | Takes the envelope out of draft and emails the signers |
| Get | Retrieves one envelope with its status and recipients |
| Get Many | Lists envelopes, most recent first, with an optional status filter |
| Download Signed Document | Fetches the signed PDF of a completed envelope |
| Get Audit Trail | Fetches the evidence record of an envelope |

Creation and sending are two calls on purpose: an envelope is born a draft,
which is what lets you inspect or amend it before it reaches the signers.

### Template

| Operation | What it does |
| --- | --- |
| Get Many | Lists the templates on the account |

## Trigger

The **Certyneo Trigger** node starts a workflow on any of the eleven
lifecycle events:

`envelope.created` · `envelope.sent` · `envelope.completed` ·
`envelope.declined` · `envelope.voided` · `envelope.expired` ·
`envelope.returned_to_sender` · `envelope.resubmitted` ·
`recipient.viewed` · `recipient.signed` · `recipient.approved`

The subscription is registered with Certyneo when you activate the workflow
and removed when you deactivate it. Each delivery carries the event name, its
payload, and the `X-Certyneo-Signature` header, which is the HMAC-SHA256 of
the raw request body.

## Known limitations

**Document upload is not exposed as an operation.** Certyneo accepts uploads
as `multipart/form-data`, which this node's declarative style cannot express
cleanly. Until it is added, upload with the built-in **HTTP Request** node:

```
POST https://certyneo.com/api/v1/documents
Authorization: Bearer <your key>
Content-Type: multipart/form-data      (field name: file)
```

Then pass the returned document IDs to **Envelope → Create** with **Source**
set to _Documents_.

**The trigger does not verify the signature for you.** Verifying an HMAC
means hashing the exact bytes that were sent, and by the time the node runs,
the body has been parsed — a re-serialised body can differ from the original,
so a check here would reject valid events. The signature is passed through in
the node output; verify it in a Code node if your threat model calls for it.

**Base URL.** Calls go to `certyneo.com/api/v1`. The published OpenAPI
document advertises `api.certyneo.com/v1` as the intended public contract,
but that host currently redirects to a 404 because the proxy does not rewrite
`/v1` to `/api/v1`. This node ships the host that answers today.

## Compatibility

Tested against n8n 1.x with Node.js 20.15 or later. The package has no
runtime dependencies.

## Resources

- [Certyneo n8n integration guide](https://certyneo.com/en/integrations/n8n)
- [Certyneo API documentation](https://certyneo.com/docs)
- [Ready-made n8n workflow](https://certyneo.com/api/v1/n8n/certyneo-workflow.json)
  — import it if you would rather start from a working canvas than wire the
  nodes yourself
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE)
