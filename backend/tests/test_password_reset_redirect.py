"""Tests for the password-reset HTTPS bounce endpoint.

The bounce page wraps the `moodapp://reset-password?token=...` deep link
in an HTTPS URL so that email clients (which strip / refuse custom URL
schemes) can deliver the reset button reliably.
"""
import os
import re
import requests


API_URL = os.environ.get(
    "MOOD_TEST_API_URL",
    "http://localhost:8001",
).rstrip("/")


def _get(token: str = "") -> requests.Response:
    return requests.get(
        f"{API_URL}/api/auth/reset-redirect",
        params={"token": token} if token else None,
        timeout=5,
    )


def test_reset_redirect_returns_html_with_deep_link():
    """Returns an HTML bounce page that points to the moodapp:// scheme."""
    raw_token = "abc_DEF-123_xyz"
    res = _get(raw_token)
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "")
    body = res.text
    # The deep link must appear in: meta refresh, JS redirect, and manual button.
    expected_deep = f"moodapp://reset-password?token={raw_token}"
    assert expected_deep in body, "deep link missing from response body"
    # Meta refresh present so devices without JS still bounce
    assert "http-equiv=\"refresh\"" in body
    # Manual "Open MOOD" anchor fallback
    assert "Open MOOD" in body


def test_reset_redirect_escapes_html_unsafe_tokens():
    """Even though tokens are URL-safe, defense-in-depth HTML-escape protects
    against any future change in token generation that introduces special
    characters. Confirm `<` / `>` are escaped to entities, not raw."""
    res = _get("safeOnly_token_AbC")
    assert res.status_code == 200
    body = res.text
    # Plain alphanumeric tokens pass through untouched
    assert "safeOnly_token_AbC" in body

    # Now try with a token containing HTML-sensitive characters via direct URL
    # construction so the test exercises the escape path.
    res2 = requests.get(
        f"{API_URL}/api/auth/reset-redirect?token=%3Cscript%3E",
        timeout=5,
    )
    assert res2.status_code == 200
    body2 = res2.text
    # The raw `<script>` MUST NOT appear inside the HTML (it would be a
    # reflected XSS). It should be escaped to `&lt;script&gt;`.
    assert "<script>" not in body2 or body2.count("<script>") == body2.count("<script>\n  // Try to open the deep link")  # only ours
    # Escaped form should appear inside attribute values
    assert "&lt;script&gt;" in body2


def test_reset_redirect_handles_missing_token():
    """No token → endpoint still renders (the in-app reset screen surfaces
    a friendly 'invalid link' state)."""
    res = requests.get(f"{API_URL}/api/auth/reset-redirect", timeout=5)
    assert res.status_code == 200
    body = res.text
    # Empty token still gets embedded — the app handles the empty-token
    # case in `reset-password.tsx` with a friendly "Invalid reset link" UI.
    assert "moodapp://reset-password?token=" in body


def test_reset_redirect_content_type():
    """Explicitly assert text/html so email-client previews render correctly."""
    res = _get("anything")
    assert res.headers.get("content-type", "").lower().startswith("text/html")
