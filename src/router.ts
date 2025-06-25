import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context';
import { extractTextFromPdf } from './utils/pdf-parser';
import { analyzeWithAI } from './services/ai-service';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
    analyze: publicProcedure
        .input(z.object({
            jobDescriptionPdf: z.string().describe('Base64 encoded PDF'),
            cvPdf: z.string().describe('Base64 encoded PDF'),
        }))
        .output(z.object({
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
        }))
        .mutation(async ({ input }) => {
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
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Could not extract text from job description PDF',
                    cause: error,
                });
            }

            try {
                cvText = await extractTextFromPdf(cvBuffer);
            } catch (error) {
                console.error('Failed to extract text from CV PDF:', error);
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Could not extract text from CV PDF',
                    cause: error,
                });
            }

            if (!jobDescriptionText.trim()) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Job description PDF contains no extractable text',
                });
            }

            if (!cvText.trim()) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'CV PDF contains no extractable text',
                });
            }

            // Analyze with AI
            let analysis;
            try {
                analysis = await analyzeWithAI(jobDescriptionText, cvText);
            } catch (error) {
                console.error('AI analysis failed:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to analyze documents with AI service',
                    cause: error,
                });
            }

            return {
                analysis,
                metadata: {
                    processedAt: new Date().toISOString(),
                    jobDescriptionLength: jobDescriptionText.length,
                    cvLength: cvText.length,
                },
            };
        }),
});

export type AppRouter = typeof appRouter;