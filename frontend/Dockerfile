# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage - serve with a lightweight HTTP server
FROM node:18-alpine

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5173

# Serve the build
CMD ["serve", "-s", "dist", "-l", "5173"]