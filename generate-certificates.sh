#!/bin/bash

# Create certificates directory if it doesn't exist
mkdir -p certificates

# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certificates/private.key \
    -out certificates/certificate.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set proper permissions
chmod 600 certificates/private.key
chmod 600 certificates/certificate.crt

echo "SSL certificates generated successfully!" 