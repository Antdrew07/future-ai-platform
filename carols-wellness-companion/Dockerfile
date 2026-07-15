# Explicit build for Carol's Wellness Companion (Next.js 14 + Prisma).
# Used by Railway (via railway.json builder = DOCKERFILE) for a deterministic
# build instead of relying on Nixpacks auto-detection.
FROM node:20-bookworm-slim

WORKDIR /app

# Prisma engines need OpenSSL at build (generate) and runtime.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy the whole app first so the "prisma generate" postinstall has the schema.
COPY . .

# Install all deps (incl. dev deps needed to build) using the lockfile.
RUN npm ci

# prisma generate + next build (see package.json "build")
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# prisma migrate deploy + next start on $PORT (see package.json "start")
CMD ["npm", "run", "start"]
