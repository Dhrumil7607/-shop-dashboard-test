"""Email service for ShopLiveBharat.

Wraps the Resend API in an async-friendly module. If RESEND_API_KEY is missing
the service silently falls back to MOCK mode (logs only) so local/dev still
works.

Two emails are templated here:
- send_welcome_email(name, email) — sent on waitlist signup
- send_launch_email(name, email)  — sent when countdown ends / admin trigger
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

import resend

logger = logging.getLogger("shoplivebharat.email")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev").strip()
SENDER_NAME = os.environ.get("SENDER_NAME", "ShopLiveBharat").strip()
REPLY_TO_EMAIL = os.environ.get("REPLY_TO_EMAIL", "").strip()
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "").strip()

MOCK_MODE = not RESEND_API_KEY
if not MOCK_MODE:
    resend.api_key = RESEND_API_KEY
    logger.info("Resend configured | from=%s <%s> | reply_to=%s",
                SENDER_NAME, SENDER_EMAIL, REPLY_TO_EMAIL or "<none>")
else:
    logger.warning("RESEND_API_KEY not set — email service running in MOCK mode")


# -------- Templates (inline-styled, table-based, email-client safe) --------

_BASE_STYLES = {
    "ivory": "#FAF8F5",
    "cream": "#F1ECE3",
    "maroon": "#8B3A3A",
    "espresso": "#2C241B",
    "stone": "#736B5E",
    "champagne": "#C6A87C",
}


def _wrap(content_html: str, preheader: str) -> str:
    s = _BASE_STYLES
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ShopLiveBharat</title></head>
<body style="margin:0;padding:0;background:{s['cream']};font-family:'Helvetica Neue',Arial,sans-serif;color:{s['espresso']};">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">{preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{s['cream']};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:{s['ivory']};border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(44,36,27,0.08);">
      <tr><td style="padding:40px 48px 8px 48px;border-bottom:1px solid #E8E4DF;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:-0.5px;color:{s['espresso']};">
          ShopLive<em style="color:{s['maroon']};font-style:italic;">Bharat</em>
        </div>
        <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:{s['maroon']};margin-top:10px;">For Indians, anywhere in the world</div>
      </td></tr>
      <tr><td style="padding:40px 48px 32px 48px;">
        {content_html}
      </td></tr>
      <tr><td style="padding:24px 48px 36px 48px;border-top:1px solid #E8E4DF;background:{s['espresso']};color:{s['ivory']};">
        <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:{s['champagne']};margin-bottom:12px;">A private list</div>
        <div style="font-size:13px;line-height:1.7;color:rgba(250,248,245,0.78);">
          You are receiving this because you joined the ShopLiveBharat waitlist.<br/>
          Made with reverence for India's ateliers · Mumbai · New York · London
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


def welcome_template(name: str) -> tuple[str, str, str]:
    first = (name or "").strip().split(" ")[0] or "Friend"
    s = _BASE_STYLES
    body = f"""
      <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:{s['maroon']};margin-bottom:18px;">The Waitlist · Confirmed</div>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:38px;line-height:1.12;letter-spacing:-1px;color:{s['espresso']};margin:0 0 18px 0;">
        Welcome, <em style="color:{s['maroon']};">{first}</em>.<br/>You're officially on the list ✨
      </h1>
      <p style="font-size:15px;line-height:1.7;color:{s['stone']};margin:0 0 18px 0;">
        Thank you for stepping inside. Over the coming weeks we'll quietly send you
        the stories behind our collections — bridal trousseaus, Navratri silhouettes,
        festive everyday — and the ateliers stitching them in India.
      </p>
      <p style="font-size:15px;line-height:1.7;color:{s['stone']};margin:0 0 28px 0;">
        Early members receive launch-day priority, a personal stylist
        introduction, and a founders' price on our first ten orders.
      </p>
      <div style="border-top:1px solid #E8E4DF;margin:8px 0 28px 0;"></div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:{s['espresso']};line-height:1.5;">
        "For every Indian abroad, we are building the kind of wardrobe that arrives
        like a letter from home."
      </div>
      <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:{s['stone']};margin-top:10px;">— The founders</div>
    """
    subject = "You're officially on the ShopLiveBharat waitlist ✨"
    preheader = "Welcome to a private, luxury launch — exclusive styles arriving soon."
    return subject, _wrap(body, preheader), preheader


def launch_template(name: str) -> tuple[str, str, str]:
    first = (name or "").strip().split(" ")[0] or "Friend"
    s = _BASE_STYLES
    body = f"""
      <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:{s['maroon']};margin-bottom:18px;">The Doors Are Open</div>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:40px;line-height:1.1;letter-spacing:-1px;color:{s['espresso']};margin:0 0 18px 0;">
        ShopLiveBharat is <em style="color:{s['maroon']};">now live</em> ✨
      </h1>
      <p style="font-size:15px;line-height:1.7;color:{s['stone']};margin:0 0 20px 0;">
        The wait is finally over, {first}. Experience India's premium live ethnic
        shopping platform from anywhere in the world. Explore authentic
        collections, book live consultations, and shop directly from India's
        finest stores.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 32px 0;">
        <tr><td style="background:{s['maroon']};border-radius:999px;">
          <a href="https://shoplivebharat.com" target="_blank"
             style="display:inline-block;padding:16px 30px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:{s['ivory']};text-decoration:none;">
            Enter the atelier &nbsp;→
          </a>
        </td></tr>
      </table>
      <div style="border-top:1px solid #E8E4DF;margin:8px 0 22px 0;"></div>
      <p style="font-size:13px;line-height:1.7;color:{s['stone']};margin:0;">
        As a founding member you have priority access to our first six capsules:
        Navratri, Mehendi, Wedding Guest, Couple Matching, Bride's Sister, and
        Festive Wear — with free worldwide shipping at launch.
      </p>
    """
    subject = "ShopLiveBharat Is Now Live ✨"
    preheader = "The wait is over. Step inside India's first luxury live shopping atelier."
    return subject, _wrap(body, preheader), preheader


# -------- Send helpers --------

async def _send(to_email: str, subject: str, html: str) -> Optional[str]:
    from_field = (
        f"{SENDER_NAME} <{SENDER_EMAIL}>" if SENDER_NAME else SENDER_EMAIL
    )
    params = {
        "from": from_field,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }
    if REPLY_TO_EMAIL:
        params["reply_to"] = [REPLY_TO_EMAIL]

    if MOCK_MODE:
        logger.info("[MOCK_RESEND] to=%s | subject=%s | html_len=%d",
                    to_email, subject, len(html))
        return "mock-" + to_email

    try:
        resp = await asyncio.to_thread(resend.Emails.send, params)
        email_id = resp.get("id") if isinstance(resp, dict) else getattr(resp, "id", None)
        logger.info("[RESEND] sent | id=%s | to=%s | subject=%s", email_id, to_email, subject)
        return email_id
    except Exception as e:
        logger.error("[RESEND] FAILED | to=%s | err=%s", to_email, e)
        return None


async def send_welcome_email(name: str, email: str) -> Optional[str]:
    subject, html, _ = welcome_template(name)
    return await _send(email, subject, html)


async def send_launch_email(name: str, email: str) -> Optional[str]:
    subject, html, _ = launch_template(name)
    return await _send(email, subject, html)


# -------- Admin batch notification (with PDF attachment) --------

def _admin_batch_html(batch_count: int, total: int, entries: list) -> str:
    s = _BASE_STYLES
    rows_html = ""
    for i, e in enumerate(entries, start=1):
        rows_html += (
            f"<tr>"
            f"<td style='padding:8px 10px;border-bottom:1px solid #E8E4DF;font-size:12px;color:{s['stone']};width:24px;'>{i}</td>"
            f"<td style='padding:8px 10px;border-bottom:1px solid #E8E4DF;font-size:13px;color:{s['espresso']};'>{e.get('full_name','')}</td>"
            f"<td style='padding:8px 10px;border-bottom:1px solid #E8E4DF;font-size:12px;color:{s['stone']};'>{e.get('email','')}</td>"
            f"<td style='padding:8px 10px;border-bottom:1px solid #E8E4DF;font-size:12px;color:{s['stone']};'>{e.get('country_code','')} {e.get('phone','')}</td>"
            f"</tr>"
        )

    body = f"""
      <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:{s['maroon']};margin-bottom:14px;">
        Founder Brief · Batch of {batch_count}
      </div>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.15;letter-spacing:-0.5px;color:{s['espresso']};margin:0 0 12px 0;">
        {batch_count} new members <em style="color:{s['maroon']};">just joined.</em>
      </h1>
      <p style="font-size:14px;line-height:1.7;color:{s['stone']};margin:0 0 18px 0;">
        Total waitlist now stands at <b style="color:{s['espresso']};">{total}</b>.
        The full batch is attached as a PDF — a snapshot of who is awaiting your launch.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 20px 0;border:1px solid #E8E4DF;border-radius:12px;overflow:hidden;">
        <tr style="background:{s['espresso']};color:{s['ivory']};">
          <td style="padding:10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;width:24px;">#</td>
          <td style="padding:10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Name</td>
          <td style="padding:10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Email</td>
          <td style="padding:10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Phone</td>
        </tr>
        {rows_html}
      </table>
      <p style="font-size:12px;line-height:1.7;color:{s['stone']};margin:0;">
        See the attached PDF for the formatted founder brief. This message is sent
        every {batch_count} signups — adjust the cadence via <code>ADMIN_BATCH_SIZE</code>
        in your backend environment.
      </p>
    """
    return _wrap(body, f"{batch_count} new members just joined ShopLiveBharat.")


async def send_admin_batch_notification(
    entries: list, total: int, pdf_bytes: bytes, override_to: Optional[str] = None
) -> Optional[str]:
    to_email = (override_to or ADMIN_NOTIFICATION_EMAIL).strip()
    if not to_email:
        logger.info("[ADMIN] no ADMIN_NOTIFICATION_EMAIL set — skipping batch notification")
        return None

    batch_count = len(entries)
    subject = f"+{batch_count} new waitlist members · {total} total ✨"
    html = _admin_batch_html(batch_count, total, entries)
    filename = (
        f"shoplivebharat-waitlist-batch-"
        f"{__import__('datetime').datetime.utcnow().strftime('%Y%m%d-%H%M')}.pdf"
    )

    from_field = f"{SENDER_NAME} <{SENDER_EMAIL}>" if SENDER_NAME else SENDER_EMAIL
    params = {
        "from": from_field,
        "to": [to_email],
        "subject": subject,
        "html": html,
        "attachments": [
            {
                "filename": filename,
                "content": list(pdf_bytes),  # Resend expects an array of bytes
            }
        ],
    }
    if REPLY_TO_EMAIL:
        params["reply_to"] = [REPLY_TO_EMAIL]

    if MOCK_MODE:
        logger.info(
            "[MOCK_RESEND][ADMIN] batch=%d total=%d to=%s pdf_bytes=%d",
            batch_count, total, to_email, len(pdf_bytes),
        )
        return "mock-admin"

    try:
        resp = await asyncio.to_thread(resend.Emails.send, params)
        email_id = resp.get("id") if isinstance(resp, dict) else getattr(resp, "id", None)
        logger.info(
            "[RESEND][ADMIN] sent id=%s | batch=%d total=%d to=%s",
            email_id, batch_count, total, to_email,
        )
        return email_id
    except Exception as e:
        logger.error(
            "[RESEND][ADMIN] FAILED to=%s | err=%s",
            to_email, e,
        )
        return None
