// Custom Gemini 1.5 Flash endpoint configuration
const GEMINI_ENDPOINT = 'https://intertest.woolf.engineering/invoke';
const AUTH_TOKEN = process.env.GEMINI_AUTH_TOKEN || '';

// VertexAI GenerateContentRequest interface
interface GenerateContentRequest {
    contents: Content[];
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
}

interface Content {
    role: string;
    parts: Part[];
}

interface Part {
    text: string;
}

interface GenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
}

interface SafetySetting {
    category: string;
    threshold: string;
}

export interface AnalysisResult {
    candidateStrengths: string[];
    candidateWeaknesses: string[];
    alignmentScore: number;
    keyMatches: string[];
    recommendations: string[];
    summary: string;
}

export async function analyzeWithAI(jobDescription: string, cv: string): Promise<AnalysisResult> {
    if (!AUTH_TOKEN) {
        // Fallback to mock analysis if no auth token is provided
        console.log('No GEMINI_AUTH_TOKEN provided, using mock analysis');
        return mockAnalysis(jobDescription, cv);
    }

    try {
        const prompt = `
You are an expert HR analyst. Analyze the following job description and CV/resume, then provide a comprehensive evaluation.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE CV/RESUME:
${cv}

Please analyze and provide a response in the following JSON format:
{
  "candidateStrengths": ["strength1", "strength2", ...],
  "candidateWeaknesses": ["weakness1", "weakness2", ...],
  "alignmentScore": 85,
  "keyMatches": ["match1", "match2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "summary": "Overall assessment summary"
}

Focus on:
1. Technical skills alignment
2. Experience relevance
3. Educational background fit
4. Cultural/role alignment indicators
5. Growth potential

Provide specific, actionable insights. The alignment score should be 0-100 based on how well the candidate matches the job requirements.

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no explanations, just the JSON object.
`;

        // Create VertexAI GenerateContentRequest
        const requestBody: GenerateContentRequest = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                topP: 0.8,
                topK: 40
            }
        };

        // Make request to custom Gemini endpoint
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API error (${response.status}):`, errorText);

            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();

        // Extract content from VertexAI response format
        const content = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error('No response from Gemini AI service');
        }

        try {
            // Clean the response in case there's any markdown formatting
            const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const analysis = JSON.parse(cleanedContent) as AnalysisResult;

            // Validate the response structure
            if (!analysis.candidateStrengths || !analysis.candidateWeaknesses || !analysis.summary) {
                throw new Error('Invalid response structure from AI');
            }

            // Ensure alignment score is within bounds
            analysis.alignmentScore = Math.max(0, Math.min(100, analysis.alignmentScore));

            return analysis;
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            console.error('Raw response:', content);
            throw new Error('Invalid JSON response from Gemini AI service');
        }
    } catch (error) {
        console.error('Gemini AI analysis error:', error);

        if (error instanceof Error && (
            error.message.includes('Rate limit') ||
            error.message.includes('auth') ||
            error.message.includes('token') ||
            error.message.includes('401') ||
            error.message.includes('403')
        )) {
            throw error; // Re-throw auth/rate limit errors
        }

        // Fallback to mock analysis on other AI service errors
        console.log('Falling back to mock analysis due to Gemini AI service error');
        return mockAnalysis(jobDescription, cv);
    }
}

function mockAnalysis(jobDescription: string, cv: string): AnalysisResult {
    // Simple keyword matching for mock analysis
    const jobKeywords = extractKeywords(jobDescription.toLowerCase());
    const cvKeywords = extractKeywords(cv.toLowerCase());

    const matches = jobKeywords.filter(keyword =>
        cvKeywords.some(cvKeyword => cvKeyword.includes(keyword) || keyword.includes(cvKeyword))
    );

    const alignmentScore = Math.min(95, Math.max(15, (matches.length / jobKeywords.length) * 100));

    return {
        candidateStrengths: [
            'Relevant technical skills identified',
            'Professional experience documented',
            'Educational background present',
            'Career progression shown'
        ],
        candidateWeaknesses: [
            'Some skill gaps may exist',
            'Specific domain experience needs verification',
            'Certification status unclear'
        ],
        alignmentScore: Math.round(alignmentScore),
        keyMatches: matches.slice(0, 5),
        recommendations: [
            'Interview to assess technical depth',
            'Verify specific technology experience',
            'Evaluate cultural fit',
            'Discuss career goals and motivation'
        ],
        summary: `The candidate shows ${alignmentScore > 70 ? 'strong' : alignmentScore > 50 ? 'moderate' : 'limited'} alignment with the job requirements. ${matches.length} key skills/requirements match. Recommended for ${alignmentScore > 70 ? 'interview' : alignmentScore > 50 ? 'further evaluation' : 'consideration with reservations'}.`
    };
}

function extractKeywords(text: string): string[] {
    // Simple keyword extraction for mock analysis
    const commonSkills = [
        'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
        'kubernetes', 'git', 'api', 'database', 'frontend', 'backend', 'fullstack',
        'agile', 'scrum', 'testing', 'ci/cd', 'devops', 'cloud', 'microservices',
        'typescript', 'angular', 'vue', 'mongodb', 'postgresql', 'redis', 'nginx'
    ];

    return commonSkills.filter(skill => text.includes(skill));
}