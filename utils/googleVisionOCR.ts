import * as FileSystem from 'expo-file-system';

const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';

interface GoogleVisionResponse {
  responses: {
    textAnnotations?: {
      description: string;
      locale?: string;
    }[];
    error?: {
      code: number;
      message: string;
      status: string;
    };
  }[];
}

export interface OCRResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Performs OCR on an image using Google Cloud Vision API
 * @param imageUri - Local file URI or remote URL of the image
 * @returns OCRResult with extracted text
 */
export async function recognizeText(imageUri: string): Promise<OCRResult> {
  try {
    if (!GOOGLE_CLOUD_VISION_API_KEY) {
      return {
        text: '',
        success: false,
        error: 'Google Vision API key is not configured. Please set EXPO_PUBLIC_GOOGLE_VISION_API_KEY in your .env file.',
      };
    }

    // Convert image to base64
    const base64Image = await getBase64FromUri(imageUri);

    if (!base64Image) {
      return {
        text: '',
        success: false,
        error: 'Failed to read image file',
      };
    }

    // Call Google Cloud Vision API
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        text: '',
        success: false,
        error: `API request failed: ${response.status} - ${errorText}`,
      };
    }

    const data: GoogleVisionResponse = await response.json();

    // Check for API errors
    if (data.responses[0]?.error) {
      const error = data.responses[0].error;
      return {
        text: '',
        success: false,
        error: `Google Vision API error: ${error.message}`,
      };
    }

    // Extract text from response
    const textAnnotations = data.responses[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        text: '',
        success: false,
        error: 'No text detected in the image',
      };
    }

    // The first annotation contains all the text
    const extractedText = textAnnotations[0].description;

    return {
      text: extractedText,
      success: true,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Converts an image URI to base64 string
 * @param uri - Local file URI or remote URL
 * @returns Base64 encoded image string (without data:image prefix)
 */
async function getBase64FromUri(uri: string): Promise<string | null> {
  try {
    // If it's a remote URL, fetch and convert
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data:image/xxx;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // For local files, use FileSystem
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}
