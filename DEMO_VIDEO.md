# Demo video for n8n verification

The manual review step of the n8n Creator Portal is blocked on a demo video.
This is the shot list.

- **Length**: 5 minutes maximum. Aim for 3:00–3:30.
- **No cuts.** n8n asks for an uninterrupted recording — a cut looks like a
  retake hiding a failure.
- **Screen**: 1920×1080, browser zoomed so the node panel is legible.
- **Audio**: optional. Silent with on-screen captions is accepted.
- **Version**: install the exact version submitted for verification —
  currently **0.1.1**. A mismatch is a rejection.
- **Key**: use a **sandbox key** (`sk_test_…`). The whole flow runs, and no
  email reaches a real signer. Blur the key after pasting; never show
  `sk_live_`.

---

## Before recording

- [ ] A clean n8n instance (self-hosted is fine, `npx n8n` is enough).
- [ ] A Certyneo account whose plan includes API access.
- [ ] A **sandbox** API key with the `envelopes:read`, `envelopes:write` and
      `webhooks:write` scopes.
- [ ] **At least one template** saved in Certyneo — scene 4 loads the template
      list, and an empty dropdown makes the node look broken.
- [ ] The n8n instance reachable from the internet if you record scene 6
      (the trigger registers a webhook Certyneo must be able to call).

---

## Shot list

### Scene 1 — Install from npm (0:00–0:40)

- **Screen**: n8n → Settings → Community nodes → **Install**.
- **Action**: type `n8n-nodes-certyneo`, tick the risk acknowledgement,
  install. Wait for the success toast.
- **Caption**: "Install n8n-nodes-certyneo from npm."
- **Why it matters**: n8n asks explicitly for the install, from npm, in the
  submitted version. Show the version number on screen if the UI displays it.

### Scene 2 — The nodes appear (0:40–1:00)

- **Screen**: new workflow → open the node panel → search "Certyneo".
- **Action**: show **both** entries — `Certyneo` and `Certyneo Trigger`.
- **Caption**: "Two nodes: an action node and a trigger."

### Scene 3 — Credential, and its test (1:00–1:40) ← the mandatory beat

- **Screen**: insert the **Certyneo** node → Credential to connect with →
  **Create new credential**.
- **Action**: paste the sandbox key → **Save**.
- **Result**: n8n runs the credential test against `GET /account/me` and shows
  **"Connection tested successfully"**.
- **Caption**: "The credential test calls /account/me and succeeds."
- **Edit note**: hold this frame for a beat. It is the single thing the
  reviewer must see. Blur the key characters.

### Scene 4 — An action, end to end (1:40–2:40)

- **Screen**: the **Certyneo** node, resource **Envelope**, operation
  **Create**.
- **Action**:
  1. Subject: `Demo contract`.
  2. Source: **Template** → open the dropdown. **The list loads from the
     account** — this shows `loadOptions` working, not a hardcoded field.
  3. Add a recipient: `signer@example.com`, role Signer.
  4. **Execute step**. Show the returned JSON: `id`, `status: DRAFT`,
     `recipients`.
- **Caption**: "Create an envelope from a template. The template list is
  fetched live."
- **Then**: switch the operation to **Send**, paste the `id` returned above,
  execute, and show the status moving to `SENT`.
- **Caption**: "Sending is a second call — an envelope is born a draft."

### Scene 5 — Used as an AI agent tool (2:40–3:00)

- **Screen**: add an **AI Agent** node → **Tool** → pick **Certyneo**.
- **Action**: one action is enough; n8n's guidelines say so explicitly.
- **Caption**: "The node is usable as an AI agent tool."
- **Why it matters**: this is point 5 of the guidelines and is easy to forget.
  `usableAsTool: true` is declared on the node; show it being honoured.

### Scene 6 — The trigger (3:00–3:30, optional but worth it)

- **Screen**: new workflow → **Certyneo Trigger** → pick
  **Envelope Completed** → **Activate**.
- **Result**: the subscription is created on Certyneo's side. Show
  Certyneo → Settings → Webhooks listing the new subscription pointing at the
  n8n production URL.
- **Caption**: "Activating the workflow registers the webhook with Certyneo.
  Deactivating removes it."
- **Skip if**: the instance is not reachable from the internet. Do not fake
  it — an unreachable instance simply cannot show this.

---

## What not to do

- **Do not stage it.** Every green check in the video has to be a check that
  actually ran. The reviewer is verifying that the node works, not that a
  slideshow can be assembled.
- **Do not cut.** If a step fails, fix the node and re-record from the top.
- **Do not show a `sk_live_` key**, even blurred, even briefly.
- **Do not record against a version other than the submitted one.**

---

## After recording

Upload on the node's page in the Creator Portal
(`creators.n8n.io/nodes/n8n-nodes-certyneo/integration`), or paste a link.
The page moves from **Awaiting Video** to manual review.
