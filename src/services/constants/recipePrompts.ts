/**
 * Creates a detailed prompt for generating a recipe from a description
 */
export function createRecipeGenerationPrompt(description: string): string {
  return `You are a professional chef and recipe creator. Your task is to create a complete, detailed recipe based on the user's description.

User's request: "${description}"

Please create a delicious recipe that matches this description. The recipe should be practical, clear, and easy to follow.

Return a JSON object with the following structure:

{
  "title": "Recipe title",
  "description": "A brief, appetizing description of the dish (1-2 sentences)",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "steps": [{"text": "step 1"}, {"text": "step 2"}, ...],
  "cookTime": 30,
  "prepTime": 15,
  "servings": 4,
  "category": "category name (e.g., Main Course, Dessert, etc.)",
  "tags": ["tag1", "tag2", "tag3"],
  "notes": "Any helpful tips, variations, or serving suggestions"
}

Guidelines:
1. **Title**: Create a clear, appetizing title that matches the request
2. **Description**: Write 1-2 sentences describing the dish and why it's delicious
3. **Ingredients**: List all ingredients with specific quantities and units (e.g., "2 cups flour", "1 lb pork chops", "1/3 cup milk"). Use fractions (1/2, 1/3, 1/4) instead of decimals for measurements
4. **Steps**: Write clear, numbered steps in chronological order as objects with a "text" field. Be specific about temperatures, times, and techniques. For meat dishes (especially steaks, roasts, or large cuts), include internal temperature targets and mention if the meat should be removed at a lower temperature to rest (e.g., "Cook until internal temperature reaches 130°F, then remove and let rest 5-10 minutes")
5. **Times**: Provide realistic prep time and cook time in minutes
6. **Servings**: Specify number of servings (typically 4-6)
7. **Category**: Choose the most appropriate category (e.g., Main Course, Dessert, Appetizer, etc.)
8. **Tags**: Add 2-5 relevant tags (e.g., "Quick", "Healthy", "Vegetarian", "Spicy", "Italian", "Kid-Friendly", "Gluten-Free", etc.)
9. **Notes**: Include helpful tips, substitutions, or serving suggestions. For large meat dishes, mention resting time and carryover cooking if applicable

Important:
- Make the recipe practical and achievable for home cooks
- Use common ingredients when possible
- Be specific about cooking temperatures and times
- If the request is vague (like "simple pork chop"), create a straightforward, beginner-friendly version
- Return ONLY valid JSON, no additional text
- Make sure the JSON is properly formatted and can be parsed

Return the recipe as JSON:`;
}

/**
 * Creates a detailed prompt for parsing a single recipe from OCR text
 */
export function createRecipeParsingPrompt(ocrText: string): string {
  return `You are a recipe parsing assistant. Your task is to extract and organize recipe information from OCR-extracted text.

The text below was extracted from a recipe image using OCR. It may contain errors, inconsistent formatting, or incomplete information.

Please parse this text and return a JSON object with the following structure:

{
  "title": "Recipe title",
  "description": "Brief description or summary (if available, otherwise empty string)",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": [{"text": "step 1"}, {"text": "step 2"}, ...],
  "cookTime": 30,
  "prepTime": 15,
  "servings": 4,
  "category": "category name (e.g., Dessert, Main Course, etc.)",
  "tags": ["tag1", "tag2", "tag3"],
  "notes": "Any additional notes, tips, or variations mentioned (if available, otherwise empty string)"
}

Guidelines:
1. **Title**: Extract the recipe name. If unclear, use "Untitled Recipe"
2. **Description**: Include any description, intro text, or summary about the dish
3. **Ingredients**: Parse into a clean array. Include quantities and units. Each ingredient should be a separate string. Use fractions (1/2, 1/3, 1/4) instead of decimals for measurements (e.g., "1/3 cup" not "0.33 cup")
4. **Instructions**: Parse into numbered steps. Each step should be a separate string. Organize chronologically. Preserve any mentions of internal temperatures, remove temperatures, or resting times (e.g., "remove at 160°F", "let rest 10 minutes")
5. **Times**: Extract prep time and cook time in minutes. If not specified, use reasonable defaults (prepTime: 15, cookTime: 30)
6. **Servings**: Extract number of servings. If not specified, default to 4
7. **Category**: Infer category from the recipe (e.g., "Dessert", "Main Course", "Appetizer", "Soup", "Salad", "Breakfast", etc.)
8. **Tags**: Infer 2-5 relevant tags based on the recipe (e.g., "Quick", "Vegetarian", "Italian", "Spicy", "Kid-Friendly", "Healthy", etc.)
9. **Notes**: Include any tips, variations, storage instructions, or additional notes. Preserve any mentions of resting time or carryover cooking for meat dishes

Important:
- Fix obvious OCR errors (e.g., "1 cuρ" → "1 cup")
- Organize instructions as clear, sequential steps
- If information is missing, use reasonable defaults
- Return ONLY valid JSON, no additional text
- Make sure the JSON is properly formatted and can be parsed

OCR Text:
"""
${ocrText}
"""

Return the parsed recipe as JSON:`;
}

