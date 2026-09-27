FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 8000
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
