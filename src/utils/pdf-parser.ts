import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}