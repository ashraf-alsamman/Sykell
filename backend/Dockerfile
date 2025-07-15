# Build stage
FROM golang:1.21-alpine AS builder

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod file
COPY go.mod ./
# Copy all source code
COPY . .
# Generate go.sum and download dependencies
RUN go mod tidy
# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -mod=mod -o main .
# Verify binary exists and set permissions
RUN ls -la main && chmod +x main

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/main .

# Verify binary exists and set permissions
RUN ls -la main && chmod +x main

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"] 