# CV and Job Description Analyzer

An AI-powered Node.js server with tRPC that analyzes CVs against job descriptions, providing detailed insights on candidate fit, strengths, and areas for improvement.

## 🚀 Features

- **PDF Analysis**: Extracts and analyzes text from PDF files
- **AI-Powered Insights**: Uses Gemini 1.5 Flash via custom endpoint for comprehensive candidate evaluation
- **tRPC Integration**: Type-safe API with excellent developer experience
- **Easy Testing**: Built-in test client and multiple testing methods
- **Robust Error Handling**: Comprehensive error management and validation
- **Base64 PDF Processing**: Accepts PDFs as base64 encoded strings via tRPC

## 📋 Requirements

- Node.js 18+
- npm
- Authorization token (required for AI analysis)

## 🛠️ Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone git@github.com:ska1296/cv-job-analyzer-pure-trpc.git
cd cv-job-analyzer-pure-trpc

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini authorization token (required)
GEMINI_AUTH_TOKEN=your_auth_token_here
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

### Built-in Test Client

```bash
# Run the built-in test client
npm run test-client
```

**How it works:**
- The test client reads `sample-job.pdf` and `sample-cv.pdf` from the project root directory
- PDFs are loaded from disk using `fs.readFileSync()` and converted to base64
- The client makes a tRPC call to the `/analyze` endpoint
- Results are displayed in the console

**To test with your own PDFs:**
1. Replace `sample-job.pdf` with your job description PDF
2. Replace `sample-cv.pdf` with your candidate's CV PDF
3. Run `npm run test-client`

**To modify the test client:**
- Edit `src/test-client.ts` to change file paths, add logging, or test different scenarios
- The client code shows exactly how to integrate tRPC calls into your application



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
├── router.ts          # tRPC router and procedures (thin layer)
├── context.ts         # tRPC context
├── services/
│   ├── analysis-service.ts  # Main business logic orchestration
│   └── ai-service.ts        # AI analysis logic
├── types/
│   └── analysis.ts          # TypeScript interfaces and Zod schemas
└── utils/
    └── pdf-parser.ts        # PDF text extraction
system-prompt.txt      # AI system role prompt (instructions & context)
user-prompt.txt        # AI user role prompt template (request format)
```

### Available Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run test-client # Run tRPC test client
```



## 🔍 How It Works

1. **PDF Input**: Server receives two PDF files via tRPC as base64 encoded strings
2. **Text Extraction**: Uses `pdf-parse` to extract text content from PDFs
3. **AI Analysis**: Sends extracted text to Gemini 1.5 Flash via custom endpoint for comprehensive analysis
4. **Response**: Returns structured analysis with scores, strengths, weaknesses, and recommendations

## 🔧 AI Service Configuration

This project uses a custom Gemini 1.5 Flash endpoint instead of Google's standard API:

- **Endpoint**: `https://intertest.woolf.engineering/invoke`
- **Format**: VertexAI GenerateContentRequest (official specification)
- **Rate Limits**: 20 requests/minute, 300 requests/hour
- **Authentication**: Authorization token without 'Bearer' prefix (provided separately)
- **Role-Based Prompts**: Uses `systemInstruction` and `contents` fields for optimal AI performance

The implementation follows the official VertexAI GenerateContentRequest specification exactly, using proper role separation with system instructions for the AI's role and user content for evaluation requests.

## 🎯 Analysis Criteria

The AI evaluates candidates based on:

- **Technical Skills**: Programming languages, frameworks, tools
- **Experience Relevance**: Industry experience, role similarity
- **Educational Background**: Degree relevance, certifications
- **Soft Skills**: Leadership, communication, teamwork indicators
- **Cultural Fit**: Values alignment, work style compatibility
- **Growth Potential**: Learning ability, career trajectory


## 📝 Customization

### Adding Custom Analysis Logic

To customize the AI evaluation criteria, edit the prompt files:

- **`system-prompt.txt`**: Contains the AI's role, instructions, and evaluation guidelines (used in `systemInstruction` field)
- **`user-prompt.txt`**: Contains the request format with placeholders for job description and CV content (used in `contents` array)

This role-based approach follows the official VertexAI GenerateContentRequest specification and provides better AI performance by properly separating system instructions from user requests.

You can also modify:
- `src/services/analysis-service.ts` to change the main business logic flow
- `src/services/ai-service.ts` to add additional AI processing logic or change the AI service configuration
- `src/types/analysis.ts` to modify input/output schemas and TypeScript interfaces

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
## 🆘 Troubleshooting

### Common Issues

**PDF parsing fails**
- Ensure PDF is not password protected
- Check if PDF contains extractable text (not just images)

**AI analysis returns errors**
- Verify Gemini authorization token is valid and properly set
- Check API usage limits (20 req/min, 300 req/hour)
- Ensure network connectivity to the custom endpoint

**PDF processing fails**
- Ensure file is a valid PDF with extractable text
- Check that base64 encoding is correct
- Verify PDFs are not password protected or corrupted



---

Happy analyzing! 🎉