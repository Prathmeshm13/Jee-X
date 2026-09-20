"""From backend: python scripts/publish_rated_contest.py contest.json.
Environment: JEEX_API_URL, JEEX_ADMIN_TOKEN (an Auth0 access token).
"""
import json
import os
import sys
import requests

if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/publish_rated_contest.py contest.json')
url = os.environ.get('JEEX_API_URL', 'http://localhost:8000').rstrip('/')
token = os.environ.get('JEEX_ADMIN_TOKEN')
if not token:
    raise SystemExit('Set JEEX_ADMIN_TOKEN to an administrator Auth0 access token.')
with open(sys.argv[1], encoding='utf-8') as f:
    payload = json.load(f)
response = requests.post(url + '/api/ranking/contests', json=payload,
                         headers={'Authorization': 'Bearer ' + token}, timeout=30)
if not response.ok:
    raise SystemExit(f'Publishing failed ({response.status_code}): {response.text}')
print('Contest published:', response.json()['id'])
