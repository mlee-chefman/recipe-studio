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
1. **iQ Cooker (Multi Cooker)**: Pressure Cook, Sear/Sauté, Steam, Slow Cook, Sous Vide
2. **iQ Sense (Temperature Hub)**: Monitor Temperature (for grilling/smoking with probe)
3. **iQ MiniOven** (supports meat probe): Bake, Air Fry, Roast, Broil, Toast, Dehydrate

CRITICAL RULES:

1. **Grill/Smoker Detection** ⚠️ IMPORTANT FOR iQ SENSE:
   - If a recipe is primarily for OUTDOOR GRILL or SMOKER (not oven-adaptable), suggest iQ Sense for temperature monitoring
   - Keywords for grill/smoker recipes: "grill", "grilled", "barbecue", "bbq", "smoke", "smoked", "smoker", "smoking", "outdoor grill", "charcoal grill", "gas grill"
   - iQ Sense is ONLY for monitoring temperature during grilling/smoking - it doesn't cook, just monitors with a probe
   - Examples:
     - ✅ "Smoked Brisket on outdoor smoker at 225°F until 203°F" → Suggest iQ Sense (monitor temp)
     - ✅ "Grilled Ribeye on charcoal grill to 135°F" → Suggest iQ Sense (monitor temp)
     - ✅ "BBQ Ribs on smoker for 6 hours" → Suggest iQ Sense (monitor temp)
     - ❌ "Grilled chicken (or bake in oven at 375°F)" → Suggest iQ MiniOven (oven alternative available)
   - When suggesting iQ Sense, ALWAYS include both target_probe_temp AND remove_probe_temp for carryover cooking
   - For grilling: remove_probe_temp is typically 5-10°F below target_probe_temp
   - If recipe can be done in oven as alternative, suggest iQ MiniOven instead

2. **Oven Methods Take Priority** ⚠️ VERY IMPORTANT:
   - If a recipe has BOTH stovetop searing AND oven cooking (Bake/Air Fry/Roast), ONLY suggest the oven method
   - Brief stovetop searing/sautéing (<5 minutes) before oven cooking should be done MANUALLY, not as a ChefIQ action
   - Only suggest Sear/Sauté if it's the PRIMARY cooking method (e.g., stir-fry, pan-seared fish, sautéed vegetables)
   - Examples:
     - ✅ Beef Wellington: "Sear beef 2 min per side, then bake at 400°F for 25 min" → ONLY suggest Bake (MiniOven)
     - ✅ Roasted Chicken: "Sear chicken 3 min, then roast at 375°F" → ONLY suggest Roast (MiniOven)
     - ✅ Stir-Fry: "Sauté vegetables for 10 minutes" → Suggest Sear/Sauté (iQ Cooker)
     - ❌ DO NOT suggest both Sear/Sauté AND Bake for the same recipe
   - When the main cooking happens in the oven, use MiniOven as the suggested appliance

2. **Pressure Cooking Detection** ⚠️ VERY IMPORTANT:
   - ONLY suggest Pressure Cook method if the step EXPLICITLY mentions: "pressure cook", "pressure cooker", "instant pot", "high pressure", "low pressure", "seal and cook under pressure"
   - DO NOT use Pressure Cook for steps that only say "cook", "simmer", "boil", "stew", "braise" WITHOUT explicitly mentioning pressure
   - Examples of when NOT to use Pressure Cook:
     - ❌ "Simmer for 30 minutes" → Use Sear/Sauté OR Slow Cook instead
     - ❌ "Cook for 1 hour until tender" → Use Slow Cook instead
     - ❌ "Bring to a boil and cook" → Use Sear/Sauté instead
     - ✅ "Cook on high pressure for 10 minutes" → Use Pressure Cook
     - ✅ "Instant pot for 15 minutes" → Use Pressure Cook
   - Pressure cooking is 3-5x faster than regular cooking - do NOT suggest it unless explicitly mentioned

3. **Pressure Cook Time Conversion** (RARE - only if necessary):
   - If converting a regular cooking recipe to pressure cooking (should be rare), reduce time by 70-80%:
     - 60 minutes regular → 12-18 minutes pressure
     - 30 minutes regular → 6-9 minutes pressure
     - 2 hours regular → 24-36 minutes pressure
   - IMPORTANT: Prefer NOT suggesting pressure cooking at all if recipe doesn't mention it
   - Better to use Slow Cook or Sear/Sauté for non-pressure recipes

4. **Pressure Release Steps**:
   - Steps mentioning "pressure release", "natural release", "quick release" are NOT separate cooking actions
   - The pressure release type should be part of the PREVIOUS pressure cook step's parameters
   - Release duration is NOT cook time

