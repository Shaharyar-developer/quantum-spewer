# Use the official Bun image as the base
FROM oven/bun

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and bun.lockb (if present) to install dependencies
COPY package.json bun.lock ./

# Install project dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Expose the port
EXPOSE 3000

# Define the command to run the application
CMD ["bun", "run", "start"]