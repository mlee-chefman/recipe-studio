import { decode } from 'html-entities';
import { callGeminiAPI, isApiKeyConfigured } from '@services/helpers/geminiApi';
import { extractJSON } from '@services/helpers/recipeParser';
import {
  INSTRUCTION_SPLIT_THRESHOLDS,
  INSTRUCTION_SPLIT_CONFIG,
  INSTRUCTION_SPLIT_PROMPT,
} from '@utils/constants/instructionSplitting';

/**
 * Decode HTML entities using the html-entities library
 */
const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  return decode(text);
};

/**
 * Check if instructions need to be split based on length and count
 *
 * @param instructions - Array of instruction strings
 * @returns true if instructions should be split using Gemini
 */
export const shouldSplitInstructions = (instructions: string[]): boolean => {
  // If we have no instructions, can't split
  if (instructions.length === 0) return false;

  const { LONG_INSTRUCTION_CHARS, VERY_LONG_INSTRUCTION_CHARS, MAX_INSTRUCTIONS_TO_SPLIT } =
    INSTRUCTION_SPLIT_THRESHOLDS;

  // If we have only 1-2 instructions and any is very long (>500 chars), we should split
  if (instructions.length <= 2) {
    return instructions.some(inst => inst.length > LONG_INSTRUCTION_CHARS);
  }

  // If we have 3 instructions and at least one is extremely long (>800 chars), we should split
  if (instructions.length === MAX_INSTRUCTIONS_TO_SPLIT) {
    return instructions.some(inst => inst.length > VERY_LONG_INSTRUCTION_CHARS);
  }

  return false;
};

/**
 * Use Gemini AI to intelligently split a large instruction block into logical steps
 *
 * @param instructions - Array of instruction strings (potentially one large block)
 * @returns Array of split instruction steps, or original instructions if splitting fails
 */
export const splitInstructionsWithGemini = async (
  instructions: string[]
): Promise<string[]> => {
  try {
    // Check if API key is configured
    if (!isApiKeyConfigured()) {
      console.log('Gemini API key not configured, skipping instruction splitting');
      return instructions;
    }

    // Combine all instructions into one text block
    const combinedText = instructions.join('\n\n');

    // Generate the prompt using the template
    const prompt = INSTRUCTION_SPLIT_PROMPT(combinedText);

    console.log('Calling Gemini to split instructions...');
    const response = await callGeminiAPI(prompt, {
      temperature: INSTRUCTION_SPLIT_CONFIG.TEMPERATURE,
      maxOutputTokens: INSTRUCTION_SPLIT_CONFIG.MAX_OUTPUT_TOKENS,
      timeout: INSTRUCTION_SPLIT_CONFIG.TIMEOUT_MS,
    });

    // Check for API errors
    if (response.error) {
      console.error('Gemini API error:', response.error);
      return instructions;
    }

    if (!response.candidates || response.candidates.length === 0) {
      console.error('No candidates in Gemini response');
      return instructions;
    }

    // Extract and parse the response
    const responseText = response.candidates[0].content.parts[0].text;
    const jsonText = extractJSON(responseText);
    const splitSteps = JSON.parse(jsonText);

    // Validate the response is an array with content
    if (Array.isArray(splitSteps) && splitSteps.length > 0) {
      console.log(
        `Successfully split ${instructions.length} instructions into ${splitSteps.length} steps`
      );
      return splitSteps.map(step => decodeHtmlEntities(step.trim())).filter(Boolean);
    }

    return instructions;
  } catch (error) {
    console.error('Failed to split instructions with Gemini:', error);
    return instructions;
  }
};

/**
 * Process instructions: decode HTML entities and optionally split using Gemini
 *
 * @param instructions - Raw instruction strings
 * @param enableGeminiSplitting - Whether to use Gemini for splitting large blocks
 * @returns Processed instruction array
 */
export const processInstructions = async (
  instructions: string[],
  enableGeminiSplitting: boolean = true
): Promise<string[]> => {
  // First, ensure all instructions are decoded
  let processedInstructions = instructions.map(inst => decodeHtmlEntities(inst.trim())).filter(Boolean);

  // Check if we should split using Gemini
  if (enableGeminiSplitting && shouldSplitInstructions(processedInstructions)) {
    console.log('Detected large instruction block, attempting to split with Gemini...');
    processedInstructions = await splitInstructionsWithGemini(processedInstructions);
  }

  return processedInstructions;
};
