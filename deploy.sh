#!/bin/bash
# This script is used to deploy the application. It pulls the latest code from 
# the main branch, installs dependencies, and restarts the service.
# Make sure to run this script with appropriate permissions, especially for restarting the service.
# Usage: ./deploy.sh
# Note: Ensure that the .env file is updated with the correct PORT value (3010) for dev before running this script.


# Dev - PORT 3010
# QA - PORT 4010
# Prod - PORT 8010


git pull origin main
bun install
sudo systemctl restart bun-chat-qa # Restarts the service 


# To setup QA Environment
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