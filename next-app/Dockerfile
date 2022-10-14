FROM node:16-alpine AS deps

ARG BUILD_ENV=.env

WORKDIR /app

COPY . .

RUN find . -type f -name '.env**.*' -delete

COPY ./$BUILD_ENV .env

RUN npm install -g pnpm

RUN pnpm install

CMD ["pnpm", "run", "dev"]
