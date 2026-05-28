from docx import Document

doc = Document("images/p3v/Article.docx")
for table in doc.tables:
    for row in table.rows:
        row_text = []
        for cell in row.cells:
            # Extract text and links if possible
            cell_text = cell.text.strip().replace('\n', ' ')
            row_text.append(cell_text)
        print(" | ".join(row_text))
