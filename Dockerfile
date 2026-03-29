FROM node:25.8.2-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:25.8.2-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/LICENSE ./LICENSE
COPY --from=build /app/README.md ./README.md

EXPOSE 3000

CMD ["node", "dist/server.js"]
