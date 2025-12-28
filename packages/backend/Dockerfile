FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build
RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/main"]
