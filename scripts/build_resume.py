"""Create the editable resume. Render and visually verify before replacing the public PDF.

Requires python-docx. Run from any directory with Python 3.10 or newer.
The regular website build uses the verified PDF already in assets/.
"""
from pathlib import Path
from datetime import datetime, timezone
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output' / 'docs' / 'Josh-Strauss-Resume.docx'

def hyperlink(paragraph, label, url):
    link = OxmlElement('w:hyperlink')
    link.set(qn('r:id'), paragraph.part.relate_to(url, RT.HYPERLINK, is_external=True))
    run = OxmlElement('w:r')
    props = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), '223F5C')
    props.append(color)
    run.append(props)
    text = OxmlElement('w:t')
    text.text = label
    run.append(text)
    link.append(run)
    paragraph._p.append(link)

def build_resume():
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(.48)
    section.bottom_margin = Inches(.48)
    section.left_margin = Inches(.62)
    section.right_margin = Inches(.62)
    section.header_distance = Inches(.2)
    section.footer_distance = Inches(.2)
    normal = doc.styles['Normal']
    normal.font.name = 'Arial'
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string('202020')
    normal.paragraph_format.line_spacing = Pt(12.9)
    normal.paragraph_format.space_after = Pt(2)
    normal.paragraph_format.widow_control = True
    title = doc.styles['Title']
    title.font.name = 'Arial'
    title.font.size = Pt(26)
    title.font.bold = True
    title.font.color.rgb = RGBColor(0, 0, 0)
    title.paragraph_format.space_after = Pt(4)
    title.paragraph_format.line_spacing = Pt(30)
    heading = doc.styles['Heading 1']
    heading.font.name = 'Arial'
    heading.font.size = Pt(11)
    heading.font.bold = True
    heading.font.color.rgb = RGBColor(0, 0, 0)
    heading.paragraph_format.space_before = Pt(9)
    heading.paragraph_format.space_after = Pt(4)
    heading.paragraph_format.line_spacing = Pt(13)
    heading.paragraph_format.keep_with_next = True
    bullet_style = doc.styles['List Bullet']
    bullet_style.font.name = 'Arial'
    bullet_style.font.size = Pt(10.5)
    bullet_style.paragraph_format.left_indent = Inches(.13)
    bullet_style.paragraph_format.first_line_indent = Inches(-.13)
    bullet_style.paragraph_format.line_spacing = Pt(12.9)
    bullet_style.paragraph_format.space_after = Pt(2)
    bullet_style.paragraph_format.widow_control = True
    # The bundled template's Title style contains a rule; remove it for a clean resume header.
    for style in doc.styles:
        for border in list(style.element.iter(qn('w:pBdr'))):
            border.getparent().remove(border)
    # Use a real Unicode bullet in a text font so PDF extraction keeps readable list markers.
    for level in doc.part.numbering_part.element.iter(qn('w:lvl')):
        fmt = level.find(qn('w:numFmt'))
        if fmt is not None and fmt.get(qn('w:val')) == 'bullet':
            level.find(qn('w:lvlText')).set(qn('w:val'), '\u2022')
            for fonts in level.iter(qn('w:rFonts')):
                fonts.set(qn('w:ascii'), 'Arial')
                fonts.set(qn('w:hAnsi'), 'Arial')
    props = doc.core_properties
    props.title = 'Josh Strauss Resume'
    props.subject = 'Education, entrepreneurship, leadership and service'
    props.author = 'Josh Strauss'
    props.last_modified_by = 'Josh Strauss'
    props.comments = ''
    props.keywords = 'Josh Strauss, resume'
    props.created = datetime(2026, 9, 8, tzinfo=timezone.utc)
    props.modified = props.created

    def p(text='', **kwargs):
        return doc.add_paragraph(text, **kwargs)
    def entry(name, dates, role=None):
        row = p()
        row.paragraph_format.tab_stops.add_tab_stop(Inches(7.26), WD_TAB_ALIGNMENT.RIGHT)
        row.paragraph_format.keep_with_next = True
        row.paragraph_format.space_before = Pt(4)
        row.paragraph_format.space_after = Pt(1)
        row.add_run(name).bold = True
        row.add_run('\t' + dates)
        if role:
            detail = p(role)
            detail.paragraph_format.keep_with_next = True
            detail.paragraph_format.space_after = Pt(2)
    def bullet(text):
        return p(text, style='List Bullet')
    def section_heading(text):
        return p(text, style='Heading 1')

    p('Josh Strauss', style='Title')
    contact = p()
    contact.add_run('Austin, TX / Miami, FL  |  ')
    hyperlink(contact, 'joshstrauss06@gmail.com', 'mailto:joshstrauss06@gmail.com')
    contact.add_run('  |  786-908-6686')
    links = p()
    hyperlink(links, 'joshstrauss.me', 'https://joshstrauss.me/')
    links.add_run('  |  ')
    hyperlink(links, 'LinkedIn', 'https://www.linkedin.com/in/joshua-strauss-33b779263/')
    links.add_run('  |  ')
    hyperlink(links, 'github.com/jstrauss2552', 'https://github.com/jstrauss2552')

    section_heading('Education')
    entry('University of Austin (UATX)', 'Class of 2029')
    p('Sophomore; concentration in Economics, Politics and History')
    entry('Northeastern University', 'Fall 2025')
    p('Boston, MA; attended one semester before transferring to UATX')
    entry('David Posnack Jewish School', 'Class of 2025')
    p('Cooper City, FL; High Honors')

    section_heading('Entrepreneurial Work')
    entry('GumGauge', 'Aug 2023 - Present', 'Co-founder and CEO')
    bullet('Build the public website and sample-data software demo for an investigational chairside periodontal-measurement concept.')
    note = p('Concept stage: no hardware or clinical performance data exists; timing, safety and performance remain unvalidated. Not FDA cleared or approved; premarket pathway remains under review.')
    note.paragraph_format.left_indent = Inches(.13)
    for run in note.runs:
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor.from_string('484848')
    entry('Mise', 'May 2026 - Present', 'Creator and Developer')
    bullet('Designed and built an AI meal-planning app with photo-assisted pantry inventory, weekly meal plans, grocery lists, guided cooking and an in-app sous-chef.')
    bullet('Developed a native iOS app with a Supabase backend, now in TestFlight early access; an Android client is in development.')

    section_heading('Leadership and Service')
    entry("B'nai B'rith International", '2017 - Present', 'Youth Leadership Representative, North America and Latin America')
    bullet('Participated in human-rights delegations to the UN Human Rights Council, the UN in Geneva and UNESCO in Paris; led a youth mission to Colombia and joined a mission to Bulgaria.')
    bullet("Organized a 160-image exhibit for the organization's 180th anniversary.")
    entry('Colombian Foundation of Community Services', 'Summer 2023', 'Aid Distribution Coordinator and Volunteer')
    bullet('Coordinated aid distribution in Colombia; received the Leadership in Human Rights Initiative Award in Bogotá in 2023.')

    section_heading('Selected Honors')
    p('CIJE Innovation Day: Most Innovative Project (2024); Best School Presentation (2023).')
    p('CIJE Tank finalist, New York (2023-24).')
    p("Youth Leadership in Human Rights and Advocacy Award, B'nai B'rith South Florida (2024).")

    section_heading('Skills and Languages')
    p('Technical: native iOS apps, web development, Supabase, HTML, CSS and JavaScript.')
    p('Languages: English and Spanish (native); Hebrew (basic).')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT)
    print(OUTPUT)

if __name__ == '__main__':
    build_resume()
