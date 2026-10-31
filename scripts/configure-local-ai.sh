#!/usr/bin/env bash
set -euo pipefail
umask 077

# Configure the local OpenAI-compatible gateway, preserving existing deployment secrets.
# Enter the API key via terminal stdin; never pass it in command arguments.
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
deploy="${1:-/Users/vonzen/Documents/Codex/2026-10-30/https-github-com-apple-container-https/outputs/asobeast}"
env_file="$deploy/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Missing deployment .env: $env_file" >&2
  exit 1
fi
if [[ ! -t 0 ]]; then
  echo "Run in an interactive terminal to enter the AI provider key." >&2
  exit 1
fi

printf "AI provider key (hidden, press Enter when pasted): " >&2
IFS= read -r -s api_key
printf "\n" >&2
if [[ -z "$api_key" ]]; then
  echo "No key entered. Configuration was not modified." >&2
  exit 1
fi

printf '%s\n' "$api_key" | python3 -c '
import os
import sys
import tempfile
from pathlib import Path

p = Path(sys.argv[1])
key = sys.stdin.readline().rstrip("\n")
assert key, "Missing API key"
updates = {
    "OPENAI_API_KEY": key,
    "OPENAI_BASE_URL": "http://192.168.65.1:20128/v1",
    "AI_MODEL": "cbcn/claude-sonnet-5.5",
}
old = p.read_text().splitlines()
out = []
seen = set()
for line in old:
    name = line.split("=", 1)[0] if "=" in line else None
    if name in updates:
        if name not in seen:
            out.append(name + "=" + updates[name])
            seen.add(name)
    else:
        out.append(line)
for name, value in updates.items():
    if name not in seen:
        out.append(name + "=" + value)

fd, tmp = tempfile.mkstemp(prefix=".ai-env-", dir=p.parent)
os.fchmod(fd, 0o600)
with os.fdopen(fd, "w") as f:
    f.write("\n".join(out) + "\n")
os.replace(tmp, p)
os.chmod(p, 0o600)
print("AI provider configuration stored privately (key not displayed).")
' "$env_file"
unset api_key

bash "$project_root/scripts/local-apple-container-up.sh" "$deploy"

/usr/local/bin/container exec asobeast-api node -e '
const base = process.env.OPENAI_BASE_URL;
const key = process.env.OPENAI_API_KEY;
const model = process.env.AI_MODEL;
if (!base || !key || !model) process.exit(2);
(async () => {
  const auth = { Authorization: "Bearer " + key };
  const models = await fetch(base + "/models", {
    headers: auth,
    signal: AbortSignal.timeout(10000)
  });
  if (!models.ok) throw new Error("Provider /models status " + models.status);
  const catalog = await models.json();
  if (!(catalog.data || []).some(m => m.id === model)) {
    throw new Error("Configured model is not listed by the provider");
  }
  console.log("AI gateway reachable and model listed:", model);

  const request = {
    model,
    messages: [
      { role: "system", content: "Return only a JSON object matching the schema. Do not add Markdown code fences." },
      { role: "user", content: [{ type: "text", text: "Set ok to true." }] }
    ],
    max_completion_tokens: 80,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "probe", strict: true,
        schema: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
          additionalProperties: false
        }
      }
    }
  };
  const completion = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60000)
  });
  if (!completion.ok) throw new Error("Structured completion HTTP " + completion.status);
  const data = await completion.json();
  const content = data.choices?.[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(content);
    if (parsed.ok !== true) throw new Error("wrong value");
    console.log("Structured JSON response: compatible");
  } catch {
    console.warn("WARNING: The provider did not return strict raw JSON. AsoBeast may reject AI results.");
  }
})().catch(e => { console.error("AI provider validation failed:", e.message); process.exit(1); });
'
