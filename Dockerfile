# Use the official Bun image as the base
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app



# Copy package.json and bun.lock (if present) to install dependencies
COPY package.json bun.lock ./

# Install project dependencies
RUN bun install 

# Copy the rest of the application files
COPY . .

# Ensure the /data directory exists
RUN mkdir -p /data

# Expose the port
EXPOSE 3000

# Define the command to run the application
CMD ["bun", "run", "start"]