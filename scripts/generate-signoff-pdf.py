"""Generates AirEvac_Executive_Sign_Off_Register.pdf.

The printable, signable form of docs/executive-sign-off-register.md. That file
is the source of truth and lives in the repository; this is the version an
executive can put in front of a legal or medical owner and get a signature on.

Keep the two in step. If an item changes there, change it here.

Usage: python3 scripts/generate-signoff-pdf.py [output_dir]
"""

import sys

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table,
    TableStyle,
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
# keepWithNext, so a section heading never strands itself at the foot of a page
# with its table overleaf.
st('H1', fontName='Helvetica-Bold', fontSize=14.5, leading=18, textColor=NAVY,
   spaceBefore=16, spaceAfter=6, keepWithNext=1)
st('Body', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=INK,
   spaceAfter=6)
st('Cell', fontName='Helvetica', fontSize=8, leading=10.8, textColor=INK)
st('CellId', fontName='Helvetica-Bold', fontSize=8, leading=10.8, textColor=NAVY)
st('CellHead', fontName='Helvetica-Bold', fontSize=8, leading=10.5,
   textColor=colors.white)
st('AeiBullet', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=INK,
   leftIndent=14, bulletIndent=4, spaceAfter=3)
st('Note', fontName='Helvetica-Oblique', fontSize=9, leading=12.5,
   textColor=colors.HexColor('#4A5560'), spaceBefore=2, spaceAfter=8)
st('Flag', fontName='Helvetica-Bold', fontSize=9.5, leading=13.5,
   textColor=URGENT, spaceAfter=6)
st('Done', fontName='Helvetica-Bold', fontSize=9.5, leading=13.5,
   textColor=GOOD, spaceAfter=6)

DOC_LABEL = 'Executive Sign-Off Register | 30 July 2026'


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.setFont('Helvetica-Bold', 9)
    canvas.drawString(0.7 * inch, letter[1] - 0.55 * inch, 'AIREVAC INTERNATIONAL')
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.8)
    canvas.line(0.7 * inch, letter[1] - 0.65 * inch,
                letter[0] - 0.7 * inch, letter[1] - 0.65 * inch)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#5A6570'))
    canvas.drawString(0.7 * inch, 0.5 * inch, DOC_LABEL)
    canvas.drawRightString(letter[0] - 0.7 * inch, 0.5 * inch, f'Page {doc.page}')
    canvas.restoreState()


def build(filename, story):
    doc = BaseDocTemplate(
        f'{OUT_DIR}/{filename}', pagesize=letter,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.95 * inch, bottomMargin=0.8 * inch,
        title='AirEvac International Executive Sign-Off Register',
        author='AirEvac International website build team',
    )
    doc.addPageTemplates([PageTemplate(
        id='page',
        frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='main')],
        onPage=on_page)])
    doc.build(story)


# Column widths for the four-column register tables. The identifier column is
# narrow on purpose: the width belongs to the two columns anyone actually
# reads, which are what is being approved and what happens if it is not.
W = [0.42 * inch, 1.25 * inch, 2.9 * inch, 2.53 * inch]


