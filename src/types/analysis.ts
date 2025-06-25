import { z } from 'zod';

// Input schema for analysis request
export const AnalysisInputSchema = z.object({
    jobDescriptionPdf: z.string().describe('Base64 encoded PDF'),
    cvPdf: z.string().describe('Base64 encoded PDF'),
});

// Output schema for analysis response
export const AnalysisOutputSchema = z.object({
    analysis: z.object({
        candidateStrengths: z.array(z.string()),
        candidateWeaknesses: z.array(z.string()),
        alignmentScore: z.number().min(0).max(100),
        keyMatches: z.array(z.string()),
        recommendations: z.array(z.string()),
        summary: z.string(),
    }),
    metadata: z.object({
        processedAt: z.string(),
        jobDescriptionLength: z.number(),
        cvLength: z.number(),
    }),
});

// TypeScript types derived from schemas
export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
export type AnalysisResult = z.infer<typeof AnalysisOutputSchema>['analysis'];
export type AnalysisMetadata = z.infer<typeof AnalysisOutputSchema>['metadata'];
