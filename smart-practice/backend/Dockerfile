FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads/logos /app/uploads/headers

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "src/index.js"]