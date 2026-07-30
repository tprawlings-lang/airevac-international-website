"""Generates the two AirEvac handback PDFs.

  1. AirEvac_Signups_and_Accounts.pdf   what to sign up for and configure
  2. AirEvac_Facts_and_Approvals.pdf    what only AirEvac can supply

Revision 2.0, 2026-07-30. Supersedes the 1.0 pair: AirEvac approved the AI
visibility decisions, Render is now on a paid production instance, and the
remaining asks have narrowed to facts, account access, and one certificate.

Usage: python3 scripts/generate-handoff-pdfs.py [output_dir]
"""

import sys

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else 'docs'

NAVY = colors.HexColor('#13315C')
NAVY_DARK = colors.HexColor('#0B2239')
INK = colors.HexColor('#26313B')
LIGHT = colors.HexColor('#EEF3F8')
RULE = colors.HexColor('#C8D4E0')
URGENT = colors.HexColor('#B3261E')
GOOD = colors.HexColor('#1B6B45')

styles = getSampleStyleSheet()


def st(name, **kw):
    base = kw.pop('base', 'Normal')
    styles.add(ParagraphStyle(name, parent=styles[base], **kw))


st('Brand', fontName='Helvetica-Bold', fontSize=9, textColor=NAVY, spaceAfter=2)
st('DocTitle', fontName='Helvetica-Bold', fontSize=23, leading=27,
   textColor=NAVY_DARK, spaceBefore=10, spaceAfter=4)
st('DocSub', fontName='Helvetica', fontSize=10.5, leading=14.5, textColor=INK,
   spaceAfter=16)
st('H1', fontName='Helvetica-Bold', fontSize=14.5, leading=18, textColor=NAVY,
   spaceBefore=16, spaceAfter=6)
st('H2', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=NAVY_DARK,
   spaceBefore=11, spaceAfter=3)
st('Body', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=INK,
   spaceAfter=6)
st('Cell', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=INK)
st('CellHead', fontName='Helvetica-Bold', fontSize=8.5, leading=11,
   textColor=colors.white)
st('AeiBullet', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=INK,
   leftIndent=14, bulletIndent=4, spaceAfter=3)
st('Note', fontName='Helvetica-Oblique', fontSize=9, leading=12.5,
   textColor=colors.HexColor('#4A5560'), spaceBefore=2, spaceAfter=8)
st('Flag', fontName='Helvetica-Bold', fontSize=9.5, leading=13.5,
   textColor=URGENT, spaceAfter=6)
st('Done', fontName='Helvetica-Bold', fontSize=9.5, leading=13.5,
   textColor=GOOD, spaceAfter=6)


def build(filename, doc_label, story):
    def on_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.setFont('Helvetica-Bold', 9)
        canvas.drawString(0.85 * inch, letter[1] - 0.55 * inch, 'AIREVAC INTERNATIONAL')
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.8)
        canvas.line(0.85 * inch, letter[1] - 0.65 * inch,
                    letter[0] - 0.85 * inch, letter[1] - 0.65 * inch)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#5A6570'))
        canvas.drawString(0.85 * inch, 0.5 * inch, doc_label)
        canvas.drawRightString(letter[0] - 0.85 * inch, 0.5 * inch, f'Page {doc.page}')
        canvas.restoreState()

    doc = BaseDocTemplate(
        f'{OUT_DIR}/{filename}', pagesize=letter,
        leftMargin=0.85 * inch, rightMargin=0.85 * inch,
        topMargin=0.95 * inch, bottomMargin=0.8 * inch,
        title=doc_label, author='AirEvac International website build team',
    )
    doc.addPageTemplates([PageTemplate(
        id='page',
        frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='main')],
        onPage=on_page)])
    doc.build(story)