/**
 * Creates a prompt for parsing multiple recipes from a large text block
 */
export function createMultiRecipeParsingPrompt(text: string): string {
  return `You are a recipe parsing assistant specialized in extracting multiple recipes from text blocks, PDF cookbooks, or personal notes.

CRITICAL: You MUST extract EVERY SINGLE RECIPE in the text. Do not stop early. Count all recipes first, then extract all of them.

Your task is to:
1. Carefully scan the ENTIRE text to identify ALL recipes (look for recipe titles, ingredients lists, instructions)
2. Parse EVERY recipe into a structured format - don't stop at 10 or 15, continue until you've processed the entire text
3. Return an array containing ALL recipe objects found

The text may contain:
- Multiple recipes from a cookbook (could be 20, 30, or more recipes)
- Recipes with informal formatting from personal notes
- Mixed content (stories, tips, storage guides) - extract only the recipes
- Table of contents - use this to verify you found all recipes

For each recipe found, return a JSON object with this structure:

{
  "title": "Recipe title",
  "description": "Brief description (if available)",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": [{"text": "step 1"}, {"text": "step 2"}, ...],
  "cookTime": 30,
  "prepTime": 15,
  "servings": 4,
  "category": "category name",
  "tags": ["tag1", "tag2", "tag3"],
  "notes": "Any additional notes or tips"
}

Guidelines:
1. **Identify recipe boundaries**: Look for recipe titles, "Ingredients", "Steps" headers
2. **Title**: Extract or create a descriptive title for each recipe
3. **Ingredients**: Parse into clean array with quantities and units. Use fractions (1/2, 1/3, 1/4) instead of decimals for measurements (e.g., "1/3 cup" not "0.33 cup")
4. **Steps**: Break into clear, sequential steps as objects with a "text" field. Preserve any mentions of internal temperatures, remove temperatures, or resting times for meat dishes
5. **Times**: Extract or estimate reasonable times in minutes
6. **Servings**: Extract or default to 4
7. **Category**: Infer from recipe type (e.g., "Main Course", "Dessert", "Appetizer")
8. **Tags**: Infer 2-5 relevant tags (e.g., "Quick", "Vegetarian", "Italian", "Spicy", "American", "French", "Healthy", etc.)
9. **Notes**: Include any tips, variations, or serving suggestions. Preserve any mentions of resting time or carryover cooking for meat dishes

Important:
- Return an array of recipe objects: [recipe1, recipe2, ...]
- If only one recipe is found, return an array with one item
- Clean up formatting errors and fix obvious mistakes
- Skip non-recipe content (introductions, stories, storage guides, cooking tools lists, etc.)
- If a recipe is incomplete, fill in reasonable defaults
- Return ONLY valid JSON array, no additional text
- Make sure the JSON is properly formatted
- DO NOT STOP until you have processed the ENTIRE text and extracted ALL recipes
- If you see a table of contents with 27 recipes, you must return 27 recipes in the array

Text to parse:
"""
${text}
"""

IMPORTANT: Extract ALL recipes from the text above. Do not stop after 10-15 recipes. Continue processing until you reach the end of the text.

Return the recipes as a JSON array:`;
}