def register(rows):
    data = [[Paragraph(h, styles['CellHead']) for h in
             ('#', 'Who signs', 'What they are approving', 'What the site does while unsigned')]]
    for row in rows:
        data.append([
            Paragraph(row[0], styles['CellId']),
            Paragraph(row[1], styles['Cell']),
            Paragraph(row[2], styles['Cell']),
            Paragraph(row[3], styles['Cell']),
        ])
    t = Table(data, colWidths=W, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT]),
        ('GRID', (0, 0), (-1, -1), 0.5, RULE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t


def bullets(items):
    return [Paragraph(i, styles['AeiBullet'], bulletText='•') for i in items]


def P(text, style='Body'):
    return Paragraph(text, styles[style])


def SP(h=6):
    return Spacer(1, h)


story = [
    P('WEBSITE LAUNCH PROGRAM | SIGN-OFF REGISTER', 'Brand'),
    P('Executive Sign-Off Register', 'DocTitle'),
    P('Everything that needs a named signature before airevacinternational.com '
      'is public, and what the website does in the meantime. Twenty-five items. '
      'Prepared 30 July 2026.', 'DocSub'),

    P('You can demonstrate the site today without signing any of this', 'H1'),
    P('The preview is invisible to search engines. It tells every crawler not to '
      'index it and every page carries a no-index instruction, so nothing on it '
      'reaches the public or a search result. Open it, use the chat, sign into '
      'the coordinator console, show any of it to anyone. None of the approvals '
      'below are needed for that.', 'Done'),
    P('Every one of them is needed before the site is public.', 'Flag'),

    P('What the build team has already decided, and does not need you to '
      'confirm: framework and hosting, security architecture, database design, '
      'accessibility implementation, test coverage, and the redirect map. Those '
      'are ours. If one is wrong it is our mistake to fix. Everything in this '
      'document is something we deliberately did not decide, because it was not '
      'ours to decide. Where we needed to pick something to keep building, we '
      'picked the cautious option, and that choice is in the last column.'),

    P('1. Legal and privacy', 'H1'),
    register([
        ('L1', 'Legal counsel',
         '<b>Website Privacy Notice.</b> Currently describes the site as built, '
         'including what it refuses to collect.',
         'The page shows a visible "under review" banner. The banner is accurate '
         'and must not be removed to make the site look finished.'),
        ('L2', 'Legal counsel', '<b>Notice of Privacy Practices.</b>', 'Same banner.'),
        ('L3', 'Legal counsel', '<b>Terms of Use.</b>', 'Same banner.'),
        ('L4', 'Legal and privacy',
         '<b>Privacy notice rewritten to describe live chat.</b> L1 and L2 both '
         'describe a website that receives no clinical information. A chat makes '
         'that false within the first minute of the first conversation.',
         '<b>Hard gate on chat going public.</b> Chat is on for the preview and '
         'stays off on the live domain until this is done.'),
        ('L5', 'Legal and billing',
         '<b>Whether a patient cost notice is legally required.</b> The previous '
         'page was removed by the July handoff. Its content is archived and can '
         'be restored in an hour.',
         'No notice is published. If one is required and absent, that is a '
         'compliance exposure rather than a missing page.'),
        ('L6', 'Privacy officer',
         '<b>Business Associate Agreement covering the database.</b> Available on '
         'the current hosting plan, but a BAA is a signed contract rather than a '
         'plan feature, so it has to be requested and executed.',
         'Chat stays off on the live domain. Only test data goes in the database.'),
        ('L7', 'Privacy officer',
         '<b>Retention schedule for chat transcripts.</b> The build uses a '
         'provisional 30 days.',
         '30 days applies, and the privacy notice cannot state a number AirEvac '
         'has approved.'),
        ('L8', 'Privacy officer',
         '<b>Email and fax handling of clinical documents.</b> The site tells '
         'people to send records to ops@aeiamericas.com or fax (619) 330-4551.',
         'The instruction is published with no documented process behind it.'),
    ]),

    P('2. Clinical', 'H1'),
    register([
        ('C1', 'Medical Director',
         '<b>Named clinical reviewers</b> for the medical pages, with credentials, '
         'and their agreement to be publicly named.',
         'Every medical page shows the "under review" banner and no reviewer '
         'appears in the machine-readable data. Search engines and AI systems see '
         'no named medical authority behind the clinical content, which is a real '
         'credibility gap in this industry.'),
        ('C2', 'Medical Director',
         '<b>Crew credentials and equipment claims</b>, if any are to be published.',
         'The site describes how crews are assigned and publishes no specific '
         'certification or equipment model.'),
        ('C3', 'Medical Director',
         '<b>The conditional 90-minute response wording</b> in the service '
         'questions.',
         'Published as written in the July handoff, unapproved.'),
    ]),

    P('3. Aviation and operations', 'H1'),
    register([
        ('A1', 'Director of Operations',
         '<b>The public fleet statement</b>, "two Learjet 31A aircraft". No '
         'registration appears anywhere on the site.',
         'Published as written in the July handoff, unapproved.'),
        ('A2', 'Director of Operations',
         '<b>Certificate-holder wording</b>, and whether the certificate number '
         'may be published.',
         'The site says AirEvac coordinates directly with no broker in between, '
         'and claims no operating authority anywhere.'),
        ('A3', 'Director of Operations',
         '<b>Route detail on the twelve route pages</b>: ground transfer times, '
         'hospital and discharge realities, border paperwork. Drafted from '
         'general regional knowledge, not AirEvac case files.',
         'Live and hedged throughout, but unconfirmed. Corrections take effect '
         'the same day.'),
        ('A4', 'Director of Operations',
         '<b>Service area boundaries</b>: which regions are routine and which are '
         'case by case.',
         'Four regions published, with "other destinations are reviewed case by '
         'case".'),
        ('A5', 'Operations',
         '<b>Chat staffing.</b> Chat is offered only while a coordinator is '
         'signed into the console. The blueprint asked for a 30-day staffing test '
         'before chat became customer-facing.',
         'The widget tells visitors nobody is available and shows the phone '
         'number. Honest, and it undercuts the point of having chat at all.'),
    ]),

    P('4. Compliance and credentials', 'H1'),
    register([
        ('K1', 'Compliance lead and Executive sponsor',
         '<b>EURAMI accreditation publication.</b> The register holds the exact '
         'scope, an expiry of 25 August 2027, and a public verification address. '
         'What is missing is confirmation that the certificate itself is on file.',
         '<b>The site publishes no accreditation at all</b>: not on the '
         'credentials page, not in the machine-readable data, not in the file AI '
         'systems read. The highest-value item on this register.'),
        ('K2', 'Compliance lead',
         '<b>NAAMTA</b>: renewed certificate, or a decision to omit.',
         'Held. Appears nowhere. The word is blocked from page copy by an '
         'automated test.'),
        ('K3', 'Director of Operations',
         '<b>ARGUS</b>: current rating evidence, or a decision to omit.',
         'Held. Appears nowhere.'),
        ('K4', 'Director of Operations',
         '<b>Learjet 35 status</b>: active, reserve, partner-operated, or retired.',
         'Held. Public copy states only the two Learjet 31As.'),
        ('K5', 'Compliance lead',
         '<b>State EMS licences and marketed-base authority.</b>',
         'No operating-authority claim appears on any page.'),
    ]),

    P('5. Commercial', 'H1'),
    register([
        ('M1', 'Pricing and legal',
         '<b>The Price Lock Guarantee wording</b> on the Private Pay page.',
         'Published as written in the July handoff, unapproved.'),
        ('M2', 'Marketing',
         '<b>Analytics.</b> Approved in principle and built. Needs a Google '
         'Analytics measurement ID and the privacy notice updated to match.',
         'No measurement of any kind runs.'),
        ('M3', 'Leadership',
         '<b>Photography</b> AirEvac has permission to publish, with anyone '
         'identifiable cleared.',
         'Images are taken from the existing website.'),
        ('M4', 'Leadership',
         '<b>Profile and directory addresses</b> for the machine-readable '
         'organisation record.',
         'The strongest signal that this is a real, corroborated organisation is '
         'absent.'),
    ]),

    P('6. Not sign-offs, but they still block launch', 'H1'),
    P('These are engineering and account tasks rather than approvals. They are '
      'here so nobody assumes the signatures above are the whole list.'),
]

story += bullets([
    '<b>The transport request form delivers nowhere.</b> It issues a reference '
    'and sends a notification; it does not create a case in any system of '
    'record. Either connect an approved intake system or remove the form and '
    'lead with phone and email. A form that silently reaches nobody is worse '
    'than no form.',
    '<b>Rate limiting works on one server only.</b> The published limits are not '
    'the effective limits behind more than one. Moves to the network edge.',
    '<b>The real domain is not attached.</b> The site answers on a temporary '
    'hosting address. Indexing it would teach search engines an address that is '
    'going to change.',
    '<b>Manual accessibility testing has not been done.</b> Automated checks '
    'pass on 17 pages. Screen-reader, keyboard, and 400% zoom review by a person '
    'has not happened, and automated tooling catches roughly a third of the '
    'failures that matter.',
    '<b>Chat runs on one server only.</b> A second would leave each side of a '
    'conversation seeing only their own messages, which reads as the other '
    'person having stopped replying. Lifting this is a known change.',
    '<b>The database connection is encrypted but unverified.</b> The managed '
    'database presents a self-signed certificate, so the preview runs without '
    'checking it. Traffic is protected from anyone listening, but not from an '
    'attacker positioned between the site and the database. Supplying the '
    'provider certificate closes it and takes effect on its own. Must be done '
    'before the database holds real conversations.',
])

story += [
    P('7. What is safe to demonstrate today', 'H1'),
    P('Everything. To be specific:'),
]

story += bullets([
    'The full public site, in English and Spanish.',
    'The coordinator console: sign-in, user management, and the audit log.',
    '<b>Live chat, end to end</b>: the queue, claiming a conversation, replying, '
    'and the transcript notification. Run successfully on the preview on '
    '30 July 2026.',
    '<b>Translation</b>, using clearly marked placeholder text until the AWS '
    'account is connected. It reads "[TEST TRANSLATION ES to EN] ... [NOT A REAL '
    'TRANSLATION]", which is deliberately impossible to mistake for a real one.',
])

story += [
    SP(4),
    P('Two things behave differently on the live domain, enforced in the '
      'software rather than by instruction, so a demonstration setting cannot '
      'quietly become a launch setting: chat is off by default there and on by '
      'default everywhere else, and placeholder translation is refused outright '
      'on the live domain.', 'Note'),

    # Its own page. This is the sheet that gets printed and signed, and it
    # should not arrive with the tail of section 7 above it.
    PageBreak(),
    P('8. Sign-off record', 'H1'),
    P('An item without a name on it is not approved, whatever was said in a '
      'meeting. Print this page, sign it, and keep it with the launch file.'),
    SP(4),
    # One row per item on the register, so nobody has to decide which approvals
    # were important enough to write down.
    Table(
        [[Paragraph(h, styles['CellHead']) for h in
          ('Item', 'Signed by', 'Role', 'Date')]] +
        [['', '', '', ''] for _ in range(25)],
        colWidths=[0.9 * inch, 2.6 * inch, 2.2 * inch, 1.4 * inch],
        rowHeights=[0.26 * inch] + [0.3 * inch] * 25,
        repeatRows=1,
        style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY),
            ('GRID', (0, 0), (-1, -1), 0.5, RULE),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ]),
    ),
]

build('AirEvac_Executive_Sign_Off_Register.pdf', story)
print(f'{OUT_DIR}/AirEvac_Executive_Sign_Off_Register.pdf')
