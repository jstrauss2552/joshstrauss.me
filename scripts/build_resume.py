"""Build the editable, two-column resume. Render and inspect before publishing its PDF.

Requires Python 3.10+ and python-docx. The website build uses the verified PDF
already in assets/; it does not regenerate this document.
"""
from datetime import datetime, timezone
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_ROW_HEIGHT_RULE, WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output' / 'docs' / 'Josh-Strauss-Resume.docx'
NAVY = '152942'
PALE = 'EDF2F8'
INK = '152942'
MUTED = '465B73'
LIGHT = 'D6E3F2'
WHITE = 'FFFFFF'

EDUCATION = [
    ('University of Austin (UATX)', 'Class of 2029',
     'Sophomore; concentration in Economics, Politics and History'),
    ('Northeastern University', 'Fall 2025',
     'Boston, MA; attended one semester before transferring to UATX'),
    ('David Posnack Jewish School', 'Class of 2025',
     'Cooper City, FL; High Honors'),
]
VENTURES = [
    ('GumGauge', 'Aug 2023 - Present', 'Co-founder and CEO', [
        'Build the public website and sample-data software demo for an investigational chairside periodontal-measurement concept.',
    ], 'Concept stage: no hardware or clinical performance data exists; timing, safety and performance remain unvalidated. Not FDA cleared or approved; premarket pathway remains under review.'),
    ('Mise', 'May 2026 - Present', 'Creator and Developer', [
        'Designed and built an AI meal-planning app with photo-assisted pantry inventory, weekly meal plans, grocery lists, guided cooking and an in-app sous-chef.',
        'Developed a native iOS app with a Supabase backend, now approved for the App Store; an Android client is in development.',
    ], None),
]
SERVICE = [
    ("B'nai B'rith International", '2017 - Present',
     'Youth Leadership Representative, North America and Latin America', [
         'Participated in human-rights delegations to the UN Human Rights Council, the UN in Geneva and UNESCO in Paris; led a youth mission to Colombia and joined a mission to Bulgaria.',
         "Organized a 160-image exhibit for the organization's 180th anniversary.",
     ]),
    ('Colombian Foundation of Community Services', 'Summer 2023',
     'Aid Distribution Coordinator and Volunteer', [
         'Coordinated aid distribution in Colombia; received the Leadership in Human Rights Initiative Award in Bogotá in 2023.',
     ]),
]
HONORS = [
    'CIJE Innovation Day: Most Innovative Project (2024); Best School Presentation (2023).',
    'CIJE Tank finalist, New York (2023-24).',
    "Youth Leadership in Human Rights and Advocacy Award, B'nai B'rith South Florida (2024).",
]


def set_cell(cell, color, top, right, bottom, left):
    props = cell._tc.get_or_add_tcPr()
    shade = OxmlElement('w:shd')
    shade.set(qn('w:fill'), color)
    props.append(shade)
    margins = OxmlElement('w:tcMar')
    for side, value in [('top', top), ('right', right), ('bottom', bottom), ('left', left)]:
        item = OxmlElement(f'w:{side}')
        item.set(qn('w:w'), str(value))
        item.set(qn('w:type'), 'dxa')
        margins.append(item)
    props.append(margins)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    # Remove Word's mandatory empty starter paragraph once real content is added.
    cell.paragraphs[0]._element.getparent().remove(cell.paragraphs[0]._element)


def paragraph(parent, text='', size=9.5, color=INK, bold=False, before=0, after=4,
              leading=12, keep=False, style=None):
    p = parent.add_paragraph(style=style)
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = Pt(leading)
    p.paragraph_format.keep_with_next = keep
    p.paragraph_format.widow_control = True
    run = p.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    return p


def link(parent, label, url):
    p = paragraph(parent, size=9, color=LIGHT, after=7, leading=12)
    node = OxmlElement('w:hyperlink')
    node.set(qn('r:id'), p.part.relate_to(url, RT.HYPERLINK, is_external=True))
    run = OxmlElement('w:r')
    props = OxmlElement('w:rPr')
    for tag, value in [('color', LIGHT), ('sz', '18')]:
        element = OxmlElement(f'w:{tag}')
        element.set(qn('w:val'), value)
        props.append(element)
    fonts = OxmlElement('w:rFonts')
    fonts.set(qn('w:ascii'), 'Arial')
    fonts.set(qn('w:hAnsi'), 'Arial')
    props.append(fonts)
    run.append(props)
    text = OxmlElement('w:t')
    text.text = label
    run.append(text)
    node.append(run)
    p._p.append(node)


def heading(parent, text, sidebar=False, before=17):
    return paragraph(parent, text, size=12.5, color=WHITE if sidebar else INK,
                     bold=True, before=before, after=10, leading=15, keep=True,
                     style='Heading 1')


def entry(parent, name, dates, role, bullets, note=None):
    paragraph(parent, name, size=12, bold=True, before=7, after=3, leading=14, keep=True)
    paragraph(parent, role, size=9.3, color=MUTED, after=2, leading=11.5, keep=True)
    paragraph(parent, dates, size=8.5, color=MUTED, after=7, leading=11, keep=True)
    for text in bullets:
        paragraph(parent, text, after=6, leading=12.5)
    if note:
        paragraph(parent, note, size=9, color=MUTED, after=9, leading=11.5)