/**
 * Creates a prompt for analyzing cooking actions in a recipe using Gemini AI
 * This provides more accurate cooking action detection than regex-based approaches
 */
export function createCookingActionAnalysisPrompt(
  title: string,
  description: string,
  stepsText: string,
  cookTime: number
): string {
  return `You are a cooking appliance expert analyzing recipes for ChefIQ smart appliances (pressure cooker and smart oven).

Your task: Analyze this recipe and identify which cooking actions should be assigned to which steps, with precise cooking parameters.

Recipe Title: ${title}
Description: ${description}
Total Cook Time: ${cookTime} minutes

Recipe Steps:
${stepsText}

Available ChefIQ Appliances and Methods:
1. **iQ Cooker (Pressure Cooker)**: Pressure Cook, Sear/Sauté, Steam, Slow Cook, Sous Vide
2. **iQ MiniOven**: Bake, Air Fry, Roast, Broil, Toast, Dehydrate

CRITICAL RULES:
1. **Pressure Release Steps**: Steps that mention "pressure release", "natural release", "quick release", or "let pressure release" are NOT separate cooking actions. Instead, the pressure release type (natural/quick/pulse) should be part of the PREVIOUS pressure cook step's parameters.

2. **Timing Accuracy**:
   - Extract the EXACT cooking time mentioned in the step (e.g., "3 minutes" = 3, "25 minutes" = 25)
   - Do NOT confuse release time with cook time (e.g., "natural release 10 minutes" does NOT mean cook for 10 minutes)
   - Watch for common OCR errors like "250" when it should be "25"

3. **Pressure Release Detection**:
   - "natural release", "naturally release", "let pressure release naturally" = PressureRelease: 2 (Natural)
   - "quick release", "quickly release", "release pressure immediately" = PressureRelease: 0 (Quick)
   - "pulse release", "intermittent release" = PressureRelease: 1 (Pulse)
   - If natural release has a time (e.g., "natural release 10 minutes"), that's the release duration, not cook time

4. **Step Assignment**: Assign each cooking action to the step index where the cooking actually begins (not the release step)

Return a JSON object with this structure:

{
  "suggestedAppliance": "category_id of appliance (e.g., 'c8ff3aef-3de6-4a74-bba6-03e943b2762c', '4a3cd4f1-839b-4f45-80ea-08f594ff74c3')",
  "suggestedActions": [
    {
      "stepIndex": 0,
      "applianceId": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
      "methodId": "0",
      "methodName": "Pressure Cook",
      "parameters": {
        "cooking_time": 180,
        "pres_level": 1,
        "pres_release": 2,
        "keep_warm": 1,
        "delay_time": 0
      }
    }
  ],
  "confidence": 0.9,
  "reasoning": ["Explanation 1", "Explanation 2"]
}

ChefIQ Appliance IDs and Method IDs:

**iQ Cooker** (category_id = "c8ff3aef-3de6-4a74-bba6-03e943b2762c"):
- Pressure Cook: methodId = "0"
  - Parameters: cooking_time, pres_level (0=Low, 1=High), pres_release (0=Quick, 1=Pulse, 2=Natural), keep_warm (0=Off, 1=On), delay_time
- Sear/Sauté: methodId = "1"
  - Parameters: cooking_time, temp_level (0=Low, 1=Medium-Low, 2=Medium-High, 3=High), keep_warm, delay_time
- Steam: methodId = "2"
  - Parameters: cooking_time, keep_warm, delay_time
- Slow Cook: methodId = "3"
  - Parameters: cooking_time, temp_level (0=Low, 1=Medium-Low, 2=Medium-High, 3=High), keep_warm, delay_time
- Dehydrate: methodId = "4"
  - Parameters: cooking_time, delay_time
- Sous Vide: methodId = "5"
  - Parameters: cooking_time, cooking_temp (in Fahrenheit), delay_time

**iQ MiniOven** (category_id = "4a3cd4f1-839b-4f45-80ea-08f594ff74c3"):
- Bake: methodId = "METHOD_BAKE"
  - Parameters: cooking_time, target_cavity_temp (in Fahrenheit), fan_speed (0=Low, 1=Medium, 2=High)
  - Optional: target_probe_temp, remove_probe_temp (for meat)
- Air Fry: methodId = "METHOD_AIR_FRY"
  - Parameters: cooking_time, target_cavity_temp, fan_speed (typically 2=High)
  - Optional: target_probe_temp, remove_probe_temp
- Roast: methodId = "METHOD_ROAST"
  - Parameters: cooking_time, target_cavity_temp, fan_speed (typically 0=Low or 1=Medium)
  - Optional: target_probe_temp, remove_probe_temp
- Broil: methodId = "METHOD_BROIL"
  - Parameters: cooking_time, temp_level (0=Low, 3=High)
- Toast: methodId = "METHOD_TOAST"
  - Parameters: cooking_time, shade_level (0=Light, 1=Medium-Light, 2=Medium, 3=Medium-Dark, 4=Dark)
  - Optional: is_frozen (true/false), is_bagel (true/false)
- Dehydrate: methodId = "METHOD_DEHYDRATE"
  - Parameters: cooking_time, target_cavity_temp (typically 95-165°F), fan_speed (typically 0=Low)

Parameter Guidelines:
- **cooking_time**: Time in SECONDS (convert minutes to seconds: minutes * 60)
- **target_cavity_temp**: Oven temperature in Fahrenheit
- **cooking_temp**: Sous vide temperature in Fahrenheit
- **target_probe_temp**: Internal meat temperature target in Fahrenheit
- **remove_probe_temp**: Temperature to remove from heat (for carryover cooking, typically 5-10°F below target)
- All numeric parameters should be integers

Examples:

Example 1 (Pressure Cook with Natural Release):
Step 1: "Lock lid and cook on high pressure for 3 minutes"
Step 2: "Let pressure release naturally for 10 minutes"
→ Create ONE action at stepIndex 0:
{
  "stepIndex": 0,
  "applianceId": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
  "methodId": "0",
  "methodName": "Pressure Cook",
  "parameters": {
    "cooking_time": 180,
    "pres_level": 1,
    "pres_release": 2,
    "keep_warm": 1,
    "delay_time": 0
  }
}

Example 2 (Bake):
Step 1: "Preheat oven to 350°F"
Step 2: "Bake for 25 minutes until golden brown"
→ Create ONE action at stepIndex 1:
{
  "stepIndex": 1,
  "applianceId": "4a3cd4f1-839b-4f45-80ea-08f594ff74c3",
  "methodId": "METHOD_BAKE",
  "methodName": "Bake",
  "parameters": {
    "cooking_time": 1500,
    "target_cavity_temp": 350,
    "fan_speed": 0
  }
}

Example 3 (Roast Chicken with Probe):
Step 1: "Season chicken and place in oven"
Step 2: "Roast at 375°F until internal temperature reaches 165°F, about 45 minutes"
→ Create ONE action at stepIndex 1:
{
  "stepIndex": 1,
  "applianceId": "4a3cd4f1-839b-4f45-80ea-08f594ff74c3",
  "methodId": "METHOD_ROAST",
  "methodName": "Roast",
  "parameters": {
    "cooking_time": 2700,
    "target_cavity_temp": 375,
    "fan_speed": 1,
    "target_probe_temp": 165
  }
}

IMPORTANT:
- Return ONLY valid JSON
- Ignore steps about mixing, prepping, serving - only extract actual cooking actions
- If no ChefIQ-compatible cooking method is found, return empty suggestedActions array
- Be precise with times - extract the exact number mentioned
- Use the correct methodId format (numeric string for Cooker, enum string for Oven)

Analyze the recipe above and return the cooking actions as JSON:`;
}
