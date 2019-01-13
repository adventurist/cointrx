#!/usr/bin/env bash

set -e
set -u

rm /var/www/coinx/coinxlatest.sql
bash /var/www/coinx/fetch_db.sh
psql -w -X -U postgres postgres -f /var/www/coinx/clear_db.sql --echo-all
psql -w -X -U postgres coinxdb < /var/www/coinx/coinxlatest.sql --echo-all


echo "local COIN TRX Database resynced with live platform"
exit 0
