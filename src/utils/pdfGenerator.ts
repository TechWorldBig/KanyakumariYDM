/**
 * Pure TypeScript PDF 1.4 Generator
 * Generates valid binary .pdf files natively supported by:
 * - Android (Chrome, Files, Drive PDF Viewer)
 * - iOS / iPadOS (Safari, Files, Apple Books)
 * - Windows / macOS / Linux (Chrome, Edge, Safari, Adobe Reader)
 */

function escapePdf(str: string): string {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

export interface PdfReportOptions {
  filename: string
  title: string
  subtitle: string
  meta: { label: string; value: string }[]
  headers: string[]
  rows: (string | number)[][]
  columnWidths?: number[]
}

export function downloadNativePdf({
  filename,
  title,
  subtitle,
  meta,
  headers,
  rows,
  columnWidths,
}: PdfReportOptions): void {
  const objects: string[] = []
  const addObject = (content: string) => {
    objects.push(content)
    return objects.length
  }

  // Object 1: Catalog
  addObject('<< /Type /Catalog /Pages 2 0 R >>')
  // Object 2: Pages
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  // Object 3: Page (A4 Portrait: 595.28 x 841.89 pt)
  addObject(
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>'
  )
  // Object 4: Font Bold (Helvetica-Bold)
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  // Object 5: Font Regular (Helvetica)
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  // Stream graphics and text commands
  const ops: string[] = []

  // Top Decorative Header Bar
  ops.push('0.09 0.42 0.88 rg 36 764 523 48 re f') // District blue header
  ops.push('1 1 1 rg BT /F1 15 Tf 50 788 Td (' + escapePdf(title) + ') Tj ET')
  ops.push('0.9 0.95 1 rg BT /F2 9.5 Tf 50 773 Td (' + escapePdf(subtitle) + ') Tj ET')

  // Metadata line (Date & Verification)
  let y = 740
  ops.push('0.3 0.35 0.4 rg BT /F2 8.5 Tf 38 ' + y + ' Td (' + escapePdf(meta.map((m) => `${m.label}: ${m.value}`).join('  |  ')) + ') Tj ET')

  // Table header bar
  y -= 26
  ops.push('0.93 0.95 0.98 rg 36 ' + (y - 5) + ' 523 20 re f') // Header row bg
  ops.push('0.1 0.15 0.25 rg')

  // Calculate column widths
  const totalTableWidth = 523
  const colCount = headers.length
  const widths = columnWidths && columnWidths.length === colCount
    ? columnWidths
    : headers.map(() => Math.floor(totalTableWidth / colCount))

  let colX = 46
  headers.forEach((h, i) => {
    ops.push('BT /F1 8.5 Tf ' + colX + ' ' + y + ' Td (' + escapePdf(h) + ') Tj ET')
    colX += widths[i]
  })

  // Table rows
  rows.forEach((row, rowIndex) => {
    y -= 19
    if (y < 60) return // page overflow boundary

    // Alternating row background
    if (rowIndex % 2 === 1) {
      ops.push('0.98 0.98 0.99 rg 36 ' + (y - 4) + ' 523 18 re f')
    }

    colX = 46
    ops.push('0.2 0.25 0.3 rg')
    row.forEach((cell, i) => {
      ops.push('BT /F2 8 Tf ' + colX + ' ' + y + ' Td (' + escapePdf(String(cell)) + ') Tj ET')
      colX += widths[i]
    })

    // Sub-row line
    ops.push('0.88 0.9 0.93 RG 36 ' + (y - 4) + ' m 559 ' + (y - 4) + ' l S')
  })

  // Official Seal & Footer
  ops.push('0.85 0.88 0.92 RG 36 44 m 559 44 l S')
  ops.push('0.4 0.45 0.5 rg BT /F2 8 Tf 38 32 Td (Official Certified Record - Kanyakumari District Administration & Youth Department) Tj ET')
  ops.push('0.4 0.45 0.5 rg BT /F2 8 Tf 480 32 Td (Page 1 of 1) Tj ET')

  const stream = ops.join('\n')
  addObject('<< /Length ' + new Blob([stream]).size + ' >>\nstream\n' + stream + '\nendstream')

  // Generate XRef Table
  let offset = 9 // '%PDF-1.4\n'
  const xref: string[] = ['xref', '0 ' + (objects.length + 1), '0000000000 65535 f ']
  const bodyParts: string[] = ['%PDF-1.4']

  for (let i = 0; i < objects.length; i++) {
    const objStr = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
    xref.push(String(offset).padStart(10, '0') + ' 00000 n ')
    bodyParts.push(objStr)
    offset += new Blob([objStr]).size
  }

  const xrefStr = xref.join('\n') + '\n'
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`
  const pdfString = bodyParts.join('\n') + '\n' + xrefStr + trailer

  // Create native PDF Blob & trigger download
  const blob = new Blob([pdfString], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
