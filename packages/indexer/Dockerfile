# Pinned to Node 20 deliberately, not "latest LTS" — better-sqlite3 (a native addon) ships
# prebuilt binaries for well-established Node versions; a build image that auto-selects the
# newest available Node (as Render's default Node buildpack did, landing on 26.x) risks no
# prebuilt binary existing yet and falling back to a from-source compile that may not have a
# full toolchain available. Node 20 is the same major version already used in local dev
# (see DECISIONS.md's prebuild-install note), so this is a known-good target, not a guess.
FROM node:20-bookworm-slim

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /app

# Whole monorepo, not just packages/indexer — this is a pnpm workspace, so the indexer's
# @keystone/shared dependency needs the workspace root (package.json, pnpm-workspace.yaml,
# pnpm-lock.yaml) and packages/shared present to resolve at install time. Simpler and safer for
# a hackathon deploy than cherry-picking exact paths and risking a missed file.
COPY . .

# --filter @keystone/indexer... installs only the indexer and what it actually depends on
# (@keystone/shared) — without this, pnpm installs the whole workspace including apps/web's
# entire Next.js/React toolchain, which the indexer never touches and which is most of why this
# step is slow.
RUN pnpm install --frozen-lockfile --filter @keystone/indexer...

WORKDIR /app/packages/indexer
ENV NODE_ENV=production

CMD ["pnpm", "start"]
