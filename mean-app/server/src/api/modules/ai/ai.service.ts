// src/api/modules/ai/ai.service.ts
import { DEFAULT_ALLOWED_CATEGORIES, type AiModelResponse } from './ai.model.js';

/**
 * Clean model output by removing markdown code block ticks if present.
 */
function extractJsonString(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  }
  return cleaned;
}

/**
 * Categorize a transaction description using Google Gemini API.
 */
export async function suggestCategory(
  description: string,
  allowedCategories: string[] = DEFAULT_ALLOWED_CATEGORIES,
  type?: string,
  amount?: number
): Promise<AiModelResponse> {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured');
  }

  const promptInstructions = `You are a financial classification assistant for the TaxPal personal finance app.
Classify the following transaction into exactly ONE category from this allowed list:
${allowedCategories.join(', ')}

Transaction Details:
Description: "${description}"
${type ? `Type: ${type}` : ''}
${amount !== undefined ? `Amount: ${amount}` : ''}

Rules:
1. Respond ONLY with a valid JSON object matching:
{"category": "<one_of_allowed_categories>", "confidence": <float_between_0_and_1>}
2. Do NOT output markdown code fences, backticks, or commentary.
3. If uncertain, choose the closest allowed category or "Other".`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptInstructions }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`AI service responded with status ${response.status}: ${errorText.slice(0, 100)}`);
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Malformed or empty response received from AI model');
    }

    const cleanedJson = extractJsonString(candidateText);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      throw new Error('Failed to parse AI output as JSON');
    }

    if (!parsed || typeof parsed !== 'object' || typeof parsed.category !== 'string') {
      throw new Error('AI response is missing required "category" string property');
    }

    // Match against allowed categories (case-insensitive)
    const normalizedMatch = allowedCategories.find(
      (c) => c.toLowerCase() === parsed.category.trim().toLowerCase()
    );

    const category = normalizedMatch || 'Other';
    let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.75;
    if (isNaN(confidence) || confidence < 0) confidence = 0.5;
    if (confidence > 1) confidence = 1.0;

    return {
      category,
      confidence: Math.round(confidence * 100) / 100
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI service request timed out');
    }
    throw err;
  }
}
