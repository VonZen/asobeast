#!/usr/bin/env bash
set -euo pipefail

# Local Apple Container deployment. Pass the directory holding .env, api.env, and relay.py.
deploy="${1:?Usage: bash scripts/local-apple-container-up.sh /path/to/deployment}"
cli="${CONTAINER_CLI:-/usr/local/bin/container}"
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
relay_script="$project_root/scripts/local-apple-container-relay.py"
web_image="${WEB_IMAGE:-asobeast-web:local-zh-20261031-v5}"
api_image="${API_IMAGE:-asobeast-api:local-structured-json-20261031-v3}"

for file in "$deploy/.env" "$deploy/api.env" "$deploy/relay.py"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing deployment file: $file" >&2
    exit 1
  fi
done

key_count=$(grep -c '^STORE_CONNECT_ENCRYPTION_KEY=' "$deploy/.env" || true)
if [[ "$key_count" != "1" ]]; then
  echo "Expected exactly one STORE_CONNECT_ENCRYPTION_KEY in deployment .env" >&2
  exit 1
fi
key=$(grep '^STORE_CONNECT_ENCRYPTION_KEY=' "$deploy/.env" | cut -d= -f2-)
key_bytes=$(printf '%s' "$key" | base64 -D 2>/dev/null | wc -c | tr -d ' ')
unset key
if [[ "$key_bytes" != "32" ]]; then
  echo "Store connection encryption key must decode to 32 bytes" >&2
  exit 1
fi

# After restarting Apple Container, reuse the existing stateful containers and volumes.
for service in asobeast-postgres asobeast-redis; do
  if ! "$cli" inspect "$service" >/dev/null 2>&1; then
    echo "Missing existing container: $service" >&2
    exit 1
  fi
  if ! "$cli" inspect "$service" | jq -e '.[0].status.state == "running"' >/dev/null; then
    "$cli" start "$service"
  fi
done
for attempt in {1..40}; do
  if "$cli" exec asobeast-postgres pg_isready -U asobeast -d asobeast >/dev/null 2>&1 &&
     "$cli" exec asobeast-redis redis-cli ping >/dev/null 2>&1; then break; fi
  if [[ "$attempt" -eq 40 ]]; then
    echo "PostgreSQL or Redis did not become ready" >&2
    exit 1
  fi
  sleep 2
done

ip_of() {
  "$cli" inspect "$1" | jq -r '.[0].status.networks[] | select(.network=="asobeast") | .ipv4Address | split("/")[0]'
}
db_ip=$(ip_of asobeast-postgres)
redis_ip=$(ip_of asobeast-redis)
if [[ -z "$db_ip" || -z "$redis_ip" ]]; then
  echo "Start the existing PostgreSQL and Redis containers first" >&2
  exit 1
fi
stored_database_url=$(grep '^DATABASE_URL=' "$deploy/api.env" | cut -d= -f2-)
database_url=$(printf '%s' "$stored_database_url" | sed -E "s/@[0-9.]+:5432/@$db_ip:5432/")
unset stored_database_url
if [[ -z "$database_url" ]]; then
  echo "Missing DATABASE_URL in api.env" >&2
  exit 1
fi

# Recreate only stateless services. Database and Redis volumes remain untouched.
asc_proxy_args=()
if [[ -n "${ASC_HTTP_PROXY_URL:-}" ]]; then
  asc_proxy_args+=(-e "ASC_HTTP_PROXY_URL=$ASC_HTTP_PROXY_URL")
fi
"$cli" stop asobeast-api >/dev/null 2>&1 || true
"$cli" delete asobeast-api >/dev/null 2>&1 || true
"$cli" run -d --name asobeast-api --network asobeast -c 4 -m 1024M \
  --env-file "$deploy/api.env" --env-file "$deploy/.env" \
  -e "DATABASE_URL=$database_url" -e "REDIS_HOST=$redis_ip" \
  "${asc_proxy_args[@]}" \
  "$api_image"
unset database_url

for attempt in {1..40}; do
  if "$cli" exec asobeast-api node -e \
    'fetch("http://127.0.0.1:4000/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' \
    >/dev/null 2>&1; then break; fi
  if [[ "$attempt" -eq 40 ]]; then
    echo "API did not become healthy" >&2
    exit 1
  fi
  sleep 2
done

api_ip=$(ip_of asobeast-api)
"$cli" stop asobeast-web >/dev/null 2>&1 || true
"$cli" delete asobeast-web >/dev/null 2>&1 || true
"$cli" run -d --name asobeast-web --network asobeast -c 4 -m 384M \
  -e "API_INTERNAL_URL=http://$api_ip:4000" -e HOSTNAME=0.0.0.0 -e TRUST_PROXY=0 \
  "$web_image"

for attempt in {1..30}; do
  if "$cli" exec asobeast-web node -e \
    'fetch("http://127.0.0.1:3000/api/backend/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' \
    >/dev/null 2>&1; then break; fi
  if [[ "$attempt" -eq 30 ]]; then
    echo "Web could not reach the API" >&2
    exit 1
  fi
  sleep 2
done

relay_pid=$(lsof -nP -t -iTCP:3001 -sTCP:LISTEN | head -1 || true)
if [[ -n "$relay_pid" ]]; then
  relay_command="$(ps -p "$relay_pid" -o command=)"
  # macOS checkouts may use Asobeast/asobeast aliases on case-insensitive disks.
  relay_command_lower="$(printf "%s" "$relay_command" | tr "[:upper:]" "[:lower:]")"
  legacy_relay_lower="$(printf "%s" "$deploy/relay.py" | tr "[:upper:]" "[:lower:]")"
  project_relay_lower="$(printf "%s" "$relay_script" | tr "[:upper:]" "[:lower:]")"
  if [[ "$relay_command_lower" == *"$legacy_relay_lower"* || "$relay_command_lower" == *"$project_relay_lower"* ]]; then
    kill "$relay_pid"
    sleep 1
  else
    echo "Port 3001 is occupied by a different process; refusing to replace it" >&2
    exit 1
  fi
fi
nohup env CONTAINER_CLI="$cli" /usr/bin/python3 "$relay_script" \
  >>"$deploy/relay.log" 2>&1 </dev/null &
echo "$!" >"$deploy/relay.pid"
sleep 2
curl --noproxy '*' --fail --silent --show-error --max-time 12 \
  http://127.0.0.1:3001/api/backend/health >/dev/null
echo "Asobeast is available at http://localhost:3001 (API and Web healthy)."
