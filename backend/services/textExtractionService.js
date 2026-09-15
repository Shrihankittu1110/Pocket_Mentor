import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Custom PDF page renderer that preserves page numbers and headings
 */
const customPageRender = async (pageData) => {
  try {
    const textContent = await pageData.getTextContent();
    let lastY = null;
    let text = '';
    
    for (const item of textContent.items) {
      if (lastY === null || Math.abs(lastY - item.transform[5]) < 2) {
        text += (text.length > 0 && !text.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    
    const pageNum = pageData.pageIndex + 1;
    return `\n\n--- [Page ${pageNum}] ---\n\n` + text;
  } catch {
    return `\n\n--- [Page ${pageData.pageIndex + 1}] ---\n\n`;
  }
};

export const extractTextFromFile = async (filePath, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();
  
  try {
    if (ext === '.txt' || ext === '.md' || ext === '.json' || ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.trim();
    }
    
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      try {
        const pdfData = await pdfParse(dataBuffer, { pagerender: customPageRender });
        if (pdfData && pdfData.text && pdfData.text.trim().length > 0) {
          return pdfData.text.trim();
        }
      } catch (pdfErr) {
        console.warn('Custom page render failed, falling back to standard pdfParse:', pdfErr.message);
      }
      const fallbackPdfData = await pdfParse(dataBuffer);
      return fallbackPdfData.text.trim();
    }
    
    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.trim();
    }

    // Default fallback read as utf-8
    const rawContent = fs.readFileSync(filePath, 'utf8');
    return rawContent.trim();
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error.message);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
};

