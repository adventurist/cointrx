#!/bin/bash
source /var/www/cointrx/coinenv/bin/activate
TRX_ENV = LOCAL_DEVELOPMENT
python3.5 -u /var/www/cointrx/main.py
