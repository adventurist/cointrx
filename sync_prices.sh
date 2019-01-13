#!/usr/bin/env bash

set -e
set -u

rm /data/www/coinx/prices.sql
bash /data/www/coinx/fetch_prices.sh
psql -w -X -U postgres postgres -f /data/www/coinx/clear_prices_db.sql --echo-all
psql -w -X -U postgres coinxdb < /data/www/coinx/prices.sql --echo-all


echo "local COIN TRX prices synced with live platform"
exit 0
