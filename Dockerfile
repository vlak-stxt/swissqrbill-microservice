FROM node:25.9.0-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN (git describe --tags --exact-match HEAD || git rev-parse --short HEAD || node -p "JSON.parse(require('node:fs').readFileSync('package.json', 'utf8')).version") > .app-version
RUN npm run build

FROM node:25.9.0-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/.app-version ./.app-version
COPY --from=build /app/LICENSE ./LICENSE
COPY --from=build /app/README.md ./README.md

EXPOSE 3000

CMD ["node", "dist/server.js"]
