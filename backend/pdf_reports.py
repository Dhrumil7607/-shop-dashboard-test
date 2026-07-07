"""PDF report builder for ShopLiveBharat waitlist batches."""

from __future__ import annotations

import io
from datetime import datetime
from typing import List, Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

MAROON = colors.HexColor("#8B3A3A")
ESPRESSO = colors.HexColor("#2C241B")
STONE = colors.HexColor("#736B5E")
CREAM = colors.HexColor("#F1ECE3")
IVORY = colors.HexColor("#FAF8F5")
GOLD = colors.HexColor("#C6A87C")


def _fmt_dt(value) -> str:
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except Exception:
            return value
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y · %H:%M UTC")
    return str(value)


def build_waitlist_pdf(entries: List[Dict], batch_label: str, total_so_far: int) -> bytes:
    """Render a luxury-styled PDF of waitlist entries.

    entries: list of dicts with full_name, email, country_code, phone, created_at
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="ShopLiveBharat — Waitlist Report",
        author="ShopLiveBharat",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title",
        parent=styles["Title"],
        fontName="Times-Roman",
        fontSize=28,
        leading=32,
        textColor=ESPRESSO,
        spaceAfter=6,
    )
    eyebrow_style = ParagraphStyle(
        "eyebrow",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=MAROON,
        spaceAfter=14,
    )
    meta_style = ParagraphStyle(
        "meta",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=STONE,
        spaceAfter=18,
    )
    section_style = ParagraphStyle(
        "section",
        parent=styles["Normal"],
        fontName="Times-Italic",
        fontSize=11,
        leading=14,
        textColor=ESPRESSO,
        spaceAfter=10,
    )
    footer_style = ParagraphStyle(
        "footer",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=STONE,
        alignment=1,  # center
    )

    story = []
    story.append(Paragraph("S H O P L I V E B H A R A T &nbsp;·&nbsp; W A I T L I S T", eyebrow_style))
    story.append(Paragraph(f"New chapter — <i>{batch_label}</i>", title_style))
    story.append(
        Paragraph(
            f"Generated {datetime.utcnow().strftime('%d %B %Y · %H:%M UTC')} &nbsp;·&nbsp; "
            f"Cumulative members: <b>{total_so_far}</b>",
            meta_style,
        )
    )

    # Table
    header = ["#", "Full name", "Email", "Phone", "Joined"]
    rows = [header]
    for i, e in enumerate(entries, start=1):
        rows.append([
            str(i),
            e.get("full_name", ""),
            e.get("email", ""),
            f"{e.get('country_code', '')} {e.get('phone', '')}".strip(),
            _fmt_dt(e.get("created_at", "")),
        ])

    col_widths = [10 * mm, 42 * mm, 60 * mm, 35 * mm, 38 * mm]
    table = Table(rows, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), ESPRESSO),
            ("TEXTCOLOR", (0, 0), (-1, 0), IVORY),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("ALIGN", (0, 0), (-1, 0), "LEFT"),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("TEXTCOLOR", (0, 1), (-1, -1), ESPRESSO),
            ("TOPPADDING", (0, 1), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 9),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [IVORY, CREAM]),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, GOLD),
            ("BOX", (0, 0), (-1, -1), 0.5, GOLD),
        ])
    )
    story.append(table)
    story.append(Spacer(1, 14 * mm))

    story.append(
        Paragraph(
            "<i>“For every Indian abroad, we are building the kind of wardrobe "
            "that arrives like a letter from home.”</i>",
            section_style,
        )
    )
    story.append(Spacer(1, 6 * mm))
    story.append(
        Paragraph(
            "ShopLiveBharat &nbsp;·&nbsp; Confidential — for founder eyes only",
            footer_style,
        )
    )

    doc.build(story)
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
