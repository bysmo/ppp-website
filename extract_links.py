from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT

doc = Document("images/p3v/Article.docx")
for rel in doc.part.rels.values():
    if rel.reltype == RT.HYPERLINK:
        print(f"URL: {rel.target_ref}")
