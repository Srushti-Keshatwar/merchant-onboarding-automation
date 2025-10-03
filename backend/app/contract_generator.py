from fastapi import HTTPException
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os
from datetime import datetime

def generate_contract_pdf(application_data: dict, output_dir: str = "contracts") -> str:
    """Generate a professional merchant processing agreement PDF"""
    
    import os
    
    # ✅ ADD: Debug the working directory and paths
    print(f"🔍 Current working directory: {os.getcwd()}")
    print(f"🔍 Requested output_dir: {output_dir}")
    
    # Use absolute path
    if not os.path.isabs(output_dir):
        output_dir = os.path.abspath(output_dir)
    
    print(f"📁 Creating contracts directory at: {output_dir}")
    os.makedirs(output_dir, exist_ok=True)
    
    # Verify directory was created
    if not os.path.exists(output_dir):
        raise Exception(f"Failed to create contracts directory: {output_dir}")
    
    filename = f"contract_{application_data.get('application_id', 'unknown')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    print(f"📄 Generating PDF at: {filepath}")
    
    doc = SimpleDocTemplate(filepath, pagesize=letter, topMargin=1*inch)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.darkblue,
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.darkblue,
        spaceBefore=20,
        spaceAfter=10
    )
    
    content = []
    
    # Header
    content.append(Paragraph("MERCHANT PROCESSING AGREEMENT", title_style))
    content.append(Spacer(1, 20))
    
    # Agreement details
    agreement_info = [
        ["Application ID:", application_data.get('application_id', 'N/A')],
        ["Agreement Date:", datetime.now().strftime("%B %d, %Y")],
        ["Effective Date:", datetime.now().strftime("%B %d, %Y")],
    ]
    
    info_table = Table(agreement_info, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    
    content.append(info_table)
    content.append(Spacer(1, 30))
    
    # Parties section
    content.append(Paragraph("PARTIES TO THIS AGREEMENT", heading_style))
    
    personal_data = application_data.get('personal_data', {})
    business_data = application_data.get('business_data', {})
    
    parties_data = [
        ["MERCHANT INFORMATION", ""],
        ["Business Name:", business_data.get('businessName', 'N/A')],
        ["Business Type:", business_data.get('businessType', 'N/A')],
        ["Industry:", business_data.get('industry', 'N/A')],
        ["EIN:", business_data.get('ein', 'N/A')],
        ["Annual Revenue:", f"${business_data.get('annualRevenue', 'N/A')}"],
        ["Monthly Volume:", f"${business_data.get('monthlyProcessingVolume', 'N/A')}"],
        ["", ""],
        ["OWNER/PRINCIPAL INFORMATION", ""],
        ["Name:", f"{personal_data.get('firstName', '')} {personal_data.get('lastName', '')}"],
        ["Email:", personal_data.get('email', 'N/A')],
        ["Phone:", personal_data.get('phone', 'N/A')],
        ["Address:", f"{personal_data.get('streetAddress', '')}, {personal_data.get('city', '')}, {personal_data.get('state', '')} {personal_data.get('zipCode', '')}"],
    ]
    
    parties_table = Table(parties_data, colWidths=[2*inch, 4*inch])
    parties_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('BACKGROUND', (0, 8), (-1, 8), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 8), (-1, 8), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 8), (-1, 8), 'Helvetica-Bold'),
    ]))
    
    content.append(parties_table)
    content.append(Spacer(1, 30))
    
    # Processing terms
    content.append(Paragraph("PROCESSING TERMS & CONDITIONS", heading_style))
    
    terms_data = application_data.get('merchant_terms', {})
    
    terms_info = [
        ["PROCESSING RATES & FEES", ""],
        ["Processing Rate:", terms_data.get('rate', 'N/A')],
        ["Transaction Fee:", terms_data.get('transaction_fee', 'N/A')],
        ["Daily Processing Limit:", terms_data.get('daily_limit', 'N/A')],
        ["Monthly Volume Limit:", terms_data.get('monthly_volume', 'N/A')],
        ["Settlement Period:", terms_data.get('settlement', 'N/A')],
        ["Contract Length:", terms_data.get('contract_length', 'N/A')],
        ["", ""],
        ["PROJECTED REVENUE", ""],
        ["Hand Net Profit:", terms_data.get('hand_net_profit', 'N/A')],
    ]
    
    terms_table = Table(terms_info, colWidths=[2.5*inch, 3.5*inch])
    terms_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
        ('BACKGROUND', (0, 8), (-1, 8), colors.darkgreen),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 8), (-1, 8), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 8), (-1, 8), 'Helvetica-Bold'),
    ]))
    
    content.append(terms_table)
    content.append(Spacer(1, 20))
    
    # Basic legal terms
    content.append(Paragraph("TERMS AND CONDITIONS", heading_style))
    
    legal_text = """
    1. MERCHANT OBLIGATIONS: Merchant agrees to comply with all applicable laws, regulations, and card association rules.
    
    2. SETTLEMENT: Funds will be settled to the designated bank account according to the settlement schedule above.
    
    3. CHARGEBACKS: Merchant is responsible for all chargebacks, fees, and related costs.
    
    4. TERMINATION: Either party may terminate this agreement with 30 days written notice.
    
    5. COMPLIANCE: Merchant must maintain PCI DSS compliance and follow all security protocols.
    
    6. GOVERNING LAW: This agreement is governed by the laws of the United States.
    """
    
    content.append(Paragraph(legal_text, styles['Normal']))
    content.append(Spacer(1, 30))
    
    # Signature section
    content.append(Paragraph("SIGNATURES", heading_style))
    
    signature_data = [
        ["Merchant Signature:", "Date:"],
        ["", ""],
        ["_" * 30, "_" * 20],
        [f"{personal_data.get('firstName', '')} {personal_data.get('lastName', '')}", ""],
        ["Print Name", ""],
        ["", ""],
        ["MerchantFlow AI Representative:", "Date:"],
        ["", ""],
        ["_" * 30, "_" * 20],
        ["Authorized Representative", datetime.now().strftime("%m/%d/%Y")],
    ]
    
    sig_table = Table(signature_data, colWidths=[3*inch, 2*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    content.append(sig_table)
    
    doc.build(content)
    
    if os.path.exists(filepath):
        file_size = os.path.getsize(filepath)
        print(f"✅ PDF created successfully: {filepath} (size: {file_size} bytes)")
        
        # Check permissions
        permissions = oct(os.stat(filepath).st_mode)[-3:]
        print(f"📋 File permissions: {permissions}")
    else:
        print(f"❌ PDF was not created at: {filepath}")
        raise Exception(f"PDF generation failed - file not created: {filepath}")
    
    return filename

