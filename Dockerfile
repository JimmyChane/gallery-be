# syntax=docker/dockerfile:1

##############################
# INSTALL DEPENDENCIES
##############################

FROM node:22-alpine AS deps
WORKDIR /usr/src/app

COPY package*.json ./
# CHANGE: Use npm ci (faster) and a cache mount (saves packages between builds)
RUN --mount=type=cache,target=/root/.npm npm ci

##############################
# DEV
##############################

FROM node:22-alpine AS development
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

CMD ["npm", "run", "start:dev"]

##############################
# BUILD
##############################

FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN npm run build
# CHANGE: Use the cache mount here too to speed up the pruning
RUN --mount=type=cache,target=/root/.npm npm prune --production

##############################
# PRODUCTION
##############################

FROM node:22-alpine AS run
WORKDIR /usr/src/app

USER node

COPY --from=build --chown=node:node /usr/src/app/package*.json ./
COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist

CMD ["node", "dist/main.js"]

EXPOSE 8001