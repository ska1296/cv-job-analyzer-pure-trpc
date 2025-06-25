import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import { performAnalysis, AnalysisError } from './services/analysis-service';
import { AnalysisInputSchema, AnalysisOutputSchema } from './types/analysis';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
    analyze: publicProcedure
        .input(AnalysisInputSchema)
        .output(AnalysisOutputSchema)
        .mutation(async ({ input }) => {
            try {
                return await performAnalysis(input);
            } catch (error) {
                if (error instanceof AnalysisError) {
                    throw new TRPCError({
                        code: error.code,
                        message: error.message,
                        cause: error.cause,
                    });
                }

               // Handle unexpected errors
                console.error('Unexpected error in analysis:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred during analysis',
                    cause: error,
                });
            }
        }),
});

export type AppRouter = typeof appRouter;