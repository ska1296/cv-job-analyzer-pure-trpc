import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export const createContext = (opts?: CreateExpressContextOptions) => {
    return {
        req: opts?.req,
        res: opts?.res,
    };
};

export type Context = inferAsyncReturnType<typeof createContext>;