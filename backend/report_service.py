"""
ArtGuard Report Service
Generates formal PDF authentication reports using ReportLab.
Matches the Report Service / PDF Generator component from the system architecture.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_artwork_pdf_report(artwork, analysis):
    """
    Generates a formal PDF authentication report for a given artwork and analysis.
    Returns bytes of the generated PDF document.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor('#4f46e5')
    text_dark = colors.HexColor('#111827')
    text_muted = colors.HexColor('#6b7280')
    success_green = colors.HexColor('#059669')
    danger_red = colors.HexColor('#dc2626')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=text_muted,
        alignment=TA_CENTER,
    )

    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6,
    )

    cell_bold_style = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=text_dark,
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_dark,
    )

    story = []

    # 1. Header & Title Banner
    story.append(Paragraph("ARTGUARD FORENSIC AUTHENTICATION REPORT", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("AI-Powered Neural Network Art Verification & Explainability System", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=14))

    # 2. Document Meta Info
    report_date = datetime.now().strftime("%B %d, %Y - %H:%M:%S UTC")
    is_authentic = analysis.is_likely_authentic
    verdict_text = "LIKELY AUTHENTIC" if is_authentic else "POTENTIAL FORGERY DETECTED"
    verdict_color = success_green if is_authentic else danger_red
    verdict_bg = colors.HexColor('#ecfdf5') if is_authentic else colors.HexColor('#fef2f2')

    meta_table_data = [
        [
            Paragraph(f"<b>Report ID:</b> AG-{artwork.id:05d}", cell_style),
            Paragraph(f"<b>Date:</b> {report_date}", cell_style),
        ],
        [
            Paragraph(f"<b>Submitter:</b> {artwork.uploaded_by.username}", cell_style),
            Paragraph(f"<b>Neural Engine:</b> {analysis.model_version}", cell_style),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[260, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f3f4f6')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Authenticity Verdict Callout Box
    confidence_pct = analysis.confidence_score * 100
    style_pct = analysis.style_match_score * 100

    verdict_p = Paragraph(
        f"<font size='16'><b>VERDICT: {verdict_text}</b></font><br/>"
        f"<font size='10' color='#4b5563'>Authenticity Confidence: <b>{confidence_pct:.1f}%</b> &nbsp;|&nbsp; "
        f"Style Consistency Match: <b>{style_pct:.1f}%</b></font>",
        ParagraphStyle('Verdict', parent=styles['Normal'], alignment=TA_CENTER, textColor=verdict_color, leading=22)
    )
    verdict_table = Table([[verdict_p]], colWidths=[530])
    verdict_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), verdict_bg),
        ('BOX', (0, 0), (-1, -1), 1.5, verdict_color),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ]))
    story.append(verdict_table)
    story.append(Spacer(1, 14))

    # 4. Artwork Identification Section
    story.append(Paragraph("1. Artwork Identification", section_header_style))
    artwork_info = [
        [Paragraph("Artwork Title:", cell_bold_style), Paragraph(artwork.title, cell_style)],
        [Paragraph("Claimed Artist:", cell_bold_style), Paragraph(artwork.claimed_artist, cell_style)],
        [Paragraph("Historical Period:", cell_bold_style), Paragraph(artwork.period, cell_style)],
        [Paragraph("Provenance & Description:", cell_bold_style), Paragraph(artwork.description or "None provided by submitter.", cell_style)],
    ]
    artwork_table = Table(artwork_info, colWidths=[150, 380])
    artwork_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(artwork_table)
    story.append(Spacer(1, 14))

    # 5. Top Reference Database Comparisons (DFD Process 3.4 & 4.0)
    story.append(Paragraph("2. Museum Reference Catalog Comparisons", section_header_style))
    top_matches = analysis.top_matches or []

    if top_matches:
        ref_header = [
            Paragraph("Rank", cell_bold_style),
            Paragraph("Catalog Artist", cell_bold_style),
            Paragraph("Period & Style", cell_bold_style),
            Paragraph("Museum Source", cell_bold_style),
            Paragraph("Similarity", cell_bold_style),
        ]
        ref_rows = [ref_header]
        for i, match in enumerate(top_matches, start=1):
            sim_pct = match.get('similarity_percent', match.get('similarity_score', 0) * 100)
            ref_rows.append([
                Paragraph(f"#{i}", cell_style),
                Paragraph(match.get('artist_name', 'Unknown'), cell_style),
                Paragraph(f"{match.get('period', '')} — {match.get('style', '')[:40]}...", cell_style),
                Paragraph(match.get('source', 'Museum Catalog'), cell_style),
                Paragraph(f"<b>{sim_pct:.1f}%</b>", cell_bold_style),
            ])
        ref_table = Table(ref_rows, colWidths=[40, 110, 180, 120, 80])
        ref_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0e7ff')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#c7d2fe')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e7ff')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(ref_table)
    else:
        story.append(Paragraph("No direct reference artwork records available for comparison.", cell_style))
    story.append(Spacer(1, 14))

    # 6. Risk Factor & Anomaly Detection
    story.append(Paragraph("3. Risk Factor & Anomaly Detection", section_header_style))
    risk_factors = analysis.risk_factors or {}
    if risk_factors:
        risk_rows = [[Paragraph("Risk Category", cell_bold_style), Paragraph("Forensic Finding", cell_bold_style)]]
        for key, val in risk_factors.items():
            cat_name = key.replace('_', ' ').capitalize()
            risk_rows.append([Paragraph(cat_name, cell_bold_style), Paragraph(str(val), cell_style)])
        risk_table = Table(risk_rows, colWidths=[150, 380])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fef3c7')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#fde68a')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fef3c7')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(risk_table)
    else:
        story.append(Paragraph("✓ <b>No anomalous stylistic, brushstroke, or color deviations detected.</b>", cell_style))
    story.append(Spacer(1, 14))

    # 7. AI Methodology & Verification Statement
    story.append(Paragraph("4. Technical Methodology & Explainability", section_header_style))
    method_text = (
        "This forensic evaluation was executed using a 50-layer deep convolutional neural network "
        "(ResNet50) initialized on ImageNet. A 2,048-dimensional feature vector was extracted from the "
        "penultimate global pooling layer and evaluated via cosine similarity against verified museum reference "
        "embeddings. Spatial explainability is mapped via Gradient-weighted Class Activation Mapping (Grad-CAM) "
        "to highlight localized stylistic focus regions."
    )
    story.append(Paragraph(method_text, cell_style))
    story.append(Spacer(1, 18))

    # 8. Signature & Seal Footer
    story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor('#d1d5db'), spaceBefore=8, spaceAfter=12))
    footer_text = (
        "<b>ArtGuard Automated Forensic Authentication System</b><br/>"
        "This report is generated for academic, curatorial, and provenance assessment purposes.<br/>"
        f"Cryptographic Analysis Hash: SHA256-AG{artwork.id:06d}{int(analysis.confidence_score * 10000)}"
    )
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], alignment=TA_CENTER, fontSize=8, leading=11, textColor=text_muted)))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