def table(headers, rows, widths):
    data = [[Paragraph(h, styles['CellHead']) for h in headers]]
    for row in rows:
        data.append([Paragraph(c, styles['Cell']) for c in row])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT]),
        ('GRID', (0, 0), (-1, -1), 0.5, RULE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    return t


def bullets(items):
    return [Paragraph(i, styles['AeiBullet'], bulletText='•') for i in items]


def P(text, style='Body'):
    return Paragraph(text, styles[style])


def SP(h=6):
    return Spacer(1, h)


# ===========================================================================
# PDF 1 - Sign-ups and accounts
# ===========================================================================

s1 = [
    P('WEBSITE LAUNCH PROGRAM | REVISION 2.0', 'Brand'),
    P('Sign-Ups and Accounts Required', 'DocTitle'),
    P('Every account AirEvac needs to create, claim, or grant access to before '
      'the website can launch. None of this requires technical knowledge, and '
      'none of it can be done by the build team: each action needs AirEvac to '
      'own the account. Prepared 30 July 2026.', 'DocSub'),

    P('Status since revision 1.0', 'H1'),
    P('Render hosting is DONE. The paid production instance is live, so the site '
      'no longer sleeps between visits. A sleeping site answers search crawlers '
      'and 2 a.m. callers late or not at all, so this mattered more than its '
      'cost suggested.', 'Done'),
    P('The remaining items are ordered by dependency. Sections 1 and 2 unlock '
      'everything else, because every later step needs the real web address to '
      'exist first.'),

    P('1. Domain and DNS (everything else waits on this)', 'H1'),
    P('The site currently answers at a temporary Render address. Search engines '
      'and AI systems should only ever learn one permanent address, so this '
      'should happen before the site is submitted anywhere. Attaching the domain '
      'also permanently resolves the certificate warning a reviewer saw earlier: '
      'that error is what a browser shows when a domain is visited before it is '
      'attached to its host.'),
]
s1 += bullets([
    '<b>Decide the address form:</b> www.airevacinternational.com, or '
    'airevacinternational.com without the www. Either is fine. It has to be one '
    'of them, everywhere, permanently. If you have no preference, tell us and we '
    'will use the shorter one.',
    'Sign in to the domain registrar account for airevacinternational.com. If '
    'nobody knows who holds it, that is the first thing to find out, and it is '
    'often the longest item on this page.',
    'In Render, open the web service, then Settings, then Custom Domains, and '
    'add the chosen address. Render displays the exact DNS records to create.',
    'Create those records at the registrar exactly as Render displays them.',
    'Wait for Render to report the domain verified with a certificate issued. '
    'Usually minutes, occasionally an hour.',
    '<b>Do not change the DNS for the current WordPress site until you are ready '
    'to switch over.</b> Changing DNS is the switch-over.',
])
s1 += [
    P('Send us: the address form you chose, and the date you want to go live.', 'Note'),

    P('2. Google Search Console', 'H1'),
    P('Free, changes nothing on the website, and is the only way to see what '
      'Google has actually indexed and what it is failing to reach.'),
]
s1 += bullets([
    'Go to search.google.com/search-console, signed in with an AirEvac Google '
    'account that the company controls. Not a personal account, and not an '
    'employee account that leaves when they do.',
    'Add a property, choose the <b>Domain</b> type, and enter '
    'airevacinternational.com.',
    'Google shows a TXT record. Add it at the registrar, return, and click Verify.',
    'Open Sitemaps in the left menu and submit: sitemap.xml',
    'Open Settings, then Users and permissions, and add the build team with Full '
    'access.',
    'If a property already exists for the old WordPress site, <b>do not delete '
    'it.</b> Its history is useful. Grant access to that one as well.',
])
s1 += [
    P('3. Bing Webmaster Tools', 'H1'),
    P('Bing matters more than its search share suggests: it supplies Microsoft '
      'Copilot and feeds results that several AI assistants read.'),
]
s1 += bullets([
    'Go to bing.com/webmasters, signed in with an AirEvac Microsoft account.',
    'Choose <b>Import from Google Search Console</b>. It copies the verification '
    'and the sitemap in one step.',
    'Confirm sitemap.xml appears under Sitemaps, and add the build team as a user.',
])
s1 += [
    P('Nothing needs creating here for IndexNow, the protocol that tells Bing '
      'immediately when a page changes. It is already built into the site and '
      'switches on with the key in section 6.', 'Note'),

    P('4. Google Business Profile', 'H1'),
    P('<b>One profile, for the Fort Lauderdale base only.</b> Do not create '
      'listings for cities AirEvac flies to. A Cancun listing for a Fort '
      'Lauderdale company reads as fabricated to Google and to AI systems, and it '
      'damages exactly the credibility this whole effort is trying to build.'),
]
s1 += bullets([
    'Go to business.google.com with the same AirEvac Google account as section 2.',
    'Create or claim the profile for: AirEvac International, 2525 NW 55th Court, '
    'Hangar 24, Fort Lauderdale, FL 33309.',
    'If a profile already exists from the old site, <b>claim and correct it</b> '
    'rather than creating a second one. Duplicates split your credibility.',
    'Category: the closest available to air ambulance service. If that is not '
    'offered, use a medical transport or emergency service category. Do not pick '
    'an aviation charter category, which describes a different business.',
    'Phone: (619) 754-6755. Website: the address from section 1. Hours: open 24 '
    'hours, seven days.',
    'Because clients do not visit in person, review the service-area settings '
    'with the build team before publishing.',
    'Add only photography AirEvac has permission to publish.',
    'Complete verification (postcard, phone, or video), then add the build team '
    'as a manager.',
])
s1 += [
    P('5. Bing Places', 'H1'),
]
s1 += bullets([
    'Go to bingplaces.com and choose Import from Google Business Profile.',
    'Confirm the imported name, address, phone, and hours match section 4 exactly.',
])
s1 += [
    P('6. Analytics and IndexNow keys', 'H1'),
    P('Both are built into the site already and are waiting only for an '
      'identifier. Until each arrives, that feature stays completely switched '
      'off. Nothing is half-enabled.'),
    table(
        ['What', 'How to get it', 'What to send us'],
        [
            ['<b>Google Analytics 4</b><br/>Approved, built, inactive',
             'At analytics.google.com create an account named AirEvac '
             'International and a web property for the final domain. Do not '
             'install any code: the site already contains it, configured to '
             'anonymize addresses and to block advertising use of the data.',
             'The Measurement ID, which looks like G-XXXXXXXXXX. Also add the '
             'build team with edit access.'],
            ['<b>Google Tag Manager</b><br/>Optional',
             'At tagmanager.google.com create a container for the same domain. '
             'Only needed if marketing wants to add tracking later without a '
             'developer.',
             'The Container ID, which looks like GTM-XXXXXXX.'],
            ['<b>IndexNow key</b><br/>Built, inactive',
             'Nothing to sign up for. The build team generates it. It tells Bing '
             'within minutes when a page changes.',
             'Nothing. Listed so you know it exists.'],
        ],
        [1.5 * inch, 3.0 * inch, 2.3 * inch]),
    P('We recommend <b>declining</b> session-recording tools such as Microsoft '
      'Clarity, which record a visitor screen and typing. This site is used by '
      'people arranging urgent medical transport, and no analysis is worth '
      'recording that. None is installed.', 'Note'),

    P('7. Listing consistency (do this once, then keep it)', 'H1'),
    P('Everywhere AirEvac appears online must show identical details. Search '
      'engines and AI systems cross-check them, and a mismatch reads as an '
      'unreliable business. The correct version is:'),
    table(
        ['Field', 'The one correct value'],
        [
            ['Name', 'AirEvac International'],
            ['Address', '2525 NW 55th Court, Hangar 24, Fort Lauderdale, FL 33309'],
            ['Phone', '(619) 754-6755'],
            ['Email', 'ops@aeiamericas.com'],
            ['Fax (clinical records)', '(619) 330-4551'],
            ['Website', 'The address chosen in section 1'],
        ],
        [1.7 * inch, 5.1 * inch]),
    SP(8),
    P('Worth updating or creating with exactly these details: the Fort '
      'Lauderdale Executive Airport tenant directory, the EURAMI provider '
      'listing, any air ambulance or medical transport directories AirEvac '
      'already appears in, chamber of commerce membership, and every social '
      'profile. <b>Old listings showing a previous phone number or the Scottsdale '
      'address actively work against you</b> and should be corrected or removed.'),

    P('8. Access checklist', 'H1'),
    table(
        ['Platform', 'AirEvac action', 'Access for the build team'],
        [
            ['Domain registrar', 'Add DNS records (sections 1 and 2)',
             'None needed if AirEvac adds them'],
            ['Render', 'Done, paid instance live', 'Team member'],
            ['Google Search Console', 'Verify domain, submit sitemap', 'Full user'],
            ['Bing Webmaster Tools', 'Import from Search Console', 'User'],
            ['Google Business Profile', 'Create or claim, verify', 'Manager'],
            ['Bing Places', 'Import from Google', 'Shared login or none'],
            ['Google Analytics 4', 'Create property, send Measurement ID', 'Editor'],
            ['Tag Manager (optional)', 'Create container', 'Editor'],
        ],
        [1.55 * inch, 2.85 * inch, 2.4 * inch]),
]

build('AirEvac_Signups_and_Accounts.pdf',
      'AirEvac International | Launch Program | Sign-Ups and Accounts | Rev 2.0',
      s1)

# ===========================================================================
# PDF 2 - Facts and approvals
# ===========================================================================

s2 = [
    P('WEBSITE LAUNCH PROGRAM | REVISION 2.0', 'Brand'),
    P('Facts and Approvals Still Required', 'DocTitle'),
    P('What the website still needs from AirEvac leadership, aviation '
      'operations, clinical leadership, and legal. The build work is complete. '
      'Everything below is information or a sign-off that only AirEvac can give, '
      'and the site deliberately withholds the related content until it arrives. '
      'Prepared 30 July 2026.', 'DocSub'),

    P('Read this first', 'H1'),
    P('AirEvac approved "all changes needed to make the site as AI searchable and '
      'recommendable as possible", and those changes are built and live on the '
      'development site. That approval covered <b>decisions</b>.'),
    P('It does not, and cannot, supply <b>facts</b>. The website is built so that '
      'no claim about an accreditation, an aircraft, a clinical capability, or an '
      'operating authority can appear unless the supporting document is on file, '
      'with an owner, an approval date, and an expiry date. That rule is enforced '
      'by the software itself, not by anyone remembering to check. It is the '
      'reason the site can be trusted, and it is why a general approval does not '
      'turn into published claims.'),
    P('So the items below are not requests for permission. They are requests for '
      'a document, a name, or a list.', 'Note'),

    P('1. The single most valuable item on this page', 'H1'),
    P('EURAMI accreditation certificate', 'H2'),
    P('<b>The website currently publishes no accreditation at all.</b> Not on the '
      'credentials page, not in the data search engines read, not in the file '
      'that AI systems read.'),
    P('This is not because anything is wrong. The EURAMI record is already in the '
      'system with the exact accredited scope, the expiry date of 25 August 2027, '
      'and a public link anyone can verify it against. One field is empty: the '
      'date a named AirEvac approver confirmed the certificate itself is on file. '
      'The software will not publish an accreditation on the strength of a '
      'directory entry alone.'),
    P('WHAT THIS COSTS RIGHT NOW: an accreditation from a named body, with a '
      'verifiable third-party link, is the strongest credibility signal this '
      'website could carry. It is exactly what an AI system weighs when deciding '
      'whether to recommend a medical transport provider, and exactly what a '
      'hospital case manager looks for when choosing between providers. It is '
      'currently invisible.', 'Flag'),
    P('<b>What we need:</b> the EURAMI certificate document, and confirmation of '
      'who at AirEvac approves its publication. Publication follows the same day.'),

    P('2. Facts that unlock withheld content', 'H1'),
    table(
        ['#', 'What we need', 'What is happening without it'],
        [
            ['F1', '<b>Clinical reviewers.</b> The names, roles, and credentials '
                   'of the medical staff who will be publicly named as having '
                   'reviewed the medical pages, and their agreement to be named.',
             'Every medical page displays a visible "Under review, not yet signed '
             'off by a qualified reviewer" banner. Search engines and AI systems '
             'see no named medical authority behind the clinical content, which '
             'is a significant credibility gap in this industry.'],
            ['F2', '<b>Online profiles.</b> The exact current web addresses of '
                   'AirEvac own profiles and directory listings: social accounts, '
                   'industry directories, airport tenant listing.',
             'Search engines cannot confirm that the website, the business '
             'profile, and the directory entries are the same organization. This '
             'is one of the strongest signals available and it is currently '
             'empty. We did not guess from the old website, because pointing at a '
             'defunct account is worse than pointing at nothing.'],
            ['F3', '<b>Route detail confirmation.</b> An operations read-through '
                   'of the twelve route pages: Cancun, Cozumel, Los Cabos, Puerto '
                   'Vallarta, Bahamas, Dominican Republic, Jamaica, Turks and '
                   'Caicos, Cayman, Belize, Costa Rica, Honduras.',
             'Each page describes ground transfer times, local hospital and '
             'discharge realities, and border paperwork. It was drafted from '
             'general regional knowledge, not from AirEvac case files. It is live '
             'and hedged throughout, but an operations lead should confirm it. '
             'Corrections take effect the same day.'],
            ['F4', '<b>Aviation facts.</b> Certificate-holder wording, whether '
                   'the certificate number may be published, operating bases, and '
                   'aircraft range wording.',
             'The site describes AirEvac as coordinating transport directly with '
             'no broker in between, and says nothing about operating authority. '
             'That is accurate and deliberately limited.'],
            ['F5', '<b>Photography.</b> Aircraft, crew, and facility images '
                   'AirEvac has permission to publish, with anyone identifiable '
                   'in them cleared.',
             'Current images came from the existing website. Better photography '
             'improves every page it appears on, and it is one of the few '
             'remaining things that would visibly lift the site.'],
            ['F6', '<b>Service area boundaries.</b> Confirmation of which '
                   'countries and regions are routine coverage versus '
                   'case-by-case.',
             'The site publishes four regions and states that other destinations '
             'are reviewed case by case.'],
        ],
        [0.35 * inch, 2.5 * inch, 3.95 * inch]),

    P('3. Approvals tied to launch', 'H1'),
    P('These do not block the development site. They block going public.'),
]
s2 += bullets([
    '<b>Legal sign-off on the privacy notice, the Notice of Privacy Practices, '
    'and the terms of use.</b> All three are written and all three currently '
    'display an "under review" banner. That banner is correct and should not be '
    'removed to make the site look finished.',
    '<b>A billing and legal decision on patient cost notices.</b> The previous '
    'Patient Rights and Cost Information page was removed by the July change '
    'handoff. Its content is archived and can be restored. Someone should '
    'confirm no notice is legally required before launch.',
    '<b>Operations approval of the 90-minute response wording</b> in the service '
    'questions, and of the <b>Price Lock Guarantee</b> wording on the private pay '
    'page. Both are published as written in the July handoff.',
    '<b>Privacy approval of the email and fax route for clinical documents.</b> '
    'The site instructs people to email records to ops@aeiamericas.com or fax '
    'them. Someone should confirm how those are handled and retained once '
    'received.',
    '<b>Operations approval of the public fleet statement</b>, "two Learjet 31A '
    'aircraft". No registration numbers appear anywhere on the site.',
])
s2 += [
    P('4. Two things the website itself still needs before launch', 'H1'),
    P('Listed here because they are business decisions, not build work:'),
]
s2 += bullets([
    '<b>The transport request form does not deliver anywhere yet.</b> It issues a '
    'reference number and records that a request arrived, but it does not send '
    'the request to anyone, because no approved system has been chosen to receive '
    'it. Today the phone line is the real channel. Before launch, either choose '
    'that system or remove the form and lead with phone and email. A form that '
    'silently reaches nobody is worse than no form.',
    '<b>Domestic United States service page.</b> The site lists the United States '
    'as a service area but has no page describing domestic-only transport, '
    'because we do not know whether AirEvac accepts those cases. If you do, tell '
    'us the typical case, what is coordinated, and any limits, and we will build '
    'the page. If not, we leave it out. It is meaningful search demand either '
    'way.',
])
s2 += [
    P('5. What no website can do', 'H1'),
    P('The AI searchability specification is honest about this and so are we. The '
      'website can be found, understood, and cited. It cannot manufacture the '
      'reasons an AI system or a hospital chooses to recommend AirEvac. Those come '
      'from outside the website:'),
]
s2 += bullets([
    '<b>Independent listings</b> that confirm AirEvac exists where it says it '
    'does: the airport tenant directory, industry directories, the accrediting '
    'body provider listing.',
    '<b>References.</b> Hospitals, case managers, cruise lines, and assistance '
    'companies willing to be named in writing as referring partners.',
    '<b>Press.</b> Local business coverage and medical transport trade press, tied '
    'to real events.',
    '<b>Reviews.</b> A policy for inviting genuine client reviews on Google. Never '
    'filter them, never offer anything in exchange: both violate platform rules '
    'and federal advertising guidance, and both are detectable.',
    '<b>Answering the phone well.</b> A fast, clear 24/7 response remains part of '
    'whether an enquiry becomes a transport, and no amount of website work '
    'substitutes for it.',
])
s2 += [
    P('6. How to respond', 'H1'),
    P('Reply by email with the item number and your answer, document, or list. '
      'Items can come back one at a time; nothing waits on the others. The EURAMI '
      'certificate in section 1 has more effect than everything else on this page '
      'combined, so if only one thing gets done, make it that one.'),
]

build('AirEvac_Facts_and_Approvals.pdf',
      'AirEvac International | Launch Program | Facts and Approvals | Rev 2.0',
      s2)

print('generated 2 PDFs in', OUT_DIR)
