#!/usr/bin/env bash
# Isolated Apple Container deployment for overx-ai/aso-light.
# Commands: build, up, deploy, status
set -euo pipefail
umask 077

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cli="${CONTAINER_CLI:-/usr/local/bin/container}"
state="${ASO_LIGHT_STATE_DIR:-$HOME/.local/share/aso-light}"
api_image="aso-light-api:20261028"
web_image="aso-light-web:20261028"
db_image="${ASO_LIGHT_PG_IMAGE:-postgres:16-alpine}"

ip_of() {
  "$cli" inspect "$1" | jq -r     '.[0].status.networks[] | select(.network=="aso-light") | .ipv4Address | split("/")[0]'
}
is_running() {
  "$cli" inspect "$1" 2>/dev/null |
    jq -e '.[0].status.state == "running"' >/dev/null 2>&1
}
wait_for() {
  local label="$1"
  shift
  for attempt in {1..45}; do
    if "$@" >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  echo "$label failed health check" >&2
  return 1
}
build() {
  local build_args=() configured_proxy="${all_proxy:-${ALL_PROXY:-}}"
  if [[ "$configured_proxy" == "http://127.0.0.1:7890" ]]; then
    mkdir -p "$state"
    chmod 700 "$state"
    # The Apple Container build VM cannot reach the Mac's 127.0.0.1.
    # Relay only on the vmnet bridge addresses; never expose a LAN-wide proxy.
    if ! lsof -nP -iTCP:7891 -sTCP:LISTEN | grep -q LISTEN; then
      nohup /usr/bin/python3 "$root/build-proxy-relay.py" \
        >>"$state/build-proxy.log" 2>&1 </dev/null &
      echo "$!" >"$state/build-proxy.pid"
      sleep 1
    fi
    if ! curl --silent --output /dev/null --max-time 10 \
      --proxy http://192.168.64.1:7891 https://registry-1.docker.io/v2/; then
      echo "Cannot reach container build proxy at 192.168.64.1:7891" >&2
      return 1
    fi
    build_args=(
      --build-arg HTTP_PROXY=http://192.168.64.1:7891
      --build-arg HTTPS_PROXY=http://192.168.64.1:7891
      --build-arg ALL_PROXY=http://192.168.64.1:7891
    )
  fi
  "$cli" build -m 8G -c 4 "${build_args[@]}" -f "$root/backend.Dockerfile" \
    -t "$api_image" "$root" --progress plain
  "$cli" build -m 8G -c 4 "${build_args[@]}" -f "$root/frontend.Dockerfile" \
    -t "$web_image" "$root" --progress plain
}
ensure_secrets() {
  mkdir -p "$state"
  chmod 700 "$state"
  if [[ ! -f "$state/db.env" ]]; then
    local password
    password="$(openssl rand -hex 24)"
    {
      printf 'POSTGRES_DB=aso_light\n'
      printf 'POSTGRES_USER=aso_light\n'
      printf 'POSTGRES_PASSWORD=%s\n' "$password"
    } >"$state/db.env"
    chmod 600 "$state/db.env"
  fi
  if [[ ! -f "$state/secrets.env" ]]; then
    {
      printf 'SECRET_KEY=%s\n' "$(openssl rand -hex 48)"
      printf 'JWT_SECRET_KEY=%s\n' "$(openssl rand -hex 48)"
      # A Fernet key is URL-safe base64 encoding of exactly 32 random bytes.
      printf 'FERNET_KEY=%s\n' "$(openssl rand -base64 32 | tr '+/' '-_')"
      printf 'CORS_ORIGINS=["http://localhost:3002"]\n'
    } >"$state/secrets.env"
    chmod 600 "$state/secrets.env"
  fi
}
up() {
  if ! "$cli" image inspect "$api_image" >/dev/null 2>&1 || \
     ! "$cli" image inspect "$web_image" >/dev/null 2>&1; then
    echo "App images missing. First run: bash $root/deploy.sh build" >&2
    exit 1
  fi
  ensure_secrets
  if ! "$cli" network inspect aso-light >/dev/null 2>&1; then
    "$cli" network create aso-light
  fi
  if ! "$cli" volume inspect aso-light-pgdata >/dev/null 2>&1; then
    "$cli" volume create aso-light-pgdata
  fi
  if ! "$cli" volume inspect aso-light-cache >/dev/null 2>&1; then
    "$cli" volume create aso-light-cache
  fi

  if ! "$cli" inspect aso-light-db >/dev/null 2>&1; then
    "$cli" run -d --name aso-light-db --network aso-light -c 2 -m 512M \
      --env-file "$state/db.env" \
      -e PGDATA=/var/lib/postgresql/data/pgdata \
      -v aso-light-pgdata:/var/lib/postgresql/data \
      "$db_image"
  elif ! is_running aso-light-db; then
    "$cli" start aso-light-db
  fi
  wait_for PostgreSQL "$cli" exec aso-light-db pg_isready -U aso_light -d aso_light
  local db_ip db_password api_ip
  db_ip="$(ip_of aso-light-db)"
  db_password="$(grep '^POSTGRES_PASSWORD=' "$state/db.env" | cut -d= -f2-)"
  test -n "$db_ip" && test -n "$db_password"
  # Runtime-only private env file; no secrets in container command arguments.
  {
    cat "$state/secrets.env"
    printf 'DATABASE_URL=postgresql+asyncpg://aso_light:%s@%s:5432/aso_light\n' "$db_password" "$db_ip"
  } >"$state/api.env"
  chmod 600 "$state/api.env"
  unset db_password

  "$cli" stop aso-light-api >/dev/null 2>&1 || true
  "$cli" delete aso-light-api >/dev/null 2>&1 || true
  "$cli" run -d --name aso-light-api --network aso-light -c 3 -m 1536M \
    --env-file "$state/api.env" \
    -v aso-light-cache:/src/backend/.cache \
    "$api_image"
  wait_for "ASO-Light API" "$cli" exec aso-light-api python -c \
    'import urllib.request; assert urllib.request.urlopen("http://127.0.0.1:8002/health", timeout=6).status == 200'
  api_ip="$(ip_of aso-light-api)"
  test -n "$api_ip"

  "$cli" stop aso-light-web >/dev/null 2>&1 || true
  "$cli" delete aso-light-web >/dev/null 2>&1 || true
  "$cli" run -d --name aso-light-web --network aso-light -c 2 -m 384M \
    -e "API_IP=$api_ip" "$web_image"

  # Preserve other services on the Mac. Only replace our own relay.
  local pid cmd process_path
  pid="$(lsof -nP -t -iTCP:3002 -sTCP:LISTEN | head -1 || true)"
  if [[ -n "$pid" ]]; then
    cmd="$(ps -p "$pid" -o command= | tr '[:upper:]' '[:lower:]')"
    process_path="$(printf '%s' "$root/relay.py" | tr '[:upper:]' '[:lower:]')"
    if [[ "$cmd" == *"$process_path"* ]]; then
      kill "$pid"
      sleep 1
    else
      echo "Port 3002 is occupied by a different process; refusing to terminate it" >&2
      exit 1
    fi
  fi
  nohup env CONTAINER_CLI="$cli" /usr/bin/python3 "$root/relay.py" \
    >>"$state/relay.log" 2>&1 </dev/null &
  echo "$!" >"$state/relay.pid"
  wait_for "ASO-Light localhost:3002" \
    curl --noproxy '*' --fail --silent --max-time 5 http://127.0.0.1:3002/health
  echo "ASO-Light running: http://localhost:3002"
  echo "Private config: $state (keep db.env, secrets.env, and pgdata backups)"
}
case "${1:-deploy}" in
  build) build ;;
  up) up ;;
  deploy) build; up ;;
  status)
    "$cli" list --all
    curl --noproxy '*' -sS --max-time 7 -o /dev/null -w 'localhost:3002 HTTP %{http_code}\n' \
      http://127.0.0.1:3002/health
    ;;
  *) echo "Usage: bash $0 [deploy|build|up|status]" >&2; exit 2 ;;
esac
