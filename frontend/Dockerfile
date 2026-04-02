# STAGE 1: Build Phase
FROM node:21-alpine AS builder

WORKDIR /app

# Install dependencies using package-lock.json if available
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# STAGE 2: Production Phase
FROM nginx:alpine

# Copy the custom Nginx configuration to enable Reverse Proxy
# We replace the default configuration in /etc/nginx/conf.d/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static build from the first stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for the frontend
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
