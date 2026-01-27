# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Update nginx config to use Render's PORT
RUN sed -i 's/listen 80;/listen 10000;/g' /etc/nginx/conf.d/default.conf

# Expose port (Render uses PORT env var)
EXPOSE 10000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