5. **Timing Accuracy**:
   - Extract the EXACT cooking time mentioned in the step (e.g., "3 minutes" = 3, "25 minutes" = 25)
   - Do NOT confuse release time with cook time (e.g., "natural release 10 minutes" does NOT mean cook for 10 minutes)
   - Watch for common OCR errors like "250" when it should be "25"

6. **Pressure Release Detection**:
   - "natural release", "naturally release", "let pressure release naturally" = PressureRelease: 2 (Natural)
   - "quick release", "quickly release", "release pressure immediately" = PressureRelease: 0 (Quick)
   - "pulse release", "intermittent release" = PressureRelease: 1 (Pulse)
   - If natural release has a time, that's the release duration, not cook time

7. **Step Assignment** ⚠️ CRITICAL - ZERO-INDEXED:
   - The stepIndex in your response MUST be 0-indexed (starts at 0, not 1)
   - Even though steps are labeled "Step 1", "Step 2", etc., use 0-based indexing in your JSON response
   - Examples:
     - "Step 1" → stepIndex: 0
     - "Step 2" → stepIndex: 1
     - "Step 8" → stepIndex: 7
     - "Step 10" → stepIndex: 9
   - Assign each cooking action to the step index where the cooking actually begins (not the release step)
   - ALWAYS subtract 1 from the step number to get the stepIndex

