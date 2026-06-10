FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .next ./.next
COPY public ./public
COPY data ./data

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
