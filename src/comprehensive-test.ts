// Comprehensive test suite for CV Job Analyzer with error handling
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

// Helper function to create a simple PDF-like buffer (for testing invalid PDFs)
function createInvalidPdf(): string {
    return Buffer.from('This is not a valid PDF file content').toString('base64');
}

// Helper function to create empty content
function createEmptyPdf(): string {
    return Buffer.from('').toString('base64');
}

// Helper function to run a test case
async function runTestCase(testName: string, testFn: () => Promise<void>) {
    console.log(`\n🧪 ${testName}`);
    console.log('─'.repeat(50));
    try {
        await testFn();
    } catch (error: any) {
        console.log(`❌ Expected Error: ${error.message}`);
        if (error.data?.code) {
            console.log(`📋 Error Code: ${error.data.code}`);
        }
    }
}

async function testSuccessCase() {
    console.log('\n✅ SUCCESS CASE: Valid PDF Analysis');
    console.log('═'.repeat(50));
    
    if (fs.existsSync('sample-job.pdf') && fs.existsSync('sample-cv.pdf')) {
        const jobPdfBase64 = fs.readFileSync('sample-job.pdf').toString('base64');
        const cvPdfBase64 = fs.readFileSync('sample-cv.pdf').toString('base64');

        const result = await client.analyze.mutate({
            jobDescriptionPdf: jobPdfBase64,
            cvPdf: cvPdfBase64,
        });

        console.log('✅ Analysis completed successfully!');
        console.log(`📊 Alignment Score: ${result.analysis.alignmentScore}/100`);
        console.log(`📝 Strengths: ${result.analysis.candidateStrengths.length} items`);
        console.log(`⚠️  Weaknesses: ${result.analysis.candidateWeaknesses.length} items`);
        console.log(`🎯 Key Matches: ${result.analysis.keyMatches.length} items`);
        console.log(`💡 Recommendations: ${result.analysis.recommendations.length} items`);
        console.log(`📄 Job Description Length: ${result.metadata.jobDescriptionLength} chars`);
        console.log(`📄 CV Length: ${result.metadata.cvLength} chars`);
        console.log(`⏰ Processed At: ${result.metadata.processedAt}`);
    } else {
        console.log('⚠️  Sample PDFs not found - skipping success test');
    }
}

async function testErrorCases() {
    console.log('\n❌ ERROR CASES: Testing Failure Scenarios');
    console.log('═'.repeat(50));

    // Test Case 1: Invalid input validation
    await runTestCase('Invalid Input - Missing jobDescriptionPdf', async () => {
        await client.analyze.mutate({
            jobDescriptionPdf: '',
            cvPdf: createInvalidPdf(),
        } as any);
    });

    // Test Case 2: Invalid input validation
    await runTestCase('Invalid Input - Missing cvPdf', async () => {
        await client.analyze.mutate({
            jobDescriptionPdf: createInvalidPdf(),
            cvPdf: '',
        } as any);
    });

    // Test Case 3: Invalid PDF format
    await runTestCase('Invalid PDF Format - Job Description', async () => {
        await client.analyze.mutate({
            jobDescriptionPdf: createInvalidPdf(),
            cvPdf: fs.existsSync('sample-cv.pdf') 
                ? fs.readFileSync('sample-cv.pdf').toString('base64')
                : createInvalidPdf(),
        });
    });

    // Test Case 4: Invalid PDF format
    await runTestCase('Invalid PDF Format - CV', async () => {
        await client.analyze.mutate({
            jobDescriptionPdf: fs.existsSync('sample-job.pdf') 
                ? fs.readFileSync('sample-job.pdf').toString('base64')
                : createInvalidPdf(),
            cvPdf: createInvalidPdf(),
        });
    });

    // Test Case 5: Empty PDF content
    await runTestCase('Empty PDF Content', async () => {
        await client.analyze.mutate({
            jobDescriptionPdf: createEmptyPdf(),
            cvPdf: createEmptyPdf(),
        });
    });

    // Test Case 6: Invalid base64 encoding
    await runTestCase('Invalid Base64 Encoding', async () => {
        await client.analyze.mutate({
            jobDescriptionPdf: 'invalid-base64-content!!!',
            cvPdf: 'another-invalid-base64!!!',
        });
    });

    // Test Case 7: Extremely large input (if you want to test size limits)
    await runTestCase('Large Input Test', async () => {
        const largeContent = 'A'.repeat(1000000); // 1MB of 'A' characters
        const largeBase64 = Buffer.from(largeContent).toString('base64');
        
        await client.analyze.mutate({
            jobDescriptionPdf: largeBase64,
            cvPdf: largeBase64,
        });
    });

    // Test Case 8: Type validation (wrong data types)
    await runTestCase('Type Validation - Non-string Input', async () => {
        await client.analyze.mutate({
            jobDescriptionPdf: 123 as any,
            cvPdf: { invalid: 'object' } as any,
        });
    });
}

async function testServerConnectivity() {
    console.log('\n🌐 CONNECTIVITY TESTS');
    console.log('═'.repeat(50));

    // Test server is running
    try {
        console.log('🔍 Testing server connectivity...');
        const testResult = await client.analyze.mutate({
            jobDescriptionPdf: createInvalidPdf(),
            cvPdf: createInvalidPdf(),
        });
        console.log('✅ Server is responding (even if request fails)');
    } catch (error: any) {
        if (error.message.includes('fetch')) {
            console.log('❌ Server connectivity issue - is the server running on port 3000?');
        } else {
            console.log('✅ Server is responding (request processed, expected error occurred)');
        }
    }
}

async function runComprehensiveTests() {
    console.log('🚀 CV Job Analyzer - Comprehensive Test Suite');
    console.log('═'.repeat(60));
    console.log('Testing both success and failure scenarios...\n');

    try {
        // Test server connectivity first
        await testServerConnectivity();

        // Test success case
        await testSuccessCase();

        // Test various error scenarios
        await testErrorCases();

        console.log('\n🎉 TEST SUITE COMPLETED');
        console.log('═'.repeat(50));
        console.log('✅ All test cases executed');
        console.log('💡 Check the results above to verify error handling');
        console.log('🔧 The system should gracefully handle all error scenarios');

    } catch (error) {
        console.error('\n💥 Unexpected error in test suite:', error);
    }
}

// Run the comprehensive test suite
runComprehensiveTests();
