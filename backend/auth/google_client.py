"""Google OAuth2 flow helpers using google-auth-oauthlib."""

import base64
import hashlib
import secrets

from google_auth_oauthlib.flow import Flow

from config import settings

_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.readonly",
]

_CLIENT_CONFIG = {
    "web": {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
    }
}


def build_flow(state: str | None = None) -> Flow:
    flow = Flow.from_client_config(
        _CLIENT_CONFIG,
        scopes=_SCOPES,
        state=state,
    )
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    return flow


def authorization_url(flow: Flow) -> tuple[str, str, str]:
    """Return (url, state, code_verifier). Manually generate PKCE since lib doesn't for web client."""
    code_verifier = secrets.token_urlsafe(32)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip("=")
    url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        code_challenge=code_challenge,
        code_challenge_method="S256",
    )
    return url, state, code_verifier


def exchange_code(flow: Flow, code: str, code_verifier: str | None = None):
    """Fetch token and return credentials object."""
    kwargs = {"code_verifier": code_verifier} if code_verifier else {}
    flow.fetch_token(code=code, **kwargs)
    return flow.credentials
