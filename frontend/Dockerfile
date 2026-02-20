# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Vite env vars injected at build time
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_API_URL
ARG VITE_MARKETING_URL

# Build the app (skip tsc, Vite handles its own transpilation)
RUN npx vite build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
