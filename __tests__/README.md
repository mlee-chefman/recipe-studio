# Recipe Studio Tests

This directory contains unit tests for the Recipe Studio application.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### recipeAnalyzer.test.ts
Comprehensive unit tests for the recipe analyzer functionality including:

- **Temperature Extraction**: Tests for extracting cooking temperatures from recipe instructions
  - Various temperature formats (°F, degrees F, etc.)
  - Preheat instructions
  - Temperature increase instructions
  - Bake instructions
  - Edge cases and error handling

- **Cooking Time Extraction**: Tests for extracting cooking times from recipe instructions
  - Basic time extraction (minutes, hours)
  - Time ranges (20-25 minutes)
  - Additional cooking times ("bake for an additional 30 minutes")
  - Various cooking verbs (bake, cook, roast, etc.)
  - Filtering preparation steps

- **Recipe Analysis Integration**: Tests for the full recipe analysis workflow
  - BBQ ribs recipe analysis (multiple temperatures and times)
  - Sausage bake recipe analysis
  - Grilling recipe alternatives
  - Baking vs dehydrating prioritization
  - Empty and invalid recipes

- **Edge Cases and Error Handling**: Tests for malformed inputs and boundary conditions

## Coverage
The recipe analyzer tests achieve:
- **84.28%** statement coverage
- **74.85%** branch coverage
- **90%** function coverage

## Test Examples

The tests use real-world recipe examples:
- **BBQ Baby Back Ribs**: Complex recipe with temperature changes (250°F → 350°F) and multiple cooking times
- **Sausage Bake**: Simple recipe with time range (20-25 minutes)
- **Grilling Recipes**: Tests oven alternatives for outdoor grilling

## Adding New Tests

When adding new features to the recipe analyzer:
1. Add unit tests for individual functions
2. Add integration tests for the full analysis workflow
3. Include edge cases and error conditions
4. Use real-world recipe examples when possible