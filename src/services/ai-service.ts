import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config();

// Custom Gemini 1.5 Flash endpoint configuration
const GEMINI_ENDPOINT = 'https://intertest.woolf.engineering/invoke';
const AUTH_TOKEN = process.env.GEMINI_AUTH_TOKEN || '';

// VertexAI GenerateContentRequest interface
interface GenerateContentRequest {
    contents: Content[];
    systemInstruction?: string | Content;
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

function loadSystemPrompt(): string {
    try {
        const promptPath = path.join(process.cwd(), 'system-prompt.txt');
        return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
        console.error('Failed to load system prompt:', error);
        throw new Error('Could not load system prompt template');
    }
}

function loadUserPromptTemplate(): string {
    try {
        const promptPath = path.join(process.cwd(), 'user-prompt.txt');
        return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
        console.error('Failed to load user prompt template:', error);
        throw new Error('Could not load user prompt template');
    }
}

export async function analyzeWithAI(jobDescription: string, cv: string): Promise<AnalysisResult> {
    if (!AUTH_TOKEN) {
        throw new Error('GEMINI_AUTH_TOKEN is required for AI analysis');
    }

    // Load system and user prompts
    const systemPrompt = loadSystemPrompt();
    const userPromptTemplate = loadUserPromptTemplate();
    const userPrompt = userPromptTemplate
        .replace('{JOB_DESCRIPTION}', jobDescription)
        .replace('{CV}', cv);

    // Create VertexAI GenerateContentRequest following the official specification
    const requestBody: GenerateContentRequest = {
        systemInstruction: systemPrompt,
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: userPrompt
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
            'Authorization': `${AUTH_TOKEN}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
        console.error('Request headers:', {
            'Content-Type': 'application/json',
            'Authorization': `${AUTH_TOKEN.substring(0, 10)}...`,
        });
        console.error('Request body:', JSON.stringify(requestBody, null, 2));

        if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();

    // Extract content from VertexAI response format
    const content = (responseData as any)?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
        throw new Error('No response from Gemini AI service');
    }

    // Parse and validate the AI response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();

    let analysis: AnalysisResult;
    try {
        analysis = JSON.parse(cleanedContent) as AnalysisResult;
    } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.error('Raw response:', content);
        throw new Error('Invalid JSON response from Gemini AI service');
    }

    // Validate the response structure
    if (!analysis.candidateStrengths || !analysis.candidateWeaknesses || !analysis.summary) {
        throw new Error('Invalid response structure from AI');
    }

    // Ensure alignment score is within bounds
    analysis.alignmentScore = Math.max(0, Math.min(100, analysis.alignmentScore));

    return analysis;
}