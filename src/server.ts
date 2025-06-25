import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';
import { appRouter } from './router';
import { createContext } from './context';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

// Create pure tRPC server
const server = createHTTPServer({
    middleware: cors(),
    router: appRouter,
    createContext,
});

server.listen(PORT);

console.log(`🚀 Pure tRPC Server running on http://localhost:${PORT}`);
console.log(`🔌 Single API endpoint: http://localhost:${PORT}/analyze`);
console.log('Available procedure:');
console.log('  - analyze (mutation): Accepts job description and CV PDFs');