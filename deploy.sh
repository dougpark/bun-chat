#!/bin/bash
# This script is used to deploy the application. It pulls the latest code from 
# the main branch, installs dependencies, and restarts the service.
# Make sure to run this script with appropriate permissions, especially for restarting the service.
# Usage: ./deploy.sh
# Note: Ensure that the .env file is updated with the correct PORT value (3010) before running this script.
# The service is defined in /etc/systemd/system/bun-chat-qa.service and is set to restart automatically on failure.
# The service listens on port 3010, which is specified in the .env file and used in the server.ts file.

# Dev - PORT 3010
# QA - PORT 3010
# Prod - PORT 8010


git pull origin main
bun install
sudo systemctl restart bun-chat-qa # Restarts the service which is locked to port 3010


# /etc/systemd/system/bun-chat-qa.service
# [Service]
# WorkingDirectory=/home/dougpark/Production/bun-chat
# ExecStart=/home/dougpark/.bun/bin/bun server.ts
# Environment=PORT=3010
# Restart=alway