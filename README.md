# CV and Job Description Analyzer

An AI-powered Node.js server with tRPC that analyzes CVs against job descriptions, providing detailed insights on candidate fit, strengths, and areas for improvement.

## 🚀 Features

- **PDF Analysis**: Extracts and analyzes text from PDF files
- **AI-Powered Insights**: Uses Gemini 1.5 Flash via custom endpoint for comprehensive candidate evaluation
- **tRPC Integration**: Type-safe API with excellent developer experience
- **Easy Testing**: Built-in test client and multiple testing methods
- **Robust Error Handling**: Comprehensive error management and validation
- **File Upload Support**: Handles multiple PDF uploads securely

## 📋 Requirements

- Node.js 18+
- npm or yarn
- Gemini 1.5 Flash authorization token (required for AI analysis)

## 🛠️ Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd cv-job-analyzer

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini authorization token (required)
# GEMINI_AUTH_TOKEN=your_auth_token_here
```

**Note**: The GEMINI_AUTH_TOKEN is required for the system to function.

### 3. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3000`

## 🧪 Testing the API

### Method 1: Test Client Script (Easiest)

```bash
# Run the built-in test client
npm run test-client
```

This will test the health endpoint and analyze sample PDFs if they exist in the root directory.

### Method 2: tRPC Client (Recommended)

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './src/router';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
});

// Use the client
const result = await client.analyze.mutate({
  jobDescriptionPdf: jobDescriptionBuffer,
  cvPdf: cvBuffer,
});
```

## 📊 API Response Format

The analysis returns a comprehensive evaluation:

```json
{
  "analysis": {
    "candidateStrengths": [
      "Strong technical background in required technologies",
      "Relevant industry experience",
      "Leadership and project management skills"
    ],
    "candidateWeaknesses": [
      "Limited experience with specific framework",
      "No cloud certification mentioned"
    ],
    "alignmentScore": 78,
    "keyMatches": [
      "JavaScript/TypeScript expertise",
      "React development experience",
      "API design and development"
    ],
    "recommendations": [
      "Interview to assess technical depth in React",
      "Evaluate cloud platform experience",
      "Discuss leadership experience in detail"
    ],
    "summary": "Strong candidate with 78% alignment. Technical skills match well with requirements. Recommended for technical interview."
  },
  "metadata": {
    "processedAt": "2024-01-15T10:30:00Z",
    "jobDescriptionLength": 2150,
    "cvLength": 3420
  }
}
```

## 🔧 Development

### Project Structure

```
src/
├── server.ts          # Main server setup
├── router.ts          # tRPC router and procedures
├── context.ts         # tRPC context
├── services/
│   └── ai-service.ts  # AI analysis logic
└── utils/
    └── pdf-parser.ts  # PDF text extraction
evaluation-prompt.txt  # AI evaluation prompt template
```

### Available Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run test-client # Run tRPC test client
```



## 🔍 How It Works

1. **PDF Upload**: Server receives two PDF files via tRPC as base64 encoded strings
2. **Text Extraction**: Uses `pdf-parse` to extract text content from PDFs
3. **AI Analysis**: Sends extracted text to Gemini 1.5 Flash via custom endpoint for comprehensive analysis
4. **Response**: Returns structured analysis with scores, strengths, weaknesses, and recommendations

## 🔧 AI Service Configuration

This project uses a custom Gemini 1.5 Flash endpoint instead of Google's standard API:

- **Endpoint**: `https://intertest.woolf.engineering/invoke`
- **Format**: VertexAI GenerateContentRequest
- **Rate Limits**: 20 requests/minute, 300 requests/hour
- **Authentication**: Bearer token (provided separately)

The implementation follows the VertexAI API specification for maximum compatibility.

## 🎯 Analysis Criteria

The AI evaluates candidates based on:

- **Technical Skills**: Programming languages, frameworks, tools
- **Experience Relevance**: Industry experience, role similarity
- **Educational Background**: Degree relevance, certifications
- **Soft Skills**: Leadership, communication, teamwork indicators
- **Cultural Fit**: Values alignment, work style compatibility
- **Growth Potential**: Learning ability, career trajectory

## 🚨 Error Handling

The system handles various error scenarios:

- Invalid PDF files
- Large file uploads (10MB limit)
- Missing or invalid authorization tokens
- Network issues with AI service
- Malformed requests

## 🔐 Security Considerations

- File size limits (10MB)
- PDF-only file type validation
- Memory-based file storage (no disk persistence)
- Input validation with Zod schemas
- Error message sanitization

## 📝 Customization

### Adding Custom Analysis Logic

To customize the AI evaluation criteria, edit the `evaluation-prompt.txt` file. This contains the prompt template sent to the AI service with placeholders for job description and CV content.

You can also modify `src/services/ai-service.ts` to add additional processing logic or change the AI service configuration.

### Extending the API

Add new procedures to `src/router.ts`:

```typescript
export const appRouter = router({
  analyze: /* existing procedure */,
  
  // New procedure example
  getAnalysisHistory: publicProcedure
    .query(() => {
      // Your logic here
    }),
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**PDF parsing fails**
- Ensure PDF is not password protected
- Check if PDF contains extractable text (not just images)

**AI analysis returns errors**
- Verify Gemini authorization token is valid and properly set
- Check API usage limits (20 req/min, 300 req/hour)
- Ensure network connectivity to the custom endpoint

**File upload fails**
- Check file size (max 10MB)
- Ensure file is a valid PDF
- Verify correct form field names

### Getting Help

- Check the console output for detailed error messages
- Test with the health endpoint: `http://localhost:3000/health`
- Use the web interface for easier debugging

---

Happy analyzing! 🎉