def build_resume():
    doc = Document()
    page = doc.sections[0]
    page.page_width = Inches(8.5)
    page.page_height = Inches(11)
    page.top_margin = Inches(0)
    page.bottom_margin = Inches(0)
    page.left_margin = Inches(0)
    page.right_margin = Inches(0)
    page.header_distance = Inches(0)
    page.footer_distance = Inches(0)
    normal = doc.styles['Normal']
    normal.font.name = 'Arial'
    normal.font.size = Pt(9.5)
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.line_spacing = Pt(12)
    for style in doc.styles:
        for border in list(style.element.iter(qn('w:pBdr'))):
            border.getparent().remove(border)
    props = doc.core_properties
    props.title = 'Josh Strauss Resume'
    props.subject = 'Education, entrepreneurship, leadership and service'
    props.author = 'Josh Strauss'
    props.last_modified_by = 'Josh Strauss'
    props.comments = ''
    props.keywords = 'Josh Strauss, resume'
    props.created = datetime(2026, 9, 8, tzinfo=timezone.utc)
    props.modified = datetime(2026, 9, 15, tzinfo=timezone.utc)

    table = doc.add_table(rows=1, cols=2)
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.columns[0].width = Inches(2.45)
    table.columns[1].width = Inches(6.05)
    table.cell(0, 0).width = Inches(2.45)
    table.cell(0, 1).width = Inches(6.05)
    # Word/LibreOffice add the 0.78-inch vertical cell padding to this minimum.
    table.rows[0].height = Inches(10.2)
    table.rows[0].height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
    table_props = table._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for edge in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{edge}')
        border.set(qn('w:val'), 'nil')
        borders.append(border)
    table_props.append(borders)
    indent = OxmlElement('w:tblInd')
    indent.set(qn('w:w'), '0')
    indent.set(qn('w:type'), 'dxa')
    table_props.append(indent)
    sidebar, main = table.rows[0].cells
    set_cell(sidebar, NAVY, 700, 420, 420, 480)
    set_cell(main, PALE, 610, 530, 420, 530)

    paragraph(sidebar, 'Builder and founder', size=10.5, color=WHITE, bold=True,
              after=7, leading=13)
    paragraph(sidebar, 'Austin, TX\nMiami, FL', color=LIGHT, leading=13, after=0)
    heading(sidebar, 'Contact', sidebar=True, before=27)
    link(sidebar, 'joshstrauss06@gmail.com', 'mailto:joshstrauss06@gmail.com')
    link(sidebar, '786-908-6686', 'tel:+17869086686')
    link(sidebar, 'joshstrauss.me', 'https://joshstrauss.me/')
    link(sidebar, 'LinkedIn', 'https://www.linkedin.com/in/joshua-strauss-33b779263/')
    link(sidebar, 'github.com/jstrauss2552', 'https://github.com/jstrauss2552')

    heading(sidebar, 'Education', sidebar=True, before=23)
    for name, dates, description in EDUCATION:
        paragraph(sidebar, name, size=10, color=WHITE, bold=True, before=8,
                  after=4, leading=12.5, keep=True)
        paragraph(sidebar, dates, size=9, color=LIGHT, after=4, keep=True)
        paragraph(sidebar, description, size=9, color=LIGHT, after=6, leading=12)
    heading(sidebar, 'Skills', sidebar=True, before=18)
    paragraph(sidebar, 'Native iOS apps\nWeb development\nSupabase\nHTML, CSS and JavaScript',
              size=9, color=LIGHT, after=0, leading=14)
    heading(sidebar, 'Languages', sidebar=True, before=18)
    paragraph(sidebar, 'English and Spanish\nNative\n\nHebrew\nBasic',
              size=9, color=LIGHT, after=0, leading=13)

    paragraph(main, 'Josh Strauss', size=39, color=INK, before=0, after=10,
              leading=43, style='Title')
    paragraph(main, 'University of Austin sophomore', size=11, color=MUTED,
              after=0, leading=14)
    heading(main, 'Entrepreneurial Work', before=26)
    for args in VENTURES:
        entry(main, *args)
    heading(main, 'Leadership and Service', before=14)
    for args in SERVICE:
        entry(main, *args)
    heading(main, 'Selected Honors', before=14)
    for text in HONORS:
        paragraph(main, text, size=9.2, color=MUTED, after=6, leading=12)

    # A minimal trailing paragraph keeps Word's table document valid without an extra page.
    trailing = doc.add_paragraph()
    trailing.paragraph_format.space_after = Pt(0)
    trailing.paragraph_format.space_before = Pt(0)
    trailing.paragraph_format.line_spacing = Pt(1)
    marker = OxmlElement('w:rPr')
    marker_size = OxmlElement('w:sz')
    marker_size.set(qn('w:val'), '2')
    marker.append(marker_size)
    trailing._p.get_or_add_pPr().append(marker)
    trailing.add_run().font.size = Pt(1)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == '__main__':
    build_resume()