8. **Combining Consecutive Actions** ⚠️ IMPORTANT:
   - If multiple CONSECUTIVE steps use the same cooking method (Slow Cook or Sear/Sauté), combine them into ONE action
   - Add up the total cooking time from all consecutive steps
   - Assign the combined action to the FIRST step where that cooking method begins
   - Examples:
     - Step 1: "Sauté onions for 5 minutes"
     - Step 2: "Add garlic and cook for 2 minutes"
     - Step 3: "Add tomatoes and simmer for 10 minutes"
     → Create ONE Slow Cook action at Step 1 with 17 minutes total (5+2+10)
   - DO NOT combine if:
     - Steps are not consecutive (prep steps in between)
     - Different cooking methods (don't combine Sear/Sauté with Slow Cook)
     - Different appliances (don't combine Cooker with Oven)

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
- Sous Vide: methodId = "5"
  - Parameters: cooking_time, cooking_temp (in Fahrenheit), delay_time

**iQ Sense** (category_id = "a542fa25-5053-4946-8b77-e358467baa0f") - TEMPERATURE MONITORING HUB:
- Monitor Temperature: methodId = "monitor_temp"
  - Parameters: target_probe_temp (in Fahrenheit), remove_probe_temp (in Fahrenheit, for carryover cooking)
  - USE THIS FOR: Outdoor grilling, smoking, barbecue recipes where user cooks on their own grill/smoker
  - This appliance ONLY monitors temperature - it doesn't cook
  - ALWAYS include remove_probe_temp (typically 5-10°F below target for large cuts of meat)
  - Example: Smoked brisket → target_probe_temp: 203, remove_probe_temp: 195

**iQ MiniOven** (category_id = "4a3cd4f1-839b-4f45-80ea-08f594ff74c3") - SUPPORTS MEAT PROBE:
- Bake: methodId = "METHOD_BAKE"
  - Parameters: cooking_time, target_cavity_temp (in Fahrenheit), fan_speed (0=Low, 1=Medium, 2=High)
  - WITH PROBE: target_probe_temp, remove_probe_temp (for meat), NO cooking_time parameter
- Air Fry: methodId = "METHOD_AIR_FRY"
  - Parameters: cooking_time, target_cavity_temp, fan_speed (typically 2=High)
  - WITH PROBE: target_probe_temp, remove_probe_temp, NO cooking_time parameter
- Roast: methodId = "METHOD_ROAST"
  - Parameters: cooking_time, target_cavity_temp, fan_speed (typically 0=Low or 1=Medium)
  - WITH PROBE: target_probe_temp, remove_probe_temp, NO cooking_time parameter
- Broil: methodId = "METHOD_BROIL"
  - Parameters: cooking_time, temp_level (0=Low, 3=High)
- Toast: methodId = "METHOD_TOAST"
  - Parameters: cooking_time, shade_level (0=Light, 1=Medium-Light, 2=Medium, 3=Medium-Dark, 4=Dark)
  - Optional: is_frozen (true/false), is_bagel (true/false)
- Dehydrate: methodId = "METHOD_DEHYDRATE"
  - Parameters: cooking_time, target_cavity_temp

**MEAT PROBE USAGE (MiniOven only):**
- When cooking meat (beef, pork, chicken, lamb, etc.) in the MiniOven, you can use the meat probe
- WITH PROBE: Use target_probe_temp and remove_probe_temp instead of cooking_time parameter
- target_probe_temp: Final internal temperature when meat is done (e.g., 145°F for medium-rare beef)
- remove_probe_temp: Temperature to remove from oven for resting (typically 5-10°F lower than target)
- Example: Beef Wellington → target_probe_temp: 135°F, remove_probe_temp: 130°F (for medium-rare)
- Only use probe for: Bake, Air Fry, Roast (NOT for Broil, Toast, Dehydrate)

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
→ Create ONE action at stepIndex 0 (for "Step 1"):
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
NOTE: stepIndex is 0 because it's "Step 1" (1-1=0)

Example 2 (Bake):
Step 1: "Preheat oven to 350°F"
Step 2: "Bake for 25 minutes until golden brown"
→ Create ONE action at stepIndex 1 (for "Step 2"):
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
NOTE: stepIndex is 1 because it's "Step 2" (2-1=1)

Example 3 (Roast Chicken with Probe):
Step 1: "Season chicken and place in oven"
Step 2: "Roast at 375°F until internal temperature reaches 165°F, about 45 minutes"
→ Create ONE action at stepIndex 1 (for "Step 2"):
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
NOTE: stepIndex is 1 because it's "Step 2" (2-1=1)

Example 4 (Regular Simmer - NOT Pressure Cook):
Step 1: "Add broth and bring to a boil"
Step 2: "Reduce heat and simmer for 30 minutes until vegetables are tender"
→ Create ONE action at stepIndex 1 (for "Step 2"):
{
  "stepIndex": 1,
  "applianceId": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
  "methodId": "3",
  "methodName": "Slow Cook",
  "parameters": {
    "cooking_time": 1800,
    "temp_level": 1,
    "keep_warm": 0,
    "delay_time": 0
  }
}
NOTE: "Simmer" does NOT mean pressure cooking. Use Slow Cook (Medium-Low) instead. stepIndex is 1 because it's "Step 2" (2-1=1).

Example 5 (When to Skip Cooking Action):
Step 1: "Cook the pasta according to package directions"
Step 2: "Drain and set aside"
→ Return empty suggestedActions array []
NOTE: Generic "cook" without specific method or appliance-compatible technique should not have a cooking action.

Example 6 (Combining Consecutive Slow Cook Actions):
Step 1: "Heat oil and sauté onions for 5 minutes until softened"
Step 2: "Add garlic and cook for 2 minutes"
Step 3: "Add tomatoes, reduce heat and simmer for 15 minutes"
Step 4: "Season and serve"
→ Create ONE Slow Cook action at stepIndex 0 (for "Step 1", combines Steps 1-3):
{
  "stepIndex": 0,
  "applianceId": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
  "methodId": "3",
  "methodName": "Slow Cook",
  "parameters": {
    "cooking_time": 1320,
    "temp_level": 2,
    "keep_warm": 0,
    "delay_time": 0
  }
}
NOTE: Combined 5 + 2 + 15 = 22 minutes (1320 seconds). Steps 1-3 are all continuous cooking. stepIndex is 0 because it starts at "Step 1" (1-1=0).

Example 7 (DO NOT Combine - Non-Consecutive):
Step 1: "Sauté onions for 5 minutes"
Step 2: "While onions cook, dice the tomatoes"
Step 3: "Add tomatoes and simmer for 10 minutes"
→ Create TWO separate actions:
Action 1 at stepIndex 0 (for "Step 1"): Sear/Sauté for 5 minutes
Action 2 at stepIndex 2 (for "Step 3"): Slow Cook for 10 minutes
NOTE: Step 2 is prep work, not cooking, so actions should NOT be combined. Remember: "Step 1" = stepIndex 0, "Step 3" = stepIndex 2.

Example 8 (Beef Wellington - Oven Method Takes Priority):
Step 1: "Heat oil in a large skillet over high heat"
Step 2: "Sear beef for 2-3 minutes per side until browned"
Step 3: "Let beef cool, then wrap in puff pastry with mushroom duxelles"
Step 4: "Bake at 400°F for 25-30 minutes until pastry is golden and beef reaches 135°F for medium-rare"
→ Create ONE action at stepIndex 3 (for "Step 4" - ONLY the Bake action):
{
  "stepIndex": 3,
  "applianceId": "4a3cd4f1-839b-4f45-80ea-08f594ff74c3",
  "methodId": "METHOD_BAKE",
  "methodName": "Bake",
  "parameters": {
    "cooking_time": 1650,
    "target_cavity_temp": 400,
    "target_probe_temp": 135,
    "fan_speed": 1
  }
}
NOTE: ⚠️ DO NOT suggest Sear/Sauté for Step 2. The quick stovetop searing is done MANUALLY. Only the main oven cooking (Bake) is suggested as a ChefIQ action because the MiniOven is the PRIMARY appliance for this recipe. stepIndex is 3 because it's "Step 4" (4-1=3).

Example 9 (Grilled/Smoked Recipe - Use iQ Sense):
Step 1: "Prepare smoker to 225°F using hickory wood"
Step 2: "Season brisket with dry rub"
Step 3: "Place brisket on smoker and smoke for 10-12 hours until internal temperature reaches 203°F, remove at 195°F"
Step 4: "Wrap in butcher paper and let rest for 1 hour"
→ Create ONE action at stepIndex 2 (for "Step 3" - iQ Sense monitors temperature):
{
  "stepIndex": 2,
  "applianceId": "a542fa25-5053-4946-8b77-e358467baa0f",
  "methodId": "monitor_temp",
  "methodName": "Monitor Temperature",
  "parameters": {
    "target_probe_temp": 203,
    "remove_probe_temp": 195
  }
}
NOTE: ⚠️ iQ Sense is for OUTDOOR GRILLING/SMOKING only - it monitors temperature via probe but doesn't cook. Perfect for smoker recipes. ALWAYS include both target and remove temps. stepIndex is 2 because it's "Step 3" (3-1=2).

IMPORTANT:
- Return ONLY valid JSON
- Ignore steps about mixing, prepping, serving - only extract actual cooking actions
- If no ChefIQ-compatible cooking method is found, return empty suggestedActions array
- Be precise with times - extract the exact number mentioned
- Use the correct methodId format (numeric string for Cooker, enum string for Oven)
- ⚠️ CRITICAL: stepIndex MUST be 0-indexed! "Step 1" = stepIndex 0, "Step 2" = stepIndex 1, "Step 8" = stepIndex 7, etc.
- ⚠️ CRITICAL: If recipe has BOTH searing AND oven cooking (Bake/Roast/Air Fry), ONLY suggest the oven method - skip sear/sauté actions
- ⚠️ CRITICAL: Only use Pressure Cook when EXPLICITLY mentioned - do NOT assume "cook" or "simmer" means pressure cooking
- When in doubt between Pressure Cook and Slow Cook, choose Slow Cook for safety
- ⚠️ COMBINE consecutive Slow Cook or Sear/Sauté actions into ONE action with total time (e.g., 5min + 2min + 10min = 17min total)
- Only combine if steps are truly consecutive without prep steps in between

Analyze the recipe above and return the cooking actions as JSON:`;
}

/**
 * Creates a detailed prompt for generating recipes from fridge ingredients with preferences
 */
export function createRecipeFromIngredientsPrompt(
  ingredients: string[],
  dietary?: string,
  cuisine?: string,
  cookingTime?: string,
  matchingStrictness?: 'exact' | 'substitutions' | 'creative'
): string {
  const dietaryFilter = dietary && dietary !== 'None' ? dietary : null;
  const cuisineFilter = cuisine && cuisine !== 'Any' ? cuisine : null;
  const timeFilter = cookingTime && cookingTime !== 'Any' ? cookingTime : null;

  let strictnessInstruction = '';
  switch (matchingStrictness) {
    case 'exact':
      strictnessInstruction = 'Use ONLY the ingredients provided. Do not add any other main ingredients.';
      break;
    case 'substitutions':
      strictnessInstruction = 'You may suggest substitutions for missing ingredients, but try to use the provided ingredients as much as possible.';
      break;
    case 'creative':
      strictnessInstruction = 'You can be creative and suggest additional ingredients that complement the provided ones.';
      break;
    default:
      strictnessInstruction = 'You may suggest substitutions for missing ingredients, but try to use the provided ingredients as much as possible.';
  }

  return `You are a professional chef and recipe creator. Your task is to create a delicious recipe using the ingredients the user has available.

**Available Ingredients**: ${ingredients.join(', ')}

${dietaryFilter ? `**Dietary Restriction**: ${dietaryFilter}` : ''}
${cuisineFilter ? `**Preferred Cuisine**: ${cuisineFilter}` : ''}
${timeFilter ? `**Cooking Time Preference**: ${timeFilter}` : ''}

**Matching Mode**: ${strictnessInstruction}

Please create a practical, delicious recipe that:
1. Makes good use of the available ingredients
2. ${dietaryFilter ? `Follows ${dietaryFilter} dietary restrictions` : 'Has no dietary restrictions'}
3. ${cuisineFilter ? `Is inspired by ${cuisineFilter} cuisine` : 'Can be from any cuisine'}
4. ${timeFilter ? `Takes approximately ${timeFilter} to prepare` : 'Can take any reasonable amount of time'}

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
  "missingIngredients": ["ingredient that user doesn't have but recipe needs"],
  "substitutions": [
    {"missing": "ingredient name", "substitutes": ["substitute 1", "substitute 2"]}
  ],
  "matchPercentage": 85
}

Guidelines:
1. **Title**: Create a clear, appetizing title
2. **Description**: Write 1-2 sentences describing the dish and why it's delicious
3. **Ingredients**: List all ingredients with specific quantities and units. Mark which ones the user already has by using the available ingredients list
4. **Steps**: Write clear, numbered steps in chronological order. Be specific about temperatures, times, and techniques
5. **Times**: Provide realistic prep time and cook time in minutes${timeFilter ? ` that fit within ${timeFilter}` : ''}
6. **Servings**: Specify number of servings (typically 2-4)
7. **Category**: Choose the most appropriate category (e.g., Main Course, Dessert, Appetizer, etc.)
8. **Tags**: Add 2-5 relevant tags (e.g., "Quick", "Healthy", "Vegetarian", "Spicy", cuisine style, etc.)
9. **Missing Ingredients**: List any ingredients the recipe needs that the user doesn't have (only if matchingStrictness is not 'exact')
10. **Substitutions**: Suggest substitutes for missing ingredients (only if matchingStrictness is not 'exact')
11. **Match Percentage**: Estimate how well the recipe matches the user's available ingredients (0-100)

Important:
- ${strictnessInstruction}
- ${dietaryFilter ? `Ensure the recipe is ${dietaryFilter}-friendly` : ''}
- Make the recipe practical and achievable for home cooks
- Be specific about cooking temperatures and times
- Return ONLY valid JSON, no additional text
- Make sure the JSON is properly formatted and can be parsed

Return the recipe as JSON:`;
}

/**
 * Creates a prompt for generating multiple recipe options from fridge ingredients
 */
export function createMultipleRecipesFromIngredientsPrompt(
  ingredients: string[],
  numberOfRecipes: number,
  dietary?: string,
  cuisine?: string,
  cookingTime?: string,
  category?: string,
  matchingStrictness?: 'exact' | 'substitutions' | 'creative',
  excludeTitles: string[] = []
): string {
  const dietaryFilter = dietary && dietary !== 'None' ? dietary : null;
  const cuisineFilter = cuisine && cuisine !== 'Any' ? cuisine : null;
  const timeFilter = cookingTime && cookingTime !== 'Any' ? cookingTime : null;
  const categoryFilter = category && category !== 'Any' ? category : null;

  let strictnessInstruction = '';
  switch (matchingStrictness) {
    case 'exact':
      strictnessInstruction = 'Use ONLY the ingredients provided. Do not add any other main ingredients.';
      break;
    case 'substitutions':
      strictnessInstruction = 'You may suggest substitutions for missing ingredients, but try to use the provided ingredients as much as possible.';
      break;
    case 'creative':
      strictnessInstruction = 'You can be creative and suggest additional ingredients that complement the provided ones.';
      break;
    default:
      strictnessInstruction = 'You may suggest substitutions for missing ingredients, but try to use the provided ingredients as much as possible.';
  }

  const excludeInstruction = excludeTitles.length > 0
    ? `\n\n**IMPORTANT - Do NOT generate any of these previously suggested recipes**: ${excludeTitles.join(', ')}\nCreate a COMPLETELY DIFFERENT recipe that has not been suggested before.`
    : '';

  return `You are a professional chef and recipe creator. Your task is to create ${numberOfRecipes} delicious ${categoryFilter || ''} recipe${numberOfRecipes > 1 ? 's' : ''} using the ingredients the user has available.

**Available Ingredients**: ${ingredients.join(', ')}

${dietaryFilter ? `**Dietary Restriction**: ${dietaryFilter}` : ''}
${cuisineFilter ? `**Preferred Cuisine**: ${cuisineFilter}` : ''}
${timeFilter ? `**Cooking Time Preference**: ${timeFilter}` : ''}
${categoryFilter ? `**Recipe Category**: ${categoryFilter}` : ''}

**Matching Mode**: ${strictnessInstruction}${excludeInstruction}

Please create ${numberOfRecipes} practical, delicious recipe${numberOfRecipes > 1 ? 's' : ''} that:
1. Make good use of the available ingredients
2. ${dietaryFilter ? `Follow ${dietaryFilter} dietary restrictions` : 'Have no dietary restrictions'}
3. ${cuisineFilter ? `Are inspired by ${cuisineFilter} cuisine` : 'Can be from any cuisine'}
4. ${timeFilter ? `Take approximately ${timeFilter} to prepare` : 'Can take any reasonable amount of time'}
5. ${categoryFilter ? `Are in the ${categoryFilter} category` : 'Can be from any category'}

Return a JSON array of ${numberOfRecipes} recipe objects with the following structure:

[
  {
    "title": "Recipe title",
    "description": "A brief, appetizing description of the dish (1-2 sentences)",
    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
    "steps": [
      {
        "text": "Add ingredients to pressure cooker and cook on high pressure for 15 minutes with natural release",
        "cookingAction": {
          "id": "action-1",
          "applianceId": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
          "methodId": "0",
          "methodName": "Pressure Cook",
          "parameters": {
            "cooking_time": 900,
            "pres_level": 1,
            "pres_release": 2,
            "keep_warm": 0
          }
        }
      },
      {"text": "Remove from heat and serve hot"}
    ],
    "cookTime": 30,
    "prepTime": 15,
    "servings": 4,
    "category": "category name (e.g., Main Course, Dessert, etc.)",
    "tags": ["tag1", "tag2", "tag3"],
    "chefiqAppliance": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
    "missingIngredients": ["ingredient that user doesn't have but recipe needs"],
    "substitutions": [
      {"missing": "ingredient name", "substitutes": ["substitute 1", "substitute 2"]}
    ],
    "matchPercentage": 85
  },
  {
    "title": "Beef Wellington with Meat Probe",
    "description": "Elegant beef tenderloin wrapped in puff pastry with mushroom duxelles",
    "ingredients": ["2 lb beef tenderloin", "puff pastry", "8 oz mushrooms", "2 tbsp butter"],
    "steps": [
      {"text": "Sear beef in a hot skillet for 2-3 minutes per side until browned"},
      {"text": "Let beef cool, then wrap in puff pastry with mushroom duxelles"},
      {
        "text": "Bake at 400°F until internal temperature reaches 135°F for medium-rare, remove at 130°F for resting",
        "cookingAction": {
          "id": "action-1",
          "applianceId": "4a3cd4f1-839b-4f45-80ea-08f594ff74c3",
          "methodId": "METHOD_BAKE",
          "methodName": "Bake",
          "parameters": {
            "target_cavity_temp": 400,
            "target_probe_temp": 135,
            "remove_probe_temp": 130,
            "fan_speed": 1
          }
        }
      },
      {"text": "Let rest 10 minutes before slicing"}
    ],
    "cookTime": 30,
    "prepTime": 20,
    "servings": 4,
    "category": "Main Course",
    "tags": ["beef", "elegant", "holiday"],
    "chefiqAppliance": "4a3cd4f1-839b-4f45-80ea-08f594ff74c3",
    "missingIngredients": [],
    "substitutions": [],
    "matchPercentage": 100
  }
]

**ChefIQ Cooking Actions** (OPTIONAL - only include if the recipe uses compatible cooking methods):

Available ChefIQ Appliances:
1. **iQ Cooker** (applianceId: "c8ff3aef-3de6-4a74-bba6-03e943b2762c")
   - Pressure Cook (methodId: "0"): cooking_time (seconds), pres_level (0=Low, 1=High), pres_release (0=Quick, 1=Pulse, 2=Natural), keep_warm (0=Off, 1=On)
   - Sear/Sauté (methodId: "1"): cooking_time (seconds), temp_level (0=Low, 1=Medium-Low, 2=Medium-High, 3=High), keep_warm (0=Off, 1=On)
   - Steam (methodId: "2"): cooking_time (seconds), keep_warm (0=Off, 1=On)
   - Slow Cook (methodId: "3"): cooking_time (seconds), temp_level (0=Low, 1=Medium-Low, 2=Medium-High, 3=High), keep_warm (0=Off, 1=On)
   - Sous Vide (methodId: "5"): cooking_time (seconds), cooking_temp (°F)

2. **iQ Sense** (applianceId: "a542fa25-5053-4946-8b77-e358467baa0f") - TEMPERATURE MONITORING HUB
   - Monitor Temperature (methodId: "monitor_temp"): target_probe_temp (°F), remove_probe_temp (°F)
   - USE FOR: Outdoor grilling, smoking, barbecue recipes (monitors temperature, doesn't cook)
   - ALWAYS include remove_probe_temp (typically 5-10°F below target for carryover cooking)

3. **iQ MiniOven** (applianceId: "4a3cd4f1-839b-4f45-80ea-08f594ff74c3") - SUPPORTS MEAT PROBE
   - Bake (methodId: "METHOD_BAKE"):
     * Normal: cooking_time (seconds), target_cavity_temp (°F), fan_speed (0=Low, 1=Medium, 2=High)
     * With Probe: target_cavity_temp (°F), target_probe_temp (°F), remove_probe_temp (°F), fan_speed, NO cooking_time
   - Air Fry (methodId: "METHOD_AIR_FRY"):
     * Normal: cooking_time (seconds), target_cavity_temp (°F), fan_speed (typically 2=High)
     * With Probe: target_cavity_temp (°F), target_probe_temp (°F), remove_probe_temp (°F), fan_speed, NO cooking_time
   - Roast (methodId: "METHOD_ROAST"):
     * Normal: cooking_time (seconds), target_cavity_temp (°F), fan_speed (typically 0=Low or 1=Medium)
     * With Probe: target_cavity_temp (°F), target_probe_temp (°F), remove_probe_temp (°F), fan_speed, NO cooking_time
   - Broil (methodId: "METHOD_BROIL"): cooking_time (seconds), temp_level (0=Low, 3=High)
   - Toast (methodId: "METHOD_TOAST"): cooking_time (seconds), shade_level (0=Light, 1=Medium-Light, 2=Medium, 3=Medium-Dark, 4=Dark)
   - Dehydrate (methodId: "METHOD_DEHYDRATE"): cooking_time (seconds), target_cavity_temp (°F)

**MEAT PROBE (MiniOven only):**
- Use probe for meat recipes (beef, pork, chicken, lamb, fish)
- Replace cooking_time with target_probe_temp and remove_probe_temp
- target_probe_temp: Final doneness temperature (e.g., 145°F for medium-rare beef, 165°F for chicken)
- remove_probe_temp: Remove temperature for resting (typically 5-10°F lower)
- Only for Bake, Air Fry, and Roast methods

IMPORTANT:
- ⚠️ If a recipe has BOTH stovetop searing AND oven cooking (Bake/Roast/Air Fry), ONLY add cookingAction to the oven step - skip searing steps
- Brief stovetop searing before oven cooking should be a plain step WITHOUT cookingAction (user does it manually)
- Sear/Sauté is ONLY for iQ Cooker, NOT for MiniOven
- Each appliance has specific methods - do not mix them
- cooking_time must be in SECONDS (convert minutes * 60)
- Only add cookingAction to actual cooking steps (NOT prep, mixing, or serving)

Guidelines:
1. **Variety**: Make each recipe distinctly different${ingredients.length >= 5 ? ' - USE DIFFERENT CATEGORIES (e.g., one Main Course, one Side Dish, one Dessert, etc.)' : ' - vary the cooking method and flavor profile'}
2. **Title**: Create clear, appetizing titles
3. **Description**: Write 1-2 sentences describing each dish
4. **Ingredients**: List all ingredients with specific quantities and units
5. **Steps**: Write clear, numbered steps in chronological order as objects with "text" field. If a step uses a ChefIQ-compatible cooking method, include the optional "cookingAction" object
6. **Times**: Provide realistic prep time and cook time in minutes${timeFilter ? ` that fit within ${timeFilter}` : ''}
7. **Servings**: Specify number of servings (typically 2-4)
8. **Category**: ${ingredients.length >= 5 ? 'IMPORTANT - Choose DIFFERENT categories for each recipe (Main Course, Side Dish, Dessert, Appetizer, Soup, Salad, etc.)' : 'Choose appropriate category (Main Course, Dessert, Appetizer, etc.)'}
9. **Tags**: Add 2-5 relevant tags per recipe
10. **ChefIQ Integration**: If the recipe uses pressure cooking, slow cooking, searing, steaming, baking, air frying, roasting, or broiling, include the appropriate cookingAction in the step and set chefiqAppliance to the appliance ID
11. **Missing Ingredients**: List any ingredients the recipe needs that the user doesn't have
12. **Substitutions**: Suggest substitutes for missing ingredients
13. **Match Percentage**: Estimate how well the recipe matches the user's available ingredients (0-100)

Important:
- ${strictnessInstruction}
- ${dietaryFilter ? `Ensure ALL recipes are ${dietaryFilter}-friendly` : ''}
- Make the recipes practical and achievable for home cooks
- ${ingredients.length >= 5 ? 'CRITICAL: Each recipe must be in a DIFFERENT category to showcase versatility' : 'Ensure variety - different recipes should use different techniques and have different flavors'}
- The user will select ONE recipe to create, so make each option appealing and distinct
- **ChefIQ Actions**: Include cooking actions when applicable to make recipes smart-appliance ready. Generate unique IDs for each action (e.g., "action-1", "action-2")
- Only add cookingAction to steps that actually cook food (NOT for prep, mixing, or serving steps)
- Use appropriate parameters for each cooking method (cooking_time in minutes, temperatures in °F)
- Return ONLY valid JSON array, no additional text
- Make sure the JSON is properly formatted and can be parsed

Return the recipes as a JSON array:`;
}

/**
 * Creates a prompt for simplifying and cleaning up verbose recipe instructions
 */
export function createRecipeSimplificationPrompt(
  title: string,
  ingredients: string[],
  steps: Array<{ text: string; cookingAction?: any }>,
  notes: string
): string {
  const stepsText = steps.map((step, index) => {
    let stepText = `${index + 1}. ${step.text}`;
    if (step.cookingAction) {
      const action = step.cookingAction;
      stepText += `\n   [COOKING ACTION: ${action.methodName} on ${action.applianceId}`;
      if (action.parameters && Object.keys(action.parameters).length > 0) {
        stepText += ` - Parameters: ${JSON.stringify(action.parameters)}`;
      }
      stepText += ']';
    }
    return stepText;
  }).join('\n');

  return `You are a professional recipe editor specializing in making recipes clear, concise, and easy to follow.

Your task: Analyze this recipe and simplify/consolidate the instructions WITHOUT losing important cooking details.

Recipe Title: ${title}

Ingredients:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

Current Instructions:
${stepsText}

Notes: ${notes || 'None'}

**Your Goal:**
1. **Consolidate repetitive steps** - Combine similar consecutive actions
2. **Remove unnecessary details** - Cut out redundant explanations or overly verbose descriptions
3. **Keep essential information** - PRESERVE all cooking times, temperatures, and critical techniques
4. **Maintain logical flow** - Steps should still be in proper cooking order
5. **Simplify notes** - If notes are very long or repetitive, condense them while keeping important info
6. **Re-analyze cooking actions** - CRITICAL: Some steps have [COOKING ACTION] with appliance and parameters. When simplifying:
   - If a step with a cooking action is kept mostly unchanged, preserve the same cooking action
   - If multiple steps are combined and one has a cooking action, assign it to the combined step
   - Adjust cooking action parameters if the simplified step description changes significantly (e.g., if time or temperature changes in the text, update the parameters)
7. **Preserve step images** - If a step has an image, note that in your response

**Guidelines:**
- Combine steps like "Chop onions" + "Dice tomatoes" + "Mince garlic" → "Prep vegetables: chop onions, dice tomatoes, and mince garlic"
- Remove repetitive phrases like "then", "next", "after that" unless they clarify timing
- Keep ALL cooking temperatures, times, and doneness indicators (e.g., "until golden brown", "reaches 165°F")
- Keep safety-critical steps separate (e.g., don't combine "add raw chicken" with "add vegetables")
- If a recipe genuinely NEEDS many steps (e.g., complex baking, multi-stage cooking), preserve them
- DO NOT over-simplify - if a recipe has 3-4 well-written steps, it may not need changes

**What NOT to do:**
- ❌ Don't remove cooking times or temperatures
- ❌ Don't combine unrelated cooking actions (e.g., searing meat with baking)
- ❌ Don't merge steps that need to happen sequentially with wait time
- ❌ Don't simplify recipes that are already concise and well-written

Return a JSON object with the following structure:

{
  "simplified": true,
  "originalStepCount": ${steps.length},
  "simplifiedStepCount": 3,
  "steps": [
    {
      "text": "Combined or simplified step text here",
      "cookingAction": {
        "applianceId": "c8ff3aef-3de6-4a74-bba6-03e943b2762c",
        "methodId": "00000000-0000-0000-0000-000000000001",
        "methodName": "Sauté",
        "parameters": {"time": 10, "temperature": 350}
      }
    },
    {"text": "Next step without cooking action"}
  ],
  "notes": "Simplified notes (or original if no changes needed)",
  "changesSummary": "Brief explanation of what was simplified (1-2 sentences)",
  "significantChanges": true
}

**IMPORTANT:**
- Set "simplified" to false if the recipe is already well-written and doesn't need changes
- Set "significantChanges" to false if you only made minor wording tweaks
- Include "changesSummary" explaining what you did
- For each step, include "cookingAction" ONLY if the original step(s) had a cooking action and it's still relevant
- The cookingAction object should include: applianceId, methodId, methodName, and parameters (object with cooking settings)
- Preserve the exact applianceId and methodId from the original cooking action
- Update the parameters object if the step description changed (e.g., different time/temp mentioned)
- Return ONLY valid JSON, no additional text

Analyze the recipe and return the JSON:`;
}
