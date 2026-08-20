const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docxPath = path.join(__dirname, 'agent-data', 'Financially-Up-ERP-RBAC-Specification.docx');
const tempDir = path.join(__dirname, 'agent-data', 'temp_docx');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Unzip using tar or powershell Expand-Archive
try {
  execSync(`tar -xf "${docxPath}" -C "${tempDir}"`);
  console.log('Unzipped docx using tar');
} catch (e) {
  execSync(`powershell -Command "Expand-Archive -Path '${docxPath}' -DestinationPath '${tempDir}' -Force"`);
  console.log('Unzipped docx using powershell');
}

const docXmlPath = path.join(tempDir, 'word', 'document.xml');
if (fs.existsSync(docXmlPath)) {
  const xml = fs.readFileSync(docXmlPath, 'utf8');
  // Extract paragraphs and tables
  const paragraphs = xml.match(/<w:p[\s>].*?<\/w:p>/gs) || [];
  const textLines = paragraphs.map(p => {
    const texts = p.match(/<w:t[\s>].*?<\/w:t>/gs) || [];
    return texts.map(t => t.replace(/<[^>]+>/g, '')).join('');
  }).filter(line => line.trim().length > 0);

  const fullText = textLines.join('\n\n');
  fs.writeFileSync(path.join(__dirname, 'agent-data', 'rbac_spec.md'), fullText, 'utf8');
  console.log('Extracted successfully! Length:', fullText.length);
} else {
  console.error('document.xml not found');
}
