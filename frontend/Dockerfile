# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first (Docker cache optimization)
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]