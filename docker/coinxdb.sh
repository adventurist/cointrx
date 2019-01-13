#!/bin/bash

set -o errexit


readonly REQUIRED_ENV_VARS=(
  "TRX_DB_USER"
  "TRX_DB_PASSWORD"
  "TRX_DB_DATABASE"
  "POSTGRES_USER")


# Main execution:
# - verifies if all environment variables are set
# - runs the SQL code to create user and database
main() {
  check_env_vars_set
  init_user_and_db
}


# Checks if all of the required environment
# variables are set. If one of them isn't,
# echoes a text explaining which one isn't
# and the name of the ones that need to be
check_env_vars_set() {
  for required_env_var in ${REQUIRED_ENV_VARS[@]}; do
    if [[ -z "${!required_env_var}" ]]; then
      echo "Error:
    Environment variable '$required_env_var' not set.
    Make sure you have the following environment variables set:
      ${REQUIRED_ENV_VARS[@]}
Aborting."
      exit 1
    fi
  done
}


init_user_and_db() {
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
     CREATE USER $TRX_DB_USER WITH PASSWORD '$TRX_DB_PASSWORD';
     CREATE DATABASE $TRX_DB_DATABASE;
     GRANT ALL PRIVILEGES ON DATABASE $TRX_DB_DATABASE TO $TRX_DB_USER;
EOSQL
}

main "$@"
