#!/usr/bin/env python3
"""Uploads the course quotes to Supabase (table: public.course_quotes).

Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
Replaces every existing row, so it's safe to re-run after editing the
generator. Run the create-table SQL in the Supabase SQL Editor first.
"""
import json
import pathlib
import ssl
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from gen_course_quotes import build_rows  # noqa: E402

# python.org's Python on macOS often can't find root certificates. macOS ships
# the system ones at /etc/ssl/cert.pem, so use those when they exist.
SSL_CONTEXT = None
if pathlib.Path("/etc/ssl/cert.pem").exists():
    SSL_CONTEXT = ssl.create_default_context(cafile="/etc/ssl/cert.pem")


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def call(method, url, key, body=None, prefer=None):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
            return resp.read()
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Supabase returned {err.code}: {detail}")


def main():
    env = load_env()
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    endpoint = f"{base}/rest/v1/course_quotes"

    rows = build_rows()
    print(f"Clearing old quotes...")
    call("DELETE", f"{endpoint}?id=gt.0", key, prefer="return=minimal")

    batch = 500
    for start in range(0, len(rows), batch):
        call("POST", endpoint, key, rows[start:start + batch], prefer="return=minimal")
        print(f"  uploaded {min(start + batch, len(rows))} / {len(rows)}")

    print(f"Done. {len(rows)} quotes are in Supabase.")


if __name__ == "__main__":
    main()
