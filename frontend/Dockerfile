# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Replace placeholder API URL with environment variable during build
RUN sed -i 's|http://localhost:3001/api|${REACT_APP_API_URL}|g' src/App.js || true
RUN sed -i 's|http://localhost:3001/api|${REACT_APP_API_URL}|g' src/pages/ExportRequests.js || true

# Build the app
ARG REACT_APP_API_URL
ARG REACT_APP_BOT_USERNAME
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BOT_USERNAME=$REACT_APP_BOT_USERNAME
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (using dynamic port from environment)
EXPOSE $PORT

# Start nginx
CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
