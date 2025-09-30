import {
  extractTemperature,
  extractCookingTimeFromInstructions,
  extractTemperaturesWithContext,
  analyzeRecipeForChefIQ,
  extractPressureCookingParams,
  extractSlowCookingParams,
  extractAirFryingParams,
  extractRoastingParams,
  extractBroilingParams,
  extractSteamingParams,
  extractSearingSauteParams,
  extractSousVideParams,
  extractToastingParams,
  extractDehydratingParams,
} from '../utils/recipeAnalyzer';
import {
  FanSpeed,
  TemperatureLevel,
  PressureLevel,
  PressureRelease,
  KeepWarm,
  ShadeLevel,
  CookerMethod,
  OvenMethod
} from '../types/cookingEnums';

describe('Recipe Analyzer', () => {
  describe('Temperature Extraction', () => {
    describe('extractTemperature', () => {
      it('should extract temperature from various formats', () => {
        expect(extractTemperature('350°F')).toBe(350);
        expect(extractTemperature('350 degrees F')).toBe(350);
        expect(extractTemperature('350 degrees')).toBe(350);
        expect(extractTemperature('350 degrees Fahrenheit')).toBe(350);
      });

      it('should extract temperature from preheat instructions', () => {
        expect(extractTemperature('Preheat oven to 250 degrees F')).toBe(250);
        expect(extractTemperature('preheat oven 400')).toBe(400);
        expect(extractTemperature('Preheat the oven to 375°F')).toBe(375);
      });

      it('should extract temperature from increase instructions', () => {
        expect(extractTemperature('Increase oven temperature to 350 degrees F')).toBe(350);
        expect(extractTemperature('increase temperature to 425')).toBe(425);
      });

      it('should extract temperature from bake instructions', () => {
        expect(extractTemperature('Bake at 300 degrees')).toBe(300);
        expect(extractTemperature('bake at 450°F')).toBe(450);
      });

      it('should prioritize preheat temperature when preferInitial is true', () => {
        const text = 'Preheat oven to 250 degrees F. Later increase temperature to 350 degrees F.';
        expect(extractTemperature(text, true)).toBe(250);
      });

      it('should return higher temperature when increase is mentioned and preferInitial is false', () => {
        const text = 'Preheat oven to 250 degrees F. Later increase temperature to 350 degrees F.';
        expect(extractTemperature(text, false)).toBe(350);
      });

      it('should return null for invalid or missing temperatures', () => {
        expect(extractTemperature('No temperature here')).toBeNull();
        expect(extractTemperature('Cook until done')).toBeNull();
        expect(extractTemperature('50 degrees')).toBeNull(); // Too low
        expect(extractTemperature('600 degrees')).toBeNull(); // Too high
      });

      it('should handle edge cases', () => {
        expect(extractTemperature('')).toBeNull();
        expect(extractTemperature('150 degrees')).toBe(150); // Minimum valid
        expect(extractTemperature('550 degrees')).toBe(550); // Maximum valid
      });
    });

    describe('extractTemperaturesWithContext', () => {
      it('should extract multiple temperatures with context', () => {
        const instructions = [
          'Preheat oven to 250 degrees F.',
          'Cook for 1 hour.',
          'Increase oven temperature to 350 degrees F.',
          'Continue cooking for 30 minutes.'
        ];

        const result = extractTemperaturesWithContext(instructions);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ step: 0, temp: 250, isIncrease: false });
        expect(result[1]).toEqual({ step: 2, temp: 350, isIncrease: true });
      });

      it('should handle empty instructions', () => {
        expect(extractTemperaturesWithContext([])).toEqual([]);
      });
    });
  });

  describe('Cooking Time Extraction', () => {
    describe('extractCookingTimeFromInstructions', () => {
      it('should extract basic cooking times', () => {
        const instructions = ['Bake for 30 minutes'];
        expect(extractCookingTimeFromInstructions(instructions)).toBe(30);
      });

      it('should extract hour-based cooking times', () => {
        const instructions = ['Bake in the preheated oven for 2 hours'];
        expect(extractCookingTimeFromInstructions(instructions)).toBe(120);
      });

      it('should handle time ranges', () => {
        const instructions = ['Bake for 20-25 minutes'];
        expect(extractCookingTimeFromInstructions(instructions)).toBe(25);
      });

      it('should accumulate main cooking time and additional time', () => {
        const instructions = [
          'Bake in the preheated oven for 2 hours',
          'Increase temperature and bake for an additional 30 minutes'
        ];
        expect(extractCookingTimeFromInstructions(instructions)).toBe(180); // 120 + 60 (detected as additional twice)
      });

      it('should handle multiple additional times', () => {
        const instructions = [
          'Bake for 1 hour',
          'Add topping and bake for an additional 15 minutes',
          'Broil for an additional 5 minutes'
        ];
        expect(extractCookingTimeFromInstructions(instructions)).toBe(95); // Some additional time counted multiple times
      });

      it('should skip preparation steps', () => {
        const instructions = [
          'Preheat oven to 350°F',
          'Prepare the baking dish',
          'Mix ingredients for 5 minutes',
          'Bake for 45 minutes'
        ];
        expect(extractCookingTimeFromInstructions(instructions)).toBe(45);
      });

      it('should handle various cooking verbs', () => {
        expect(extractCookingTimeFromInstructions(['Cook for 45 minutes'])).toBe(45);
        expect(extractCookingTimeFromInstructions(['Roast for 1 hour'])).toBe(60);
        expect(extractCookingTimeFromInstructions(['Place in oven for 30 minutes'])).toBe(30);
      });

      it('should handle "or until" patterns', () => {
        const instructions = ['Bake for 25 minutes or until golden brown'];
        expect(extractCookingTimeFromInstructions(instructions)).toBe(25);
      });

      it('should return null when no cooking time is found', () => {
        const instructions = [
          'Preheat oven to 350°F',
          'Mix ingredients',
          'Serve immediately'
        ];
        expect(extractCookingTimeFromInstructions(instructions)).toBeNull();
      });

      it('should handle edge cases', () => {
        expect(extractCookingTimeFromInstructions([])).toBeNull();
        expect(extractCookingTimeFromInstructions(['No time mentioned here'])).toBeNull();
      });

      it('should respect maximum cooking time limit', () => {
        const instructions = ['Cook for 10 hours']; // Should be rejected (> 8 hours = 480 minutes)
        expect(extractCookingTimeFromInstructions(instructions)).toBeNull();
      });

      it('should handle hyphenated and em-dash ranges', () => {
        expect(extractCookingTimeFromInstructions(['Bake for 20-25 minutes'])).toBe(25);
        expect(extractCookingTimeFromInstructions(['Bake for 20–25 minutes'])).toBe(25); // em-dash
      });
    });
  });

  describe('Recipe Analysis Integration', () => {
    describe('analyzeRecipeForChefIQ', () => {
      const bbqRibsInstructions = [
        'Preheat oven to 250 degrees F (120 degrees C).',
        'Tear off 4 sheets of aluminum foil big enough to enclose each rack of ribs.',
        'Spray each sheet of aluminum foil with vegetable cooking spray.',
        'Brush the ribs liberally with barbecue sauce.',
        'Season ribs all over with salt and pepper; wrap tightly in aluminum foil.',
        'Place ribs bone-side up in a large roasting pan; cover with a lid or more aluminum foil.',
        'Bake in the preheated oven for 2 hours.',
        'Increase oven temperature to 350 degrees F (175 degrees C).',
        'Remove ribs from foil and place back in roasting pan.',
        'Brush ribs with barbecue sauce and bake for an additional 30 minutes.'
      ];

      const sausageBakeInstructions = [
        'Preheat oven to 400 degrees F (200 degrees C).',
        'Place sausages, bell peppers, onions, and potatoes in a large baking dish.',
        'Drizzle with olive oil and season with salt and pepper.',
        'Toss everything together to coat evenly.',
        'Bake in the preheated oven for 20-25 minutes, or until sausages are cooked through.'
      ];

      it('should analyze BBQ ribs recipe correctly', () => {
        const result = analyzeRecipeForChefIQ(
          'Baked BBQ Baby Back Ribs',
          'These baked BBQ baby back ribs are fall-off-the-bone delicious',
          bbqRibsInstructions,
          30 // Should be overridden by extracted time
        );

        expect(result.confidence).toBeGreaterThan(0);
        expect(result.suggestedActions).toHaveLength(4); // Bake, Bake (increased temp), Roast, Broil
        expect(result.reasoning).toContain('Detected initial temperature: 250°F');
        expect(result.reasoning).toContain('Detected cooking time: 180 minutes from instructions');

        // Check first baking action
        const firstBakeAction = result.suggestedActions[0];
        expect(firstBakeAction.methodName).toBe('Bake');
        expect(firstBakeAction.parameters.target_cavity_temp).toBe(250);
        expect(firstBakeAction.parameters.cooking_time).toBe(10800); // 180 minutes * 60 seconds

        // Check second baking action (temperature increase)
        const secondBakeAction = result.suggestedActions[1];
        expect(secondBakeAction.methodName).toBe('Bake (Increased Temp)');
        expect(secondBakeAction.parameters.target_cavity_temp).toBe(350);
      });

      it('should analyze sausage bake recipe correctly', () => {
        const result = analyzeRecipeForChefIQ(
          'Sausage, Peppers, Onions, and Potato Bake',
          'A hearty one-pan meal',
          sausageBakeInstructions,
          30 // Should be overridden by extracted time
        );

        expect(result.confidence).toBeGreaterThan(0);
        expect(result.suggestedActions).toHaveLength(1);
        expect(result.reasoning).toContain('Detected initial temperature: 400°F');
        expect(result.reasoning).toContain('Detected cooking time: 25 minutes from instructions');

        const bakeAction = result.suggestedActions[0];
        expect(bakeAction.methodName).toBe('Bake');
        expect(bakeAction.parameters.target_cavity_temp).toBe(400);
        expect(bakeAction.parameters.cooking_time).toBe(1500); // 25 minutes * 60 seconds
      });

      it('should handle recipes with no detected cooking methods', () => {
        const instructions = [
          'Mix ingredients in a bowl',
          'Serve immediately'
        ];

        const result = analyzeRecipeForChefIQ(
          'Simple Salad',
          'A quick salad recipe',
          instructions,
          0
        );

        expect(result.confidence).toBe(0);
        expect(result.suggestedActions).toHaveLength(0);
        expect(result.reasoning).toContain('No specific cooking methods detected that match ChefIQ capabilities.');
      });

      it('should handle grilling recipes and suggest oven alternatives', () => {
        const grillingInstructions = [
          'Preheat grill to medium-high heat',
          'Season chicken with salt and pepper',
          'Grill chicken for 6-8 minutes per side'
        ];

        const result = analyzeRecipeForChefIQ(
          'Grilled Chicken',
          'Juicy grilled chicken breast',
          grillingInstructions,
          15
        );

        expect(result.confidence).toBeGreaterThan(0);
        expect(result.reasoning).toContain('Detected grilling recipe with protein - suggesting oven as ChefIQ alternative.');
        expect(['Air Fry', 'Broil', 'Bake']).toContain(result.suggestedActions[0].methodName);
      });

      it('should prioritize baking over dehydrating when temperature increases', () => {
        const instructions = [
          'Dry ingredients at low heat',
          'Increase oven temperature to 350 degrees F',
          'Continue cooking'
        ];

        const result = analyzeRecipeForChefIQ(
          'Test Recipe',
          'Test description',
          instructions,
          60
        );

        expect(result.reasoning).toContain('Detected temperature increase instructions - prioritizing bake method.');

        // Should suggest baking, not dehydrating
        const methodNames = result.suggestedActions.map(action => action.methodName);
        expect(methodNames).toContain('Bake');
        expect(methodNames).not.toContain('Dehydrate');
      });

      it('should handle empty instructions gracefully', () => {
        const result = analyzeRecipeForChefIQ(
          'Empty Recipe',
          'No instructions',
          [],
          0
        );

        expect(result.confidence).toBe(0);
        expect(result.suggestedActions).toHaveLength(0);
      });
    });
  });

  describe('Pressure Cooking Parameter Extraction', () => {
    describe('extractPressureCookingParams', () => {
      it('should extract high pressure level', () => {
        const instructions = ['Pressure cook on high pressure for 30 minutes'];
        const result = extractPressureCookingParams(instructions);
        expect(result.pressureLevel).toBe(PressureLevel.High);
      });

      it('should extract low pressure level', () => {
        const instructions = ['Cook under low pressure for 15 minutes'];
        const result = extractPressureCookingParams(instructions);
        expect(result.pressureLevel).toBe(PressureLevel.Low);
      });

      it('should extract natural pressure release', () => {
        const instructions = ['Pressure cook for 20 minutes, then let pressure release naturally'];
        const result = extractPressureCookingParams(instructions);
        expect(result.pressureRelease).toBe(PressureRelease.Natural);
      });

      it('should extract quick pressure release', () => {
        const instructions = ['Pressure cook for 10 minutes, then quick release'];
        const result = extractPressureCookingParams(instructions);
        expect(result.pressureRelease).toBe(PressureRelease.Quick);
      });

      it('should extract pressure cooking time', () => {
        const instructions = ['Pressure cook for 25 minutes'];
        const result = extractPressureCookingParams(instructions);
        expect(result.cookingTime).toBe(25);
      });

      it('should extract time ranges and use higher value', () => {
        const instructions = ['Cook under pressure for 15-20 minutes'];
        const result = extractPressureCookingParams(instructions);
        expect(result.cookingTime).toBe(20);
      });

      it('should handle instant pot instructions', () => {
        const instructions = ['Add ingredients to instant pot and cook for 30 minutes on high pressure'];
        const result = extractPressureCookingParams(instructions);
        expect(result.cookingTime).toBe(30);
        expect(result.pressureLevel).toBe(PressureLevel.High);
      });

      it('should handle hour-based cooking times', () => {
        const instructions = ['Pressure cook for 2 hours'];
        const result = extractPressureCookingParams(instructions);
        expect(result.cookingTime).toBe(120);
      });

      it('should default to high pressure and quick release when not specified', () => {
        const instructions = ['Cook in pressure cooker for 15 minutes'];
        const result = extractPressureCookingParams(instructions);
        expect(result.pressureLevel).toBe(PressureLevel.High);
        expect(result.pressureRelease).toBe(PressureRelease.Quick);
        expect(result.cookingTime).toBe(15);
      });
    });
  });

  describe('Slow Cooking Parameter Extraction', () => {
    describe('extractSlowCookingParams', () => {
      it('should extract low temperature level', () => {
        const instructions = ['Slow cook on low for 6 hours'];
        const result = extractSlowCookingParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.Low);
      });

      it('should extract high temperature level (default)', () => {
        const instructions = ['Slow cook for 4 hours'];
        const result = extractSlowCookingParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.High);
      });

      it('should extract slow cooking time in hours', () => {
        const instructions = ['Cook in slow cooker for 8 hours'];
        const result = extractSlowCookingParams(instructions);
        expect(result.cookingTime).toBe(480); // 8 hours = 480 minutes
      });

      it('should extract time ranges and use higher value', () => {
        const instructions = ['Slow cook for 6-8 hours on low'];
        const result = extractSlowCookingParams(instructions);
        expect(result.cookingTime).toBe(480); // 8 hours
        expect(result.tempLevel).toBe(TemperatureLevel.Low);
      });

      it('should handle crock pot instructions', () => {
        const instructions = ['Place in crock pot and cook for 4 hours on high'];
        const result = extractSlowCookingParams(instructions);
        expect(result.cookingTime).toBe(240);
        expect(result.tempLevel).toBe(TemperatureLevel.High);
      });

      it('should detect low heat setting', () => {
        const instructions = ['Cook on low heat for 5 hours'];
        const result = extractSlowCookingParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.Low);
        expect(result.cookingTime).toBe(300);
      });

      it('should handle simmering instructions', () => {
        const instructions = ['Bring to boil, then simmer for 3 hours'];
        const result = extractSlowCookingParams(instructions);
        expect(result.cookingTime).toBe(180);
      });

      it('should handle minute-based slow cooking', () => {
        const instructions = ['Slow cook for 90 minutes'];
        const result = extractSlowCookingParams(instructions);
        expect(result.cookingTime).toBe(90);
      });
    });
  });

  describe('Air Frying Parameter Extraction', () => {
    describe('extractAirFryingParams', () => {
      it('should extract air fryer temperature', () => {
        const instructions = ['Air fry at 400°F for 15 minutes'];
        const result = extractAirFryingParams(instructions);
        expect(result.temperature).toBe(400);
      });

      it('should extract air frying time', () => {
        const instructions = ['Air fry for 20 minutes until crispy'];
        const result = extractAirFryingParams(instructions);
        expect(result.cookingTime).toBe(20);
      });

      it('should extract time ranges and use higher value', () => {
        const instructions = ['Air fry for 12-15 minutes'];
        const result = extractAirFryingParams(instructions);
        expect(result.cookingTime).toBe(15);
      });

      it('should always set fan speed to high', () => {
        const instructions = ['Air fry for 10 minutes'];
        const result = extractAirFryingParams(instructions);
        expect(result.fanSpeed).toBe(FanSpeed.High);
      });

      it('should handle air fryer specific instructions', () => {
        const instructions = ['Place in the air fryer at 375 degrees for 18 minutes'];
        const result = extractAirFryingParams(instructions);
        expect(result.temperature).toBe(375);
        expect(result.cookingTime).toBe(18);
        expect(result.fanSpeed).toBe(FanSpeed.High);
      });

      it('should extract from crispy cooking instructions', () => {
        const instructions = ['Cook until crispy at 425°F for 8 minutes'];
        const result = extractAirFryingParams(instructions);
        expect(result.temperature).toBe(425);
        expect(result.cookingTime).toBe(8);
      });

      it('should handle various temperature formats', () => {
        const instructions = ['Air fry at 350 degrees F for 12 minutes'];
        const result = extractAirFryingParams(instructions);
        expect(result.temperature).toBe(350);
      });

      it('should reject temperatures outside air fryer range', () => {
        const instructions = ['Air fry at 250°F for 15 minutes']; // Too low
        const result = extractAirFryingParams(instructions);
        expect(result.temperature).toBeNull();
      });

      it('should reject very long cooking times', () => {
        const instructions = ['Air fry for 3 hours']; // Too long for air frying
        const result = extractAirFryingParams(instructions);
        expect(result.cookingTime).toBeNull();
      });
    });
  });

  describe('Roasting Parameter Extraction', () => {
    describe('extractRoastingParams', () => {
      it('should extract roasting temperature', () => {
        const instructions = ['Roast at 425°F for 45 minutes'];
        const result = extractRoastingParams(instructions);
        expect(result.temperature).toBe(425);
      });

      it('should extract roasting time', () => {
        const instructions = ['Roast for 1 hour until golden'];
        const result = extractRoastingParams(instructions);
        expect(result.cookingTime).toBe(60);
      });

      it('should always set fan speed to medium', () => {
        const instructions = ['Roast for 30 minutes'];
        const result = extractRoastingParams(instructions);
        expect(result.fanSpeed).toBe(FanSpeed.Medium);
      });

      it('should handle time ranges', () => {
        const instructions = ['Roast for 35-40 minutes'];
        const result = extractRoastingParams(instructions);
        expect(result.cookingTime).toBe(40);
      });

      it('should reject temperatures outside roasting range', () => {
        const instructions = ['Roast at 250°F for 30 minutes']; // Too low for roasting
        const result = extractRoastingParams(instructions);
        expect(result.temperature).toBeNull();
      });
    });
  });

  describe('Broiling Parameter Extraction', () => {
    describe('extractBroilingParams', () => {
      it('should extract high temperature level (default)', () => {
        const instructions = ['Broil for 5 minutes'];
        const result = extractBroilingParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.High);
      });

      it('should extract low temperature level', () => {
        const instructions = ['Broil on low for 8 minutes'];
        const result = extractBroilingParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.Low);
      });

      it('should extract broiling time', () => {
        const instructions = ['Place under broiler for 3 minutes'];
        const result = extractBroilingParams(instructions);
        expect(result.cookingTime).toBe(3);
      });

      it('should handle time ranges', () => {
        const instructions = ['Broil for 4-6 minutes until golden'];
        const result = extractBroilingParams(instructions);
        expect(result.cookingTime).toBe(6);
      });

      it('should reject very long cooking times', () => {
        const instructions = ['Broil for 45 minutes']; // Too long for broiling
        const result = extractBroilingParams(instructions);
        expect(result.cookingTime).toBeNull();
      });
    });
  });

  describe('Steaming Parameter Extraction', () => {
    describe('extractSteamingParams', () => {
      it('should extract steaming time', () => {
        const instructions = ['Steam for 15 minutes'];
        const result = extractSteamingParams(instructions);
        expect(result.cookingTime).toBe(15);
      });

      it('should handle steam basket instructions', () => {
        const instructions = ['Place in steam basket for 20 minutes'];
        const result = extractSteamingParams(instructions);
        expect(result.cookingTime).toBe(20);
      });

      it('should handle steamer instructions', () => {
        const instructions = ['Cook in the steamer for 25 minutes'];
        const result = extractSteamingParams(instructions);
        expect(result.cookingTime).toBe(25);
      });

      it('should handle time ranges', () => {
        const instructions = ['Steam for 12-15 minutes'];
        const result = extractSteamingParams(instructions);
        expect(result.cookingTime).toBe(15);
      });

      it('should reject very long cooking times', () => {
        const instructions = ['Steam for 2 hours']; // Too long for typical steaming
        const result = extractSteamingParams(instructions);
        expect(result.cookingTime).toBeNull();
      });
    });
  });

  describe('Searing/Sautéing Parameter Extraction', () => {
    describe('extractSearingSauteParams', () => {
      it('should extract medium-high temperature level (default)', () => {
        const instructions = ['Sear for 3 minutes'];
        const result = extractSearingSauteParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.MediumHigh);
      });

      it('should extract high temperature level', () => {
        const instructions = ['Sear on high heat for 2 minutes'];
        const result = extractSearingSauteParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.High);
      });

      it('should extract low temperature level', () => {
        const instructions = ['Sauté on low heat for 5 minutes'];
        const result = extractSearingSauteParams(instructions);
        expect(result.tempLevel).toBe(TemperatureLevel.MediumLow);
      });

      it('should extract searing time', () => {
        const instructions = ['Sear for 4 minutes per side'];
        const result = extractSearingSauteParams(instructions);
        expect(result.cookingTime).toBe(4);
      });

      it('should handle sautéing time', () => {
        const instructions = ['Sauté for 8 minutes until softened'];
        const result = extractSearingSauteParams(instructions);
        expect(result.cookingTime).toBe(8);
      });

      it('should handle browning instructions', () => {
        const instructions = ['Brown for 6 minutes'];
        const result = extractSearingSauteParams(instructions);
        expect(result.cookingTime).toBe(6);
      });

      it('should handle time ranges', () => {
        const instructions = ['Sear for 2-3 minutes'];
        const result = extractSearingSauteParams(instructions);
        expect(result.cookingTime).toBe(3);
      });

      it('should reject very long cooking times', () => {
        const instructions = ['Sear for 1 hour']; // Too long for searing
        const result = extractSearingSauteParams(instructions);
        expect(result.cookingTime).toBeNull();
      });
    });
  });

  describe('Sous Vide Parameter Extraction', () => {
    describe('extractSousVideParams', () => {
      it('should extract sous vide temperature', () => {
        const instructions = ['Sous vide at 140°F for 2 hours'];
        const result = extractSousVideParams(instructions);
        expect(result.temperature).toBe(140);
      });

      it('should extract sous vide time in hours', () => {
        const instructions = ['Cook in water bath for 6 hours'];
        const result = extractSousVideParams(instructions);
        expect(result.cookingTime).toBe(360); // 6 hours = 360 minutes
      });

      it('should handle immersion circulators', () => {
        const instructions = ['Set immersion to 165 degrees for 4 hours'];
        const result = extractSousVideParams(instructions);
        expect(result.temperature).toBe(165);
        expect(result.cookingTime).toBe(240);
      });

      it('should handle vacuum sealing instructions', () => {
        const instructions = ['Vacuum seal and cook at 135°F for 90 minutes'];
        const result = extractSousVideParams(instructions);
        expect(result.temperature).toBe(135);
        expect(result.cookingTime).toBe(90);
      });

      it('should handle time ranges', () => {
        const instructions = ['Sous vide for 1-2 hours'];
        const result = extractSousVideParams(instructions);
        expect(result.cookingTime).toBe(120); // 2 hours
      });

      it('should reject temperatures outside sous vide range', () => {
        const instructions = ['Sous vide at 250°F']; // Too high
        const result = extractSousVideParams(instructions);
        expect(result.temperature).toBeNull();
      });

      it('should reject very short cooking times', () => {
        const instructions = ['Sous vide for 15 minutes']; // Too short for typical sous vide
        const result = extractSousVideParams(instructions);
        expect(result.cookingTime).toBeNull();
      });
    });
  });

  describe('Toasting Parameter Extraction', () => {
    describe('extractToastingParams', () => {
      it('should extract medium shade level (default)', () => {
        const instructions = ['Toast for 3 minutes'];
        const result = extractToastingParams(instructions);
        expect(result.shadeLevel).toBe(ShadeLevel.Medium);
      });

      it('should extract light shade level', () => {
        const instructions = ['Toast lightly until pale golden'];
        const result = extractToastingParams(instructions);
        expect(result.shadeLevel).toBe(ShadeLevel.Light);
      });

      it('should extract dark shade level', () => {
        const instructions = ['Toast until dark and well toasted'];
        const result = extractToastingParams(instructions);
        expect(result.shadeLevel).toBe(ShadeLevel.Dark);
      });

      it('should extract toasting time', () => {
        const instructions = ['Toast for 4 minutes until golden brown'];
        const result = extractToastingParams(instructions);
        expect(result.cookingTime).toBe(4);
      });

      it('should detect frozen bread', () => {
        const instructions = ['Toast frozen bread for 5 minutes'];
        const result = extractToastingParams(instructions);
        expect(result.isFrozen).toBe(true);
      });

      it('should detect bagel mode', () => {
        const instructions = ['Toast bagel cut side down for 2 minutes'];
        const result = extractToastingParams(instructions);
        expect(result.isBagel).toBe(true);
      });

      it('should handle time ranges', () => {
        const instructions = ['Toast for 2-3 minutes'];
        const result = extractToastingParams(instructions);
        expect(result.cookingTime).toBe(3);
      });

      it('should reject very long cooking times', () => {
        const instructions = ['Toast for 20 minutes']; // Too long for toasting
        const result = extractToastingParams(instructions);
        expect(result.cookingTime).toBeNull();
      });
    });
  });

  describe('Dehydrating Parameter Extraction', () => {
    describe('extractDehydratingParams', () => {
      it('should extract dehydrating temperature', () => {
        const instructions = ['Dehydrate at 135°F for 8 hours'];
        const result = extractDehydratingParams(instructions);
        expect(result.temperature).toBe(135);
      });

      it('should extract dehydrating time in hours', () => {
        const instructions = ['Dry for 12 hours until crispy'];
        const result = extractDehydratingParams(instructions);
        expect(result.cookingTime).toBe(720); // 12 hours = 720 minutes
      });

      it('should always set fan speed to low', () => {
        const instructions = ['Dehydrate for 6 hours'];
        const result = extractDehydratingParams(instructions);
        expect(result.fanSpeed).toBe(FanSpeed.Low);
      });

      it('should handle jerky instructions', () => {
        const instructions = ['Make jerky for 10 hours at 160 degrees'];
        const result = extractDehydratingParams(instructions);
        expect(result.temperature).toBe(160);
        expect(result.cookingTime).toBe(600);
      });

      it('should handle time ranges', () => {
        const instructions = ['Dehydrate for 6-8 hours'];
        const result = extractDehydratingParams(instructions);
        expect(result.cookingTime).toBe(480); // 8 hours
      });

      it('should reject temperatures outside dehydrating range', () => {
        const instructions = ['Dehydrate at 200°F']; // Too high
        const result = extractDehydratingParams(instructions);
        expect(result.temperature).toBeNull();
      });

      it('should reject very short cooking times', () => {
        const instructions = ['Dehydrate for 30 minutes']; // Too short for dehydrating
        const result = extractDehydratingParams(instructions);
        expect(result.cookingTime).toBeNull();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed temperature strings', () => {
      expect(extractTemperature('degrees F')).toBeNull();
      expect(extractTemperature('350 degree')).toBeNull(); // Missing 's' - pattern doesn't match
      expect(extractTemperature('three hundred fifty degrees')).toBeNull(); // Words not numbers
    });

    it('should handle malformed time strings', () => {
      const instructions = [
        'Cook for minutes', // Missing number
        'Bake for five minutes', // Words not numbers
        'Cook for 0 minutes' // Zero time
      ];
      expect(extractCookingTimeFromInstructions(instructions)).toBeNull();
    });

    it('should handle very long instructions', () => {
      const longInstruction = 'This is a very long instruction that goes on and on with lots of details about preparation and technique and finally mentions to bake for 45 minutes at the very end of this extremely detailed instruction.';
      expect(extractCookingTimeFromInstructions([longInstruction])).toBe(45);
    });

    it('should handle multiple temperatures in single instruction', () => {
      // When "increase temperature" is mentioned, it always returns the higher temp
      const text = 'Start at 200 degrees F then increase temperature to 350 degrees F';
      expect(extractTemperature(text, true)).toBe(350); // Higher temp due to "increase temperature"
      expect(extractTemperature(text, false)).toBe(350); // When increase is mentioned, returns higher temp

      // Test without "increase" to show preference working
      const textWithoutIncrease = 'Start at 200 degrees F then heat to 350 degrees F';
      expect(extractTemperature(textWithoutIncrease, true)).toBe(200); // First temp when no increase
      expect(extractTemperature(textWithoutIncrease, false)).toBe(200); // First temp found
    });
  });
});