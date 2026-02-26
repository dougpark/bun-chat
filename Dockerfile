# Use the official Bun image as a base
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN bun install

# Copy the rest of the application files
COPY . .

# Expose the port your Bun app listens on
EXPOSE 3000

# Command to run the application
CMD ["bun", "run", "server.ts"]
