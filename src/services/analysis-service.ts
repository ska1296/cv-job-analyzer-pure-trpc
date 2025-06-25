import { extractTextFromPdf } from '../utils/pdf-parser';
import { analyzeWithAI } from './ai-service';
import { AnalysisInput, AnalysisOutput } from '../types/analysis';

export class AnalysisError extends Error {
    constructor(
        message: string,
        public code: 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR',
        public cause?: unknown
    ) {
        super(message);
        this.name = 'AnalysisError';
    }
}

export async function performAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
    // Convert base64 to buffers
    const jobDescriptionBuffer = Buffer.from(input.jobDescriptionPdf, 'base64');
    const cvBuffer = Buffer.from(input.cvPdf, 'base64');

    // Extract text from PDFs
    let jobDescriptionText: string;
    let cvText: string;

    try {
        jobDescriptionText = await extractTextFromPdf(jobDescriptionBuffer);
    } catch (error) {
        console.error('Failed to extract text from job description PDF:', error);
        throw new AnalysisError(
            'Could not extract text from job description PDF',
            'BAD_REQUEST',
            error
        );
    }

    try {
        cvText = await extractTextFromPdf(cvBuffer);
    } catch (error) {
        console.error('Failed to extract text from CV PDF:', error);
        throw new AnalysisError(
            'Could not extract text from CV PDF',
            'BAD_REQUEST',
            error
        );
    }

    // Validate extracted text
    if (!jobDescriptionText.trim()) {
        throw new AnalysisError(
            'Job description PDF contains no extractable text',
            'BAD_REQUEST'
        );
    }

    if (!cvText.trim()) {
        throw new AnalysisError(
            'CV PDF contains no extractable text',
            'BAD_REQUEST'
        );
    }

    // Analyze with AI
    let analysis;
    try {
        analysis = await analyzeWithAI(jobDescriptionText, cvText);
    } catch (error) {
        console.error('AI analysis failed:', error);
        throw new AnalysisError(
            'Failed to analyze documents with AI service',
            'INTERNAL_SERVER_ERROR',
            error
        );
    }

    // Return structured response
    return {
        analysis,
        metadata: {
            processedAt: new Date().toISOString(),
            jobDescriptionLength: jobDescriptionText.length,
            cvLength: cvText.length,
        },
    };
}
