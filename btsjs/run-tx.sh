#!/usr/bin/env bash
NODE_PORT=3000 NODE_ENV=DEVELOPMENT supervisor --watch ./dist/ -e js --no-restart-on error dist/App.js
