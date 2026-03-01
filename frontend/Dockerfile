FROM node:21-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all the frontend files
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run Vite development server
CMD ["npm", "run", "dev"]
