"""Generates the two companion PDFs for the AI Search Coding Handoff:

  1. AirEvac_Required_Inputs_and_Approvals.pdf  (for AirEvac leadership)
  2. AirEvac_External_Accounts_Setup.pdf        (Google/Bing/Render/DNS actions)

Styled to match the company's existing handoff documents: navy headings,
uppercase brand header, footer with document title and page number.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether,
)

NAVY = colors.HexColor('#13315C')
NAVY_DARK = colors.HexColor('#0B2239')
SUPPORT = colors.HexColor('#1D6FB8')
INK = colors.HexColor('#26313B')
LIGHT = colors.HexColor('#EEF3F8')
RULE = colors.HexColor('#C8D4E0')

styles = getSampleStyleSheet()

def st(name, **kw):
    base = kw.pop('base', 'Normal')
    s = ParagraphStyle(name, parent=styles[base], **kw)
    styles.add(s)
    return s

st('Brand', fontName='Helvetica-Bold', fontSize=9, textColor=NAVY,
   spaceAfter=2, tracking=2)
st('DocTitle', fontName='Helvetica-Bold', fontSize=24, leading=28,
   textColor=NAVY_DARK, spaceBefore=10, spaceAfter=6)
st('DocSub', fontName='Helvetica', fontSize=11, leading=15,
   textColor=INK, spaceAfter=18)
st('H1', fontName='Helvetica-Bold', fontSize=15, leading=19, textColor=NAVY,
   spaceBefore=18, spaceAfter=6)
st('H2', fontName='Helvetica-Bold', fontSize=11.5, leading=15,
   textColor=NAVY_DARK, spaceBefore=12, spaceAfter=4)
st('Body', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=INK,
   spaceAfter=6)
st('BodySmall', fontName='Helvetica', fontSize=8.5, leading=12, textColor=INK)
st('Cell', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=INK)
st('CellBold', fontName='Helvetica-Bold', fontSize=8.5, leading=11.5,
   textColor=NAVY_DARK)
st('CellHead', fontName='Helvetica-Bold', fontSize=8.5, leading=11,
   textColor=colors.white)
st('AeiBullet', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=INK,
   leftIndent=14, bulletIndent=4, spaceAfter=3)
st('Note', fontName='Helvetica-Oblique', fontSize=9, leading=12.5,
   textColor=colors.HexColor('#4A5560'), spaceBefore=2, spaceAfter=8)


def build(filename, doc_label, story):
    def on_page(canvas, doc):
        canvas.saveState()
        # Header
        canvas.setFillColor(NAVY)
        canvas.setFont('Helvetica-Bold', 9)
        canvas.drawString(0.85 * inch, letter[1] - 0.55 * inch,
                          'AIREVAC INTERNATIONAL')
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.8)
        canvas.line(0.85 * inch, letter[1] - 0.65 * inch,
                    letter[0] - 0.85 * inch, letter[1] - 0.65 * inch)
        # Footer
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#5A6570'))
        canvas.drawString(0.85 * inch, 0.5 * inch, doc_label)
        canvas.drawRightString(letter[0] - 0.85 * inch, 0.5 * inch,
                               f'Page {doc.page}')
        canvas.restoreState()

    doc = BaseDocTemplate(
        filename, pagesize=letter,
        leftMargin=0.85 * inch, rightMargin=0.85 * inch,
        topMargin=0.95 * inch, bottomMargin=0.8 * inch,
        title=doc_label, author='AirEvac International website build team',
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
                  id='main')
    doc.addPageTemplates([PageTemplate(id='page', frames=[frame],
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


P = lambda text, style='Body': Paragraph(text, styles[style])
SP = lambda h=6: Spacer(1, h)

# ============================================================================
# PDF 1: Required inputs and approvals from AirEvac
# ============================================================================

s1 = []
s1.append(P('AI SEARCHABILITY PROGRAM', 'Brand'))
s1.append(P('Required Inputs and Approvals from AirEvac', 'DocTitle'))
s1.append(P(
    'Companion to the AI Search Coding Handoff. Everything in this document '
    'needs an answer, a fact, or a sign-off from AirEvac leadership, aviation '
    'operations, clinical leadership, or marketing. Nothing here requires '
    'technical knowledge. Prepared July 30, 2026 by the website build team.',
    'DocSub'))

s1.append(P('How to use this document', 'H1'))
s1.append(P(
    'Each item has an ID. Reply by email with the ID and your answer, '
    'attachment, or approval. Where a default is listed, the build proceeds '
    'with that default until you say otherwise, and the default is always the '
    'cautious option: nothing is claimed, published, or enabled without '
    'approval. Items marked BLOCKING hold up a visible part of the build.'))

s1.append(P('1. Decisions required', 'H1'))
s1.append(table(
    ['ID', 'Decision', 'What we need from you', 'Default until answered'],
    [
        ['A1',
         '<b>AI crawler policy.</b> Search crawlers (Google, Bing, ChatGPT '
         'search, Claude search) will be allowed so the site can be found and '
         'cited. Separately, some crawlers collect pages to train AI models.',
         'Confirm whether to block model-training crawlers: GPTBot (OpenAI), '
         'Google-Extended (Gemini training), Applebot-Extended. Blocking them '
         'does not reduce search visibility.',
         'Allow all search crawlers; block training-only crawlers.'],
        ['A2',
         '<b>Analytics. BLOCKING for measurement only.</b> The handoff '
         'recommends Google Analytics 4 and Tag Manager. The published '
         'privacy notice currently promises no analytics cookies, so adopting '
         'them requires a privacy notice update and a consent approach.',
         'Approve or decline GA4 and Tag Manager. We recommend declining '
         'Microsoft Clarity session recording entirely: this site handles '
         'urgent medical contacts.',
         'Measurement layer is built but disabled. No tracking runs.'],
        ['A3',
         '<b>Domain form.</b> The site must live at one address. The AI '
         'handoff assumes www.airevacinternational.com; the build is currently '
         'configured for airevacinternational.com without www.',
         'Choose www or non-www. Either works; it must be one, everywhere, '
         'forever.',
         'Non-www, with www redirecting to it.'],
        ['A4',
         '<b>Hosting plan.</b> The free Render tier puts the site to sleep '
         'when idle. A sleeping site answers crawlers and callers slowly or '
         'not at all.',
         'Approve a paid Render production instance and log retention.',
         'Site remains on the current preview instance.'],
        ['A5',
         '<b>Structure conflict.</b> The AI handoff lists pages your July 27 '
         'change handoff removed: commercial medical escort, medical '
         'equipment, cost and patient-rights content, and separate hospital '
         'and case-manager sections.',
         'Confirm the July 27 change handoff remains authoritative. We '
         'believe the AI document was written against the old site.',
         'July 27 handoff wins. Removed pages stay removed.'],
        ['A6',
         '<b>Domestic service page. BLOCKING for that page.</b> The AI '
         'handoff proposes a page for domestic United States air ambulance '
         'service. The site currently lists the United States as a service '
         'area but has no domestic service page.',
         'Confirm AirEvac accepts domestic-only transports, and supply the '
         'facts: typical cases, what is coordinated, limitations.',
         'No domestic page is published.'],
        ['A7',
         '<b>Content management system.</b> The AI handoff recommends a '
         'headless CMS (Sanity). The site currently keeps all content in '
         'reviewed, version-controlled records with publication gates that '
         'block unapproved claims automatically.',
         'Tell us who at AirEvac needs to edit site content without a '
         'developer, and how often. That answer decides whether a CMS is '
         'worth its cost and the loss of the current approval gates.',
         'No CMS. Content changes go through the build team.'],
    ],
    [0.35 * inch, 1.85 * inch, 2.6 * inch, 2.0 * inch]))

s1.append(P('2. Facts only AirEvac can supply', 'H1'))
s1.append(P(
    'The AI handoff is explicit that coding must not invent or carry over '
    'these facts. Until each arrives, the related content stays unpublished '
    'or stays limited to what has already been approved.'))
s1.append(table(
    ['ID', 'Fact set', 'What is needed', 'Status'],
    [
        ['F1', 'Legal and entity facts',
         'Approved legal name, any DBA wording, operator relationships, and '
         'which names may appear publicly.',
         'Needed. Site currently publishes only "AirEvac International".'],
        ['F2', 'Aviation facts',
         'Certificate-holder wording, whether the certificate number is '
         'publishable, operating bases, aircraft range wording, and '
         'restrictions.',
         'Needed. Fleet statement ("two Learjet 31A aircraft") is published '
         'per the July 27 handoff and awaits final operations approval.'],
        ['F3', 'Clinical facts',
         'Medical team roles, equipment, supported and excluded patient '
         'categories, and the names and credentials of clinical reviewers '
         'willing to be published.',
         'Needed. BLOCKING for reviewer profiles, equipment content, and '
         'any medical guide articles.'],
        ['F4', 'Accreditations',
         'Current status, scope, expiration, approved logos, exact approved '
         'language, and public proof links for every accreditation.',
         'Needed. The site publishes no accreditation until this arrives; '
         'the launch gate withholds them automatically.'],
        ['F5', 'Service area',
         'Confirmation of the twelve route pages’ operational detail '
         '(ground transfer, hospital and discharge, documents), and routine '
         'versus case-by-case coverage boundaries.',
         'Drafted by the build team from regional knowledge. Needs an '
         'operations read-through; corrections take effect same day.'],
        ['F6', 'Photography',
         'Aircraft, crew, and facility images AirEvac has permission to '
         'publish, with any people identifiable in them cleared.',
         'Partial. Current images came from the old site; anything better '
         'improves every page it touches.'],
        ['F7', 'Old-site records',
         'Any Google Search Console history, analytics exports, or paid '
         'listing records from the current site, if they exist.',
         'The build team already crawled and mapped all 88 old URLs; '
         'account history would confirm nothing was missed.'],
    ],
    [0.35 * inch, 1.3 * inch, 3.05 * inch, 2.1 * inch]))

s1.append(P('3. Approvals already pending from the July 27 handoff', 'H1'))
s1.append(P(
    'These were recorded in the coding completion report and remain open. '
    'They are listed here so one document tracks everything owed.'))
s1 += bullets([
    'Operations approval for the conditional 90-minute response copy.',
    'Pricing and legal approval for the Price Lock Guarantee.',
    'Privacy approval for the email and fax clinical-document statement.',
    'Billing and legal decision on required patient and cost notices before '
    'launch.',
    'Operations approval for the two Learjet 31A public fleet statement.',
    'Operations confirmation of the twelve route pages’ detail (item F5 '
    'above).',
])

s1.append(P('4. Authority only AirEvac can build', 'H1'))
s1.append(P(
    'The AI handoff is candid that no code can make ChatGPT, Claude, or '
    'Google recommend AirEvac. Answer engines weigh what independent sources '
    'say. These are business actions, not website actions:'))
s1 += bullets([
    '<b>Independent listings.</b> Airport tenant directory at Fort Lauderdale '
    'Executive, industry directories, and the EURAMI provider listing once '
    'its status is confirmed.',
    '<b>References.</b> Hospitals, case managers, cruise lines, and '
    'assistance companies willing to be named as referring partners, in '
    'writing.',
    '<b>Press.</b> Local business coverage, aviation and medical transport '
    'trade press, and announcements tied to real events.',
    '<b>Reviews.</b> A policy for inviting genuine client reviews on Google. '
    'Never gate, filter, or incentivize them; that violates platform rules '
    'and FTC guidance.',
    '<b>Consistency.</b> One exact name, address, and phone number everywhere '
    'AirEvac appears online. Mismatches read as unreliability to both search '
    'engines and AI systems.',
])

s1.append(P('5. What the build team will not publish without you', 'H1'))
s1.append(P(
    'Per the AI handoff’s stop rules, coding halts and requests verified '
    'input whenever content involves: patient safety, clinical capability, '
    'equipment, or staffing; aircraft ownership, operating authority, FAA '
    'certification, range, bases, or availability; superlatives such as best, '
    'safest, immediate, guaranteed, worldwide, or insurance-covered; any '
    'named accreditor, regulator, hospital, government office, partner, or '
    'insurer; or route-page claims about travel time, pricing, direct-flight '
    'capability, or customs procedure. This is already enforced by automated '
    'tests in the codebase, and it will stay enforced.'))

build('AirEvac_Required_Inputs_and_Approvals.pdf',
      'AirEvac International | AI Search Program | Required Inputs and Approvals',
      s1)

# ============================================================================
# PDF 2: External accounts and platform setup
# ============================================================================

s2 = []
s2.append(P('AI SEARCHABILITY PROGRAM', 'Brand'))
s2.append(P('External Accounts and Platform Setup Guide', 'DocTitle'))
s2.append(P(
    'Step-by-step actions on Google, Bing, Render, and your domain registrar '
    'that require AirEvac account ownership. The website build team cannot '
    'perform these: they must be done by, or under the accounts of, AirEvac. '
    'Companion to the AI Search Coding Handoff. Prepared July 30, 2026.',
    'DocSub'))

s2.append(P(
    'Order matters: complete section 1 (domain) and section 2 (hosting) '
    'first. Sections 3 through 6 depend on the final domain being live. '
    'Section 7 waits for the analytics decision (item A2 in the companion '
    'approvals document).', 'Note'))

s2.append(P('1. Domain and DNS (do this first)', 'H1'))
s2.append(P(
    'The site currently runs at airevac-international-website.onrender.com. '
    'Search engines and AI systems should only ever learn one permanent '
    'address. The certificate warning a reviewer saw earlier is what happens '
    'when the custom domain is visited before it is attached to the host; '
    'completing this section makes that error impossible.'))
s2 += bullets([
    'Decide www.airevacinternational.com or airevacinternational.com (item '
    'A3). Every later step uses that choice.',
    'Sign in at the domain registrar for airevacinternational.com.',
    'In Render, open the web service, choose Settings, then Custom Domains, '
    'and add the chosen domain. Render shows the exact DNS records to create.',
    'Create those records at the registrar: a CNAME for www, or A/ALIAS '
    'records for the bare domain, exactly as Render displays them.',
    'Wait for Render to show the domain as verified with a certificate '
    'issued. This usually takes minutes, occasionally up to an hour.',
    'Keep the old WordPress hosting untouched until the new site is approved '
    'for cutover; changing DNS is the cutover.',
])
s2.append(P(
    'Send the build team: confirmation of the chosen domain form, and the '
    'date you intend to cut over.', 'Note'))

s2.append(P('2. Render production settings', 'H1'))
s2 += bullets([
    'Upgrade the web service from the free tier to a paid instance so the '
    'site never sleeps. A sleeping site answers crawlers and 2 a.m. callers '
    'late or not at all.',
    'Confirm the health check path is set to /healthz.',
    'Turn on log retention, or add a log stream, so crawler visits '
    '(Googlebot, Bingbot, ChatGPT and Claude search bots) can be inspected '
    'for blocks or errors.',
    'Add the build team’s account to the Render team so deploys and logs '
    'are visible to them.',
])

s2.append(P('3. Google Search Console', 'H1'))
s2.append(P(
    'This is how Google tells you what it has indexed and what is broken. It '
    'is free and does not change the website.'))
s2 += bullets([
    'Go to search.google.com/search-console signed in with an AirEvac Google '
    'account that leadership controls (not a personal account).',
    'Add a property. Choose the Domain property type and enter '
    'airevacinternational.com.',
    'Google shows a TXT record. Add it at the domain registrar, return, and '
    'click Verify.',
    'Open Sitemaps in the left menu and submit sitemap.xml.',
    'Open Settings, then Users and permissions, and add the build team’s '
    'email with Full access.',
])
s2.append(P(
    'If a Search Console property already exists for the old WordPress site, '
    'do not delete it: its history is useful. Grant the build team access to '
    'it as well (item F7).', 'Note'))

s2.append(P('4. Bing Webmaster Tools', 'H1'))
s2 += bullets([
    'Go to bing.com/webmasters signed in with an AirEvac Microsoft account.',
    'Choose Import from Google Search Console; it copies the verification '
    'and sitemap in one step. Otherwise verify with a DNS record as in '
    'section 3.',
    'Confirm sitemap.xml appears under Sitemaps.',
    'Add the build team as a user.',
])
s2.append(P(
    'Bing powers Microsoft Copilot and supplies results some AI assistants '
    'read, so this account matters more than Bing’s search share '
    'suggests. The IndexNow protocol the handoff requires is implemented in '
    'code; nothing needs to be created here for it.', 'Note'))

s2.append(P('5. Google Business Profile', 'H1'))
s2.append(P(
    'One profile, for the real staffed base only. The AI handoff is explicit: '
    'do not create listings for destinations served. A Cancun listing for a '
    'Fort Lauderdale company reads as fake to Google and to AI systems.'))
s2 += bullets([
    'Go to business.google.com with the same AirEvac Google account.',
    'Create or claim the profile for: AirEvac International, 2525 NW 55th '
    'Court, Hangar 24, Fort Lauderdale, FL 33309.',
    'If a profile already exists from the old site, claim and correct it '
    'rather than creating a second one.',
    'Category: choose the closest available to air ambulance service; if '
    'unavailable, use a medical transport or emergency-related category. Do '
    'not pick an aviation charter category: it describes a different '
    'business.',
    'Phone: (619) 754-6755. Website: the final domain from section 1. '
    'Hours: open 24 hours, all seven days.',
    'Because clients do not walk in, review the service-area settings with '
    'the build team before publishing the profile.',
    'Add only photography AirEvac has confirmed permission to publish '
    '(item F6).',
    'Verification is usually by postcard, phone, or video; complete it, then '
    'add the build team as a manager.',
])

s2.append(P('6. Bing Places', 'H1'))
s2 += bullets([
    'Go to bingplaces.com and choose Import from Google Business Profile.',
    'Confirm the imported name, address, phone, and hours match section 5 '
    'exactly.',
])

s2.append(P('7. Google Analytics 4 and Tag Manager (only if approved)', 'H1'))
s2.append(P(
    'Skip this section unless item A2 in the approvals document is approved, '
    'because the site’s privacy notice must change first.'))
s2 += bullets([
    'At analytics.google.com create an account named AirEvac International '
    'and a web property for the final domain.',
    'At tagmanager.google.com create a container for the same domain.',
    'Do not install any code snippets; the build team wires both in with the '
    'privacy-safe event layer once approval and the notice update are done.',
    'Add the build team with edit access to both.',
])

s2.append(P('8. Listing and citation consistency', 'H1'))
s2.append(P(
    'Everywhere AirEvac appears online must show the identical name, address, '
    'and phone number. Search engines and AI systems cross-check these; '
    'mismatches cost trust. The canonical version is:'))
s2.append(table(
    ['Field', 'Canonical value'],
    [
        ['Name', 'AirEvac International'],
        ['Address', '2525 NW 55th Court, Hangar 24, Fort Lauderdale, FL 33309'],
        ['Phone', '(619) 754-6755'],
        ['Email', 'ops@aeiamericas.com'],
        ['Website', 'Final domain from section 1'],
    ],
    [1.2 * inch, 5.6 * inch]))
s2.append(SP(6))
s2.append(P(
    'Worth updating or creating with these exact details: the Fort Lauderdale '
    'Executive Airport tenant directory, the EURAMI provider listing (once '
    'status is confirmed), medical transport and air ambulance directories '
    'AirEvac already appears in, any chamber of commerce membership, and '
    'social profiles. Fix old listings showing the previous phone number or '
    'the Scottsdale address; those actively harm verification.'))

s2.append(P('9. Access checklist', 'H1'))
s2.append(table(
    ['Platform', 'Action', 'Access to grant the build team'],
    [
        ['Domain registrar', 'DNS records from sections 1 and 3',
         'None needed if AirEvac adds records; otherwise delegated DNS '
         'access'],
        ['Render', 'Paid plan, custom domain, logs', 'Team member'],
        ['Google Search Console', 'Verify domain, submit sitemap',
         'Full user'],
        ['Bing Webmaster Tools', 'Import from Search Console', 'User'],
        ['Google Business Profile', 'Create or claim, verify', 'Manager'],
        ['Bing Places', 'Import from Google profile', 'Shared login or none'],
        ['GA4 / Tag Manager', 'Create only if A2 approved', 'Editor'],
    ],
    [1.55 * inch, 2.8 * inch, 2.45 * inch]))

build('AirEvac_External_Accounts_Setup.pdf',
      'AirEvac International | AI Search Program | External Accounts Setup',
      s2)

print('done')
