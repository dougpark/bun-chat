#!/bin/bash

# runs as a cron 

# Use absolute paths for everything
PROJECT_DIR="/home/dougpark/Production/bun-chat"
BUN_BIN="/home/dougpark/.bun/bin/bun"

cd $PROJECT_DIR

# Fetch the latest metadata from GitHub
git fetch origin main

# Check if the local version is different from the remote version
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
    echo "$(date): New version detected. Deploying..."
    git reset --hard origin/main
    $BUN_BIN install
    sudo systemctl restart bun-chat-qa.service
else
    echo "$(date): No changes detected."
fi

# This script is used to deploy the application. It pulls the latest code from 
# the main branch, installs dependencies, and restarts the service.
# Make sure to run this script with appropriate permissions, especially for restarting the service.
# Usage: ./deploy.sh
# Note: Ensure that the .env file is updated with the correct PORT value (3010) before running this script.
# The service is defined in /etc/systemd/system/bun-chat-qa.service and is set to restart automatically on failure.
# The service listens on port 3010, which is specified in the .env file and used in the server.ts file.

# Dev - PORT 3010
# QA - PORT 4010
# Prod - PORT 8010

# manual deployment steps:
# git pull origin main
# bun install
# sudo systemctl restart bun-chat-qa # Restarts the service 


# sudo nano /etc/systemd/system/bun-chat-qa.service
# [Unit]
# Description=Bun Chat QA Server
# After=network.target

# [Service]
# # The root of your project
# WorkingDirectory=/home/dougpark/Production/bun-chat
# # Point Bun to the new location in the src folder
# ExecStart=/home/dougpark/.bun/bin/bun src/server.ts
# # Your specific port mapping for QA
# Environment=PORT=4010
# Restart=always
# # Optional: ensures the logs show up under the right name
# SyslogIdentifier=bun-chat-qa

# [Install]
# WantedBy=multi-user.target


# authorize to run sudo systemctl restart bun-chat-qa.service without password:
# sudo visudo
# Add the following line at the end of the file:
# dougpark ALL=(ALL) NOPASSWD: /bin/systemctl restart bun-chat-qa.service


# crontab -e
# Add the following line to run the deploy script every 5 minutes:
# */5 * * * * /home/dougpark/Production/bun-chat/deploy.sh >> /home/dougpark/Production/bun-chat/deploy.log 2>&1
