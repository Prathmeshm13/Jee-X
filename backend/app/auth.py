import os
from functools import lru_cache

import requests
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt

load_dotenv()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]

bearer_scheme = HTTPBearer()


class AuthError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


@lru_cache
def get_jwks() -> dict:
    resp = requests.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json", timeout=5)
    resp.raise_for_status()
    return resp.json()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    token = credentials.credentials
    if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
        raise AuthError("Server is missing AUTH0_DOMAIN / AUTH0_AUDIENCE configuration.")
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception:
        raise AuthError("Malformed token header.")

    jwks = get_jwks()
    rsa_key = {}
    for key in jwks.get("keys", []):
        if key.get("kid") == unverified_header.get("kid"):
            rsa_key = {"kty": key["kty"], "kid": key["kid"], "use": key["use"], "n": key["n"], "e": key["e"]}
            break
    if not rsa_key:
        raise AuthError("Unable to find an appropriate signing key.")
    try:
        payload = jwt.decode(token, rsa_key, algorithms=ALGORITHMS, audience=AUTH0_AUDIENCE, issuer=f"https://{AUTH0_DOMAIN}/")
    except jwt.ExpiredSignatureError:
        raise AuthError("Token has expired.")
    except jwt.JWTClaimsError:
        raise AuthError("Incorrect claims — check the audience and issuer.")
    except Exception:
        raise AuthError("Unable to parse or verify token.")
    return payload
