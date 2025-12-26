#!/bin/bash
set -e
set -u

# Create multiple databases for microservices
# Usage: Set POSTGRES_MULTIPLE_DATABASES environment variable with comma-separated database names

function create_databases() {
    local databases=$1
    echo "Creating multiple databases: $databases"
    
    IFS=',' read -ra DB_ARRAY <<< "$databases"
    for db in "${DB_ARRAY[@]}"; do
        db=$(echo "$db" | xargs) # Trim whitespace
        echo "  Creating database '$db'"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
            CREATE DATABASE $db;
            GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOSQL
    done
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
    echo "Multiple database creation requested"
    create_databases "$POSTGRES_MULTIPLE_DATABASES"
    echo "Multiple databases created successfully"
fi
