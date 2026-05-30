# Giscus Comments Activation Runbook

Giscus (GitHub Discussions-backed comments) is **activated** on the published
wiki as of WG-92. This runbook documents the activation state and how to verify
or roll it back.

## Current state (WG-92 rollout)

- GitHub Discussions: **enabled** on `j0KZ/jkz-docs`.
- Category: **Announcements** (Announcement type -- only maintainers create
  top-level posts; visitors reply via Giscus).
- Configuration: committed in [`.env.production`](../.env.production) (see below).
- Remaining manual step: **install the Giscus GitHub App** (see Prerequisites #2).
  Until the app is installed, the comment box renders but cannot post/load
  comments.

## Prerequisites

1. **Enable GitHub Discussions** on the `j0KZ/jkz-docs` repository (done):
   - Repo Settings → Features → check "Discussions"

2. **Install the Giscus GitHub App** (pending -- requires repo owner):
   - Visit https://github.com/apps/giscus
   - Install on the `j0KZ/jkz-docs` repository (or all repos)

3. **Discussion category** for comments (done):
   - Using the default **Announcements** category. To use a dedicated category
     instead, create one (Repo → Discussions → Categories → New category) with
     "Announcement" type and update `PUBLIC_GISCUS_CATEGORY` /
     `PUBLIC_GISCUS_CATEGORY_ID` accordingly.

## Configuration

The repo ID and category ID are **public** values (they ship in the client
bundle), so they are checked into [`.env.production`](../.env.production) rather
than the deployment dashboard -- this keeps the production build self-contained.
Astro loads `.env.production` during `astro build` (production mode) and inlines
`PUBLIC_`-prefixed vars.

```
PUBLIC_GISCUS_ENABLED=true
PUBLIC_GISCUS_REPO=j0KZ/jkz-docs
PUBLIC_GISCUS_REPO_ID=R_kgDOQAQVuw
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOQAQVu84CxVHM
```

The IDs above were obtained from the GitHub GraphQL API
(`repository.id` and `repository.discussionCategories`); https://giscus.app
generates the same values from the repo name.

## Verification

1. After deploy, open any doc page
2. Scroll to the bottom -- the Giscus comment box should appear
3. Post a test comment, verify it appears in GitHub Discussions
4. Verify dark/light theme switching works

## Rollback

Set `PUBLIC_GISCUS_ENABLED=` (empty) in `.env.production` and redeploy. The
component renders nothing when the flag is not exactly `true`.
