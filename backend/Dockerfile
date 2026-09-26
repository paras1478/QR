FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 8000
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
