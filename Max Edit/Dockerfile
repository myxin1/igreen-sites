FROM node:18-bullseye-slim

RUN apt-get update && apt-get install -y ffmpeg git curl ca-certificates --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . ./
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node","dist/server.js"]
