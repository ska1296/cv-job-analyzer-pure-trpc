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
            try {
                // Convert base64 to buffers
                const jobDescriptionBuffer = Buffer.from(input.jobDescriptionPdf, 'base64');
                const cvBuffer = Buffer.from(input.cvPdf, 'base64');

                // Extract text from PDFs
                const jobDescriptionText = await extractTextFromPdf(jobDescriptionBuffer);
                const cvText = await extractTextFromPdf(cvBuffer);

                if (!jobDescriptionText.trim()) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Could not extract text from job description PDF',
                    });
                }

                if (!cvText.trim()) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Could not extract text from CV PDF',
                    });
                }

                // Analyze with AI
                const analysis = await analyzeWithAI(jobDescriptionText, cvText);

                return {
                    analysis,
                    metadata: {
                        processedAt: new Date().toISOString(),
                        jobDescriptionLength: jobDescriptionText.length,
                        cvLength: cvText.length,
                    },
                };
            } catch (error) {
                console.error('Analysis error:', error);

                if (error instanceof TRPCError) {
                    throw error;
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to analyze documents',
                    cause: error,
                });
            }
        }),
});

export type AppRouter = typeof appRouter;