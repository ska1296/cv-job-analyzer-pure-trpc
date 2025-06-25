// Test client for pure tRPC server
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import fs from 'fs';
import type { AppRouter } from './router';

const client = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({
            url: 'http://localhost:3000',
        }),
    ],
});

async function testAnalysis() {
    try {
        console.log('🔍 Testing analyze endpoint...');

        // Test with sample files if they exist
        if (fs.existsSync('sample-job.pdf') && fs.existsSync('sample-cv.pdf')) {
            console.log('\n📄 Testing PDF analysis...');

            const jobPdfBase64 = fs.readFileSync('sample-job.pdf').toString('base64');
            const cvPdfBase64 = fs.readFileSync('sample-cv.pdf').toString('base64');

            const result = await client.analyze.mutate({
                jobDescriptionPdf: jobPdfBase64,
                cvPdf: cvPdfBase64,
            });

            console.log('✅ Analysis Result:');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('\n⚠️  No sample PDFs found. Place sample-job.pdf and sample-cv.pdf in the root directory to test analysis.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testAnalysis();