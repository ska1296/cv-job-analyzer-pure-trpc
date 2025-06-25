import { inferAsyncReturnType } from '@trpc/server';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { IncomingMessage, ServerResponse } from 'http';

export const createContext = (opts?: NodeHTTPCreateContextFnOptions<IncomingMessage, ServerResponse>) => {
    return {
        req: opts?.req,
        res: opts?.res,
    };
};

export type Context = inferAsyncReturnType<typeof createContext>;