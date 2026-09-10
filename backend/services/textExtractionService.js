import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const extractTextFromFile = async (filePath, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();
  
  try {
    if (ext === '.txt' || ext === '.md' || ext === '.json' || ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.trim();
    }
    
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text.trim();
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
