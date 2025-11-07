# CLAUDE.md - AI Assistant Development Guidelines

**Purpose:** Guidelines and rules for AI assistants (Claude, GPT, etc.) when working on Recipe Studio development.

**Last Updated:** 2025-11-06

---

## Table of Contents

1. [Critical Rules](#critical-rules)
2. [Before You Start](#before-you-start)
3. [Required Reading](#required-reading)
4. [Project Architecture](#project-architecture)
5. [Development Workflow](#development-workflow)
6. [Code Standards](#code-standards)
7. [AI Features & Services](#ai-features--services)
8. [Testing Requirements](#testing-requirements)
9. [Common Pitfalls](#common-pitfalls)
10. [Documentation Updates](#documentation-updates)

---

## Critical Rules

### 🚨 READ DOCS FIRST - ALWAYS

**Before making ANY changes:**

1. ✅ **Read relevant documentation files** in the `docs/` folder and root
2. ✅ **Check existing implementation** in the codebase
3. ✅ **Understand the context** of the feature or bug
4. ✅ **Ask for clarification** if requirements are unclear
5. ❌ **NEVER assume** - always verify

**Key principle:** The documentation is the source of truth. Code should match the docs.

---

### 🚫 Never Do These Things

1. ❌ **Do NOT change Gemini model versions** without explicit approval
   - Current: `gemini-2.5-flash-lite` (production-ready, 80% cheaper)
   - See: `docs/MIGRATION_SUMMARY.md` for why we use this version

2. ❌ **Do NOT add new API dependencies** without approval
   - Every API has cost implications
   - See: `docs/AI_FEATURE_COST_ANALYSIS.md` and `docs/SPOONACULAR_COST_ANALYSIS.md`

3. ❌ **Do NOT modify Firebase security rules** without review
   - See: `docs/TECHNICAL_SETUP.md` for current rules
   - Security rules must be tested before deployment

4. ❌ **Do NOT change configuration constants** without understanding impact
   - See: `docs/CONFIGURATION_GUIDE.md` for how configs affect cost/performance

5. ❌ **Do NOT create new files** unless absolutely necessary
   - Always prefer editing existing files
   - Check if functionality exists elsewhere first

6. ❌ **Do NOT remove error handling** or retry logic
   - See: `docs/AI_IMPLEMENTATION_GUIDE.md` for retry strategies

---

## Before You Start

### 1. Understand the Request

**Ask yourself:**
- What is the user actually trying to achieve?
- Is there existing functionality that does this?
- What files will be affected?
- What are the cost/performance implications?

### 2. Read the Relevant Docs

**For AI features:**
- `docs/AI_IMPLEMENTATION_GUIDE.md` - How AI features work
- `docs/AI_FEATURE_COST_ANALYSIS.md` - Cost implications
- `docs/MIGRATION_SUMMARY.md` - Recent changes

**For configuration:**
- `docs/CONFIGURATION_GUIDE.md` - All configurable parameters
- `docs/TECHNICAL_SETUP.md` - Service setup

**For features:**
- `docs/FEATURES_PROGRESS.md` - What's implemented
- `docs/PROJECT_OVERVIEW.md` - Project context

### 3. Search the Codebase

**Before writing new code:**
```typescript
// Check if functionality exists:
// - Search for similar function names
// - Check service files (src/services/)
// - Check hooks (src/hooks/)
// - Check utils (src/utils/)
```

**Common locations:**
- `src/services/` - API integrations (Gemini, Firebase, Spoonacular)
- `src/hooks/` - Reusable React hooks
- `src/screens/` - Screen components
- `src/components/` - Reusable UI components
- `src/utils/` - Utility functions and constants

---

## Required Reading

### Essential Docs (Read These First)

1. **`docs/PROJECT_OVERVIEW.md`** - Understand project context and goals
2. **`docs/TECHNICAL_SETUP.md`** - Service configurations and setup
3. **`docs/AI_IMPLEMENTATION_GUIDE.md`** - How AI features work
4. **`docs/FEATURES_PROGRESS.md`** - What's implemented and what's pending
5. **`docs/README.md`** - Quick start and installation guide

### Feature-Specific Docs

**Before working on:**
- **Recipe generation:** Read `docs/AI_IMPLEMENTATION_GUIDE.md` sections on prompts
- **Image/PDF import:** Read `docs/MIGRATION_SUMMARY.md` (multimodal vision)
- **ChefIQ integration:** Read `docs/TECHNICAL_SETUP.md` ChefIQ section
- **My Fridge feature:** Read `docs/AI_IMPLEMENTATION_GUIDE.md` My Fridge section
- **Configuration changes:** Read `docs/CONFIGURATION_GUIDE.md` (REQUIRED)

### Cost & Performance Docs

**Before suggesting changes that affect:**
- API calls: Read `docs/AI_FEATURE_COST_ANALYSIS.md` and `docs/SPOONACULAR_COST_ANALYSIS.md`
- Performance: Read `docs/CONFIGURATION_GUIDE.md`
- Quotas: Read relevant API cost analysis docs

### Available Documentation Files

**Core Documentation (10 files):**
```
├── CLAUDE.md                               # This file - AI assistant guidelines (root)
└── docs/
    ├── README.md                           # Quick start and setup
    ├── PROJECT_OVERVIEW.md                 # Project context and competition info
    ├── FEATURES_PROGRESS.md                # Feature implementation status
    ├── AI_IMPLEMENTATION_GUIDE.md          # AI features deep dive
    ├── AI_FEATURE_COST_ANALYSIS.md         # Gemini AI cost analysis
    ├── SPOONACULAR_COST_ANALYSIS.md        # Spoonacular API costs
    ├── TECHNICAL_SETUP.md                  # All service setup guides
    ├── CONFIGURATION_GUIDE.md              # Configuration parameters
    └── MIGRATION_SUMMARY.md                # Gemini 2.5 Flash-Lite migration
```

**Note:**
- `CLAUDE.md` stays in root for easy access
- All other docs are in the `docs/` folder
- Feature-specific implementation docs have been consolidated into the main guides to reduce redundancy

---

## Project Architecture

### Tech Stack

```
React Native + Expo
├── TypeScript
├── Firebase (Auth, Firestore, Storage)
├── Google Gemini AI (2.5 Flash-Lite)
├── Spoonacular API (My Fridge feature)
└── React Navigation
```

### Key Design Patterns

1. **Service Layer Pattern**
   - Services handle all external API calls
   - Located in `src/services/`
   - Services should have retry logic and error handling

2. **Custom Hooks Pattern**
   - Complex logic extracted into hooks
   - Located in `src/hooks/`
   - Hooks handle state management and side effects

3. **Constants Separation**
   - All magic numbers/strings in constants files
   - Located in `src/utils/constants/` and `src/services/constants/`

4. **Type Safety**
   - TypeScript interfaces for all data structures
   - Located in `src/types/`
   - No `any` types without good reason

### File Structure

```
src/
├── services/           # External API integrations
│   ├── gemini.service.ts
│   ├── firebase.service.ts
│   ├── spoonacular.service.ts
│   └── constants/      # Service-specific constants
├── hooks/             # Custom React hooks
├── screens/           # Screen components
├── components/        # Reusable UI components
│   ├── modals/        # Modal components
│   └── common/        # Shared components
├── utils/             # Utility functions
│   └── constants/     # App-wide constants
├── types/             # TypeScript types
└── navigation/        # Navigation config
```

---

## Development Workflow

### 1. Planning Phase

**Before writing code:**

```markdown
1. Read relevant documentation
2. Search for existing implementations
3. Identify files to modify
4. Consider cost/performance impact
5. Plan error handling strategy
6. Think about edge cases
```

### 2. Implementation Phase

**Writing code:**

```markdown
1. Use existing patterns from codebase
2. Follow TypeScript best practices
3. Add proper error handling
4. Include retry logic for API calls
5. Add loading states for async operations
6. Consider offline scenarios
```

### 3. Testing Phase

**Before claiming done:**

```markdown
1. Test happy path
2. Test error scenarios
3. Test edge cases
4. Verify API costs (if applicable)
5. Check performance impact
6. Test on both iOS and Android (if UI changes)
```

### 4. Documentation Phase

**After implementation:**

```markdown
1. Update relevant .md files if needed
2. Add code comments for complex logic
3. Update FEATURES_PROGRESS.md if feature is new
4. Create new doc file if feature is substantial
```

---

## Code Standards

### TypeScript

**DO:**
```typescript
// Use explicit types
interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
}

// Use async/await with proper error handling
async function fetchRecipe(id: string): Promise<Recipe> {
  try {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recipe:', error);
    throw error;
  }
}
```

**DON'T:**
```typescript
// Don't use any
function process(data: any) { } // ❌

// Don't ignore errors
async function fetch() {
  try {
    return await api.get('/data');
  } catch (e) {} // ❌
}
```

### React Native

**DO:**
```typescript
// Use functional components with hooks
const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View>
      {isLoading ? <ActivityIndicator /> : <Text>{recipe.title}</Text>}
    </View>
  );
};

// Extract complex logic to custom hooks
const useRecipeData = (recipeId: string) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  // ... hook logic
  return { recipe, isLoading, error };
};
```

**DON'T:**
```typescript
// Don't use inline styles for complex components
<View style={{ marginTop: 10, padding: 20, ... }} /> // ❌

// Use StyleSheet.create() instead
const styles = StyleSheet.create({
  container: { marginTop: 10, padding: 20 }
});
```

### Error Handling

**API Calls:**
```typescript
// Always include retry logic for API calls
const retryableErrors = [503, 429];

try {
  const response = await api.call();
  return response;
} catch (error) {
  if (retryableErrors.includes(error.status) && retryCount < MAX_RETRIES) {
    await delay(RETRY_DELAY_MS);
    return retry();
  }
  throw error;
}
```

**User-Facing Errors:**
```typescript
// Show user-friendly error messages
try {
  await generateRecipe();
} catch (error) {
  Alert.alert(
    'Generation Failed',
    'We couldn\'t generate your recipe. Please try again.',
    [{ text: 'OK' }]
  );
}
```

---

## AI Features & Services

### Gemini AI Service

**File:** `src/services/gemini.service.ts`

**Key Functions:**
- `generateRecipeFromDescription()` - Generate recipe from text
- `parseRecipeFromImage()` - Extract recipe from image (multimodal)
- `parseRecipeFromPDF()` - Extract recipes from PDF
- `analyzeCookingActionsWithGemini()` - Detect ChefIQ cooking actions

**Critical Rules:**

1. **Model Version:** Always use `gemini-2.5-flash-lite`
   ```typescript
   // ✅ Correct
   const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

   // ❌ Don't change without approval
   ```

2. **Retry Logic:** Always retry on 503/429 errors
   ```typescript
   if (response.status === 503 || response.status === 429) {
     // Retry with exponential backoff
   }
   ```

3. **Temperature Settings:**
   - Text extraction: `0.0` (deterministic)
   - Recipe generation: `0.7` (creative)
   - Never use `1.0` or higher

4. **Rate Limiting:**
   - Free tier: 15 requests/minute, 50 requests/day
   - Add delays between requests: 3-4 seconds
   - See: `CONFIGURATION_GUIDE.md`

### Image Recognition

**Current Method:** Gemini Multimodal Vision (not Google Cloud Vision)

```typescript
// ✅ Correct - Uses Gemini multimodal
const recipe = await parseRecipeFromImage(imageUri);

// ❌ Deprecated - Don't use Cloud Vision
const text = await googleVision.detectText(imageUri);
```

**Why:** 85-90% cheaper, better accuracy, single API call
**See:** `MIGRATION_SUMMARY.md` for full explanation

### Firebase Service

**File:** `src/services/firebase.service.ts`

**Key Functions:**
- `saveRecipe()` - Save recipe to Firestore
- `uploadImage()` - Upload to Storage
- `checkUserGenerationLimit()` - Check daily AI generation quota

**Security Rules:**
- Users can only access their own data
- See `docs/TECHNICAL_SETUP.md` for full rules
- **Never modify rules without testing**

### Spoonacular Service

**File:** `src/services/spoonacular.service.ts`

**Used For:** My Fridge feature only
- Ingredient autocomplete
- Recipe search by ingredients

**Free Tier:** 150 requests/day
**Cost:** See `docs/SPOONACULAR_COST_ANALYSIS.md`

---

## Testing Requirements

### Before Committing

**Run these checks:**

```bash
# TypeScript compilation
npx tsc --noEmit

# Run on device/emulator
npx expo start

# Test specific features
# - Test happy path
# - Test error cases
# - Test offline scenarios
```

### Manual Testing Checklist

**For AI features:**
- [ ] Test with valid input
- [ ] Test with invalid/empty input
- [ ] Test when API is rate limited (simulate)
- [ ] Test when offline
- [ ] Verify cost implications
- [ ] Check loading states
- [ ] Verify error messages

**For UI changes:**
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Test different screen sizes
- [ ] Test light/dark mode (if applicable)
- [ ] Test accessibility

**For data operations:**
- [ ] Test create operation
- [ ] Test read operation
- [ ] Test update operation
- [ ] Test delete operation
- [ ] Verify Firebase security rules

---

## Common Pitfalls

### 1. Changing Gemini Model Version

**Problem:** Developer changes model from 2.5 Flash-Lite to another version

**Why it's bad:**
- 80% higher cost with 2.0 Flash
- May lose production-ready stability
- Breaks cost assumptions in docs

**Solution:** Always use `gemini-2.5-flash-lite` unless explicitly approved

---

### 2. Ignoring Configuration Impact

**Problem:** Changing `PAGES_PER_CHUNK` from 8 to 15 without reading docs

**Why it's bad:**
- May hit file size limits (400 errors)
- Changes cost calculations
- Affects processing time

**Solution:** Read `docs/CONFIGURATION_GUIDE.md` before changing ANY config

---

### 3. Not Handling Rate Limits

**Problem:** No retry logic on 429 errors

**Why it's bad:**
- Users see cryptic errors
- Free tier hits limit quickly
- Poor user experience

**Solution:** Always implement retry logic with delays

```typescript
if (response.status === 429) {
  await delay(RATE_LIMIT_RETRY_DELAY_MS);
  return retry();
}
```

---

### 4. Forgetting Error Handling

**Problem:** API calls without try/catch

**Why it's bad:**
- App crashes on errors
- No user feedback
- Hard to debug

**Solution:** Always wrap API calls in try/catch with user-friendly errors

---

### 5. Not Checking for Existing Functionality

**Problem:** Writing new function that already exists elsewhere

**Why it's bad:**
- Code duplication
- Maintenance burden
- May have subtle bugs

**Solution:** Search codebase before writing new code

---

### 6. Hardcoding Values

**Problem:** Using magic numbers/strings directly in code

**Why it's bad:**
- Hard to maintain
- No single source of truth
- Difficult to change later

**Solution:** Use constants from `src/utils/constants/` or `src/services/constants/`

```typescript
// ❌ Bad
await delay(4000);

// ✅ Good
await delay(DELAY_BETWEEN_CHUNKS_MS);
```

---

### 7. Ignoring Cost Implications

**Problem:** Adding API calls without checking cost

**Why it's bad:**
- May exceed free tier quickly
- Unexpected costs for users
- Unsustainable at scale

**Solution:** Check cost analysis docs before adding API calls

---

### 8. Skipping Documentation Updates

**Problem:** Implementing feature but not updating docs

**Why it's bad:**
- Future developers (and AI) won't know about changes
- Documentation becomes stale
- Leads to confusion and bugs

**Solution:** Update relevant .md files after implementation

---

## Documentation Updates

### When to Update Docs

**Always update docs when:**
- Adding new feature
- Changing API integrations
- Modifying configurations
- Changing cost implications
- Fixing significant bugs
- Adding new services

### Which Docs to Update

**For new features:**
- `docs/FEATURES_PROGRESS.md` - Add to implemented list
- Generally avoid creating new feature-specific docs (consolidate into main guides)

**For AI changes:**
- `docs/AI_IMPLEMENTATION_GUIDE.md` - Update implementation details
- `docs/AI_FEATURE_COST_ANALYSIS.md` - Update cost calculations

**For configuration changes:**
- `docs/CONFIGURATION_GUIDE.md` - Update affected parameters
- Explain impact on cost/performance/quality

**For setup changes:**
- `docs/TECHNICAL_SETUP.md` - Update setup instructions
- `.env.example` - Update environment variables

### Doc Format Guidelines

**Follow existing format:**
```markdown
# Title

**Brief description**

---

## Section Headers with Clear Hierarchy

### Subsections

**Key points in bold**

```code blocks with language specified```

- Bullet points for lists
- Keep consistent formatting

**Examples:**
- Use real code examples
- Show both good and bad patterns
```

---

## Example Workflow

### Scenario: Add New AI Feature

**1. Request:**
> "Add feature to generate recipe variations"

**2. Planning:**
```markdown
[ ] Read docs/AI_IMPLEMENTATION_GUIDE.md
[ ] Read docs/AI_FEATURE_COST_ANALYSIS.md
[ ] Check if similar functionality exists
[ ] Identify affected files (gemini.service.ts, etc.)
[ ] Calculate cost impact
[ ] Plan error handling
```

**3. Implementation:**
```typescript
// src/services/gemini.service.ts

export async function generateRecipeVariation(
  originalRecipe: Recipe,
  variationType: 'vegetarian' | 'vegan' | 'low-carb'
): Promise<Recipe> {
  try {
    // Implementation with proper error handling
    // Use existing retry logic pattern
    // Add rate limit checks
  } catch (error) {
    // User-friendly error handling
  }
}
```

**4. Testing:**
```markdown
[ ] Test with valid recipe
[ ] Test with invalid input
[ ] Test rate limiting
[ ] Test offline scenario
[ ] Verify cost (should be ~$0.001 per variation)
[ ] Test on iOS and Android
```

**5. Documentation:**
```markdown
[ ] Update docs/AI_IMPLEMENTATION_GUIDE.md
[ ] Update docs/AI_FEATURE_COST_ANALYSIS.md
[ ] Update docs/FEATURES_PROGRESS.md
[ ] Add code comments
```

---

## Quick Reference

### Most Important Docs

1. **Before any changes:** `CLAUDE.md` (this file - in root)
2. **For AI features:** `docs/AI_IMPLEMENTATION_GUIDE.md`
3. **For configs:** `docs/CONFIGURATION_GUIDE.md`
4. **For setup:** `docs/TECHNICAL_SETUP.md`
5. **For costs:** `docs/AI_FEATURE_COST_ANALYSIS.md`

### All Available Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| `CLAUDE.md` | AI assistant guidelines | **Always read first** |
| `docs/README.md` | Quick start guide | Initial setup |
| `docs/PROJECT_OVERVIEW.md` | Project context | Understanding goals |
| `docs/FEATURES_PROGRESS.md` | Feature status | Before adding features |
| `docs/AI_IMPLEMENTATION_GUIDE.md` | AI features deep dive | Working with AI |
| `docs/AI_FEATURE_COST_ANALYSIS.md` | Gemini costs | Adding AI features |
| `docs/SPOONACULAR_COST_ANALYSIS.md` | API costs | My Fridge feature |
| `docs/TECHNICAL_SETUP.md` | Service setup | Initial configuration |
| `docs/CONFIGURATION_GUIDE.md` | Config parameters | Changing configs |
| `docs/MIGRATION_SUMMARY.md` | Recent changes | Understanding current state |

### Most Important Rules

1. ✅ **Always read docs first**
2. ✅ **Search for existing functionality**
3. ✅ **Consider cost implications**
4. ✅ **Add proper error handling**
5. ✅ **Test thoroughly before claiming done**
6. ✅ **Update documentation**

### Contact for Questions

**Project Repository:** Recipe Studio (ChefIQ competition entry)
**Documentation:** 10 core .md files in root directory
**Technical Issues:** Check existing docs first, then ask user

---

## Documentation Cleanup Summary

**Removed Files (6):**
- `AI_COVER_GENERATION_FEATURE.md` - Implementation details now in `docs/AI_IMPLEMENTATION_GUIDE.md`
- `HAPTIC_FEEDBACK_INTEGRATION.md` - Implementation-specific, not needed for future development
- `OCR_UX_IMPROVEMENTS.md` - Historical changes, consolidated into guides
- `TEXT_IMPORT_IMPROVEMENTS.md` - Historical changes, consolidated into guides
- `FIREBASE_STORAGE_SETUP.md` - Setup steps now in `docs/TECHNICAL_SETUP.md`
- `PRESENTATION_INDEX.md` - Presentation-specific, not needed for development

**Retained Files (10):**
- Core documentation covering all essential topics
- Comprehensive guides for AI, costs, configuration, and setup
- No loss of critical information - all content consolidated

**Reorganization:**
- Moved all docs (except CLAUDE.md) to `docs/` folder
- Removed 4 old implementation-specific docs from `docs/` folder
- `CLAUDE.md` stays in root for easy access

**Result:**
- Clean structure: 1 file in root + 9 files in docs/ = 10 total
- All file paths updated in CLAUDE.md
- Easier navigation and maintenance

---

## Version History

- **2025-11-07**: Documentation reorganization
  - Moved all documentation to `docs/` folder (except CLAUDE.md in root)
  - Updated all file paths throughout CLAUDE.md
  - Removed 10+ redundant/outdated feature-specific docs
  - Final structure: 1 (root) + 9 (docs/) = 10 essential files

- **2025-11-06**: Initial version created
  - Created comprehensive CLAUDE.md with AI assistant guidelines
  - Based on existing project documentation
  - Includes development rules, patterns, and best practices
  - Covers all major features and common pitfalls

---

## Final Reminder

**🚨 CRITICAL: READ DOCUMENTATION BEFORE MAKING CHANGES 🚨**

This project has extensive documentation for a reason. Every feature, configuration, and cost implication has been carefully documented. Reading the docs will:

- Save time (avoid reimplementing existing features)
- Prevent bugs (understand existing patterns)
- Maintain quality (follow established standards)
- Control costs (understand API usage)
- Ensure consistency (match existing code style)

**When in doubt, read the docs. When certain, read them anyway.**
