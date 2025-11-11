# AI Recipe Generation - Cost Analysis & Usage Limits

## Overview
This document provides cost estimates for the AI recipe generation feature using Google Gemini API and outlines strategies to control costs at scale.

## API Pricing (as of 2025)

### Google Gemini 2.5 Flash-Lite
- **Input tokens**: $0.075 per 1M tokens (~750K words)
- **Output tokens**: $0.030 per 1M tokens (~750K words)
- **Free tier**: 2M input tokens + 0.5M output tokens per day (as of Jan 2025)
- **Note**: 2.5 Flash-Lite is ~90% cheaper for output tokens compared to 2.0 Flash

### Typical Recipe Generation Request

#### Input Tokens (Prompt + User Description)
- System prompt: ~330 tokens
- User description: ~10-30 tokens ("simple pork chop")
- **Total input per request**: ~350 tokens

#### Output Tokens (Generated Recipe)
- Recipe JSON response: ~400-800 tokens (depending on complexity)
- **Average output per request**: ~600 tokens

### Cost Per Recipe Generation
```
Input cost:  350 tokens × $0.075 / 1M = $0.000026
Output cost: 600 tokens × $0.030 / 1M = $0.000018
───────────────────────────────────────────────
Total cost per recipe: ~$0.000044 (0.004 cents)
~80% cost reduction vs. Gemini 2.0 Flash
```

### Full Course Menu Generation (NEW Feature)

**What it is:** Generate a complete 3-course meal (Appetizer, Main Course, Dessert) from available ingredients.

**Requirement:** Minimum 5 ingredients in "My Kitchen" to unlock this feature.

**Token Usage:**
- Input: ~500 tokens (larger prompt for cohesive menu planning)
- Output: ~1800 tokens (3 complete recipes)
- **Total tokens**: ~2300 tokens per full course generation

**Cost Per Full Course Menu:**
```
Input cost:  500 tokens × $0.075 / 1M = $0.000038
Output cost: 1800 tokens × $0.030 / 1M = $0.000054
───────────────────────────────────────────────
Total cost per full course: ~$0.000092 (0.009 cents)
Still extremely affordable! 3 recipes for less than 1/100th of a cent
```

**Comparison:**
- Single recipe generation: $0.000044
- Full course (3 recipes): $0.000092
- **2.1x more expensive** but generates **3x more recipes**
- **Cost per recipe in full course: $0.000031** (30% cheaper per recipe!)

**Appliance Detection (Included):**
- Each recipe in full course menu automatically detects ChefIQ appliances
- Additional ~150 tokens input + ~400 tokens output per recipe
- **Added cost per full course**: ~$0.000050 (3 appliance detections)
- **Total with appliance detection**: ~$0.000142 per full course menu

## AI Image Generation - Imagen 4 Costs

### Overview
Recipe Studio uses **Google Imagen 4** for AI-generated recipe cover photos. This feature automatically generates professional food photography for recipes.

### Imagen 4 Pricing (as of 2025)

| Model | Cost per Image | Speed | Quality | Use Case |
|-------|---------------|-------|---------|----------|
| **Imagen 4 (Standard)** | **$0.04** | ~5.8s | Excellent | **Current implementation** |
| Imagen 4 Fast | $0.02 | ~3-4s | Good | High-volume, budget-conscious |
| Imagen 4 Ultra | $0.06 | ~6-8s | Best | Premium, highest quality |

**Current Implementation:** `imagen-4.0-generate-001` (Standard)

### Image Generation Specifications

**Technical Details:**
- **Model**: `imagen-4.0-generate-001`
- **Resolution**: 1K (1024×1024 equivalent)
- **Aspect Ratio**: 4:3 (optimized for recipe cards)
- **Generation Time**: ~5.8 seconds per image
- **Max Images**: 1-4 per request (currently: 1)

**Features:**
- Photorealistic food photography
- Professional lighting and shadows
- Accurate textures and details (water droplets, surfaces)
- Excellent ingredient representation
- Automatic SynthID watermarking

### Cost Per Recipe With AI Cover

**Scenario 1: Text-only recipe generation**
```
Recipe generation (Gemini): $0.000044
AI cover photo (Imagen 4):  $0.04
──────────────────────────────────────
Total per recipe:           $0.040044
```

**Scenario 2: Full course menu with AI covers**
```
Full course (3 recipes):    $0.000142
AI covers (3 × $0.04):      $0.12
──────────────────────────────────────
Total per full course:      $0.120142
```

### Monthly Cost Projections - With AI Covers

Assuming 50% of recipes use AI cover generation:

| Users | Recipes/Month | AI Covers (50%) | Recipe Cost | Image Cost | **Total/Month** |
|-------|---------------|-----------------|-------------|------------|-----------------|
| 100 | 500 | 250 | $0.02 | **$10.00** | **$10.02** |
| 1,000 | 5,000 | 2,500 | $0.22 | **$100.00** | **$100.22** |
| 10,000 | 50,000 | 25,000 | $2.20 | **$1,000.00** | **$1,002.20** |
| 100,000 | 500,000 | 250,000 | $22.00 | **$10,000.00** | **$10,022.00** |

**Key Insight:** AI image generation is **200-2000x more expensive** than text generation. This is the primary cost driver for the app.

### Cost Optimization Strategies - Images

#### 1. Usage Limits (Critical for Images)

**Recommended Limits:**
```typescript
const IMAGE_GENERATION_LIMITS = {
  FREE_TIER: {
    imagesPerDay: 1,      // Very restrictive
    imagesPerMonth: 5,    // ~$0.20/user/month
  },
  PREMIUM_TIER: {
    imagesPerDay: 3,
    imagesPerMonth: 30,   // ~$1.20/user/month
  },
};
```

**Cost Impact with Limits:**
- 10,000 users, 1 image/day limit: $10,000/month → **$200/month** (98% savings)
- 10,000 users, 5 images/month limit: $1,000/month → **$200/month** (80% savings)

#### 2. Optional Feature (Recommended)

**Make AI covers opt-in, not automatic:**
```typescript
// User must explicitly request AI cover
if (userRequestedAICover && !limitReached) {
  await generateAICover();
}
```

**Benefits:**
- Users who want manual photos save costs
- Free tier users can opt-in selectively
- Reduces wasteful generation

**Expected adoption rate:** 20-30% of recipes
**Cost reduction:** 70-80%

#### 3. Alternative: Imagen 4 Fast

**Switch to Fast model for cost savings:**
```typescript
// Change in imageGeneration.service.ts
const IMAGEN_4_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict';
export const IMAGEN_COST_PER_IMAGE = 0.02; // 50% cheaper
```

**Trade-offs:**
- ✅ **50% cost reduction** ($0.02 vs $0.04)
- ✅ **Faster generation** (~3-4s vs ~5.8s)
- ⚠️ **Slightly lower quality** (still good for most use cases)

**Recommendation:** Use Fast for free tier, Standard for premium tier

#### 4. Image Caching & Reuse

**Cache popular recipe types:**
```typescript
// Pre-generate covers for common recipe categories
const CACHED_COVERS = {
  'pasta': 'gs://recipe-studio/covers/pasta-generic.jpg',
  'chicken': 'gs://recipe-studio/covers/chicken-generic.jpg',
  // ...
};

// Use cached cover if available, generate if custom requested
```

**Estimated savings:** 40-60% for common recipe types

#### 5. Progressive Feature Rollout

**Tiered AI cover access:**
- **Free users**: No AI covers (manual upload only)
- **Basic premium** ($2.99/mo): 5 AI covers/month
- **Pro premium** ($9.99/mo): 30 AI covers/month

### Speed Comparison

| Feature | Speed | Cost |
|---------|-------|------|
| Text recipe generation (Gemini) | ~2-4s | $0.000044 |
| AI cover (Imagen 4 Standard) | **~5.8s** | **$0.04** |
| AI cover (Imagen 4 Fast) | ~3-4s | $0.02 |
| AI cover (Imagen 4 Ultra) | ~6-8s | $0.06 |

**Total time for recipe + cover:** ~8-10 seconds

### Current Implementation Summary

**Active Configuration:**
- ✅ Model: Imagen 4 Standard (`imagen-4.0-generate-001`)
- ✅ Cost: $0.04 per image
- ✅ Speed: ~5.8 seconds
- ✅ Quality: Excellent photorealism
- ✅ Resolution: 1K
- ✅ Aspect ratio: 4:3
- ⚠️ **Usage limits**: Currently none (needs implementation!)

**Recommended Actions:**
1. **Implement image generation limits** (1/day for free users)
2. **Make AI covers opt-in** (not automatic)
3. **Consider switching to Imagen 4 Fast** (50% cost savings)
4. **Track image generation usage** per user
5. **Add premium tier** for unlimited AI covers

## Scaling Cost Projections

### Monthly Usage Scenarios - Text Only (No Images)

| Users | Generations/User/Month | Total Generations | Monthly Cost | Notes |
|-------|------------------------|-------------------|--------------|-------|
| 100 | 5 | 500 | $0.02 | Early stage |
| 1,000 | 5 | 5,000 | $0.22 | Small scale |
| 10,000 | 5 | 50,000 | $2.20 | Medium scale |
| 100,000 | 5 | 500,000 | $22.00 | Large scale |
| 1,000,000 | 3 | 3,000,000 | $132.00 | Enterprise scale |

### Key Insights
1. **Extremely affordable at all scales** - Under $2.20/month for 10K users (80% cheaper than 2.0 Flash)
2. **Scales linearly** - No volume discounts currently, but cost is predictable
3. **Free tier covers ~45,000+ recipe generations per day** for development/testing

## Cost Optimization Strategies

### 1. Usage Limits (Recommended)

#### Per-User Rate Limits
```typescript
// Recommended limits to prevent abuse
const USAGE_LIMITS = {
  FREE_TIER: {
    generationsPerDay: 3,
    generationsPerMonth: 20,
  },
  PREMIUM_TIER: {
    generationsPerDay: 10,
    generationsPerMonth: 100,
  },
};
```

**Rationale**:
- Most users won't need more than 3-5 recipe generations per day
- Prevents abuse and bot traffic
- Keeps monthly costs predictable

#### Implementation Cost Impact
With 10,000 users:
- **Without limits**: 5 gens/user/month = $2.20/month
- **With limits (3/day)**: Average 2-3 gens/user/month = $0.88-$1.32/month
- **Savings**: ~40-60% cost reduction

### 2. Caching Strategy

#### Cache Common Requests
```typescript
// Cache recipes for common descriptions
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const cacheKey = description.toLowerCase().trim();
if (cachedRecipe && Date.now() - cachedRecipe.timestamp < CACHE_TTL) {
  return cachedRecipe.recipe; // Free, instant response
}
```

**Estimated savings**: 30-50% for common queries like:
- "simple pork chop"
- "easy chicken pasta"
- "chocolate chip cookies"

### 3. Prompt Optimization

#### Current Prompt: ~330 tokens
Potential optimizations:
- Reduce verbosity in guidelines: Save ~50 tokens
- Use shorter field names: Save ~20 tokens
- **Optimized prompt**: ~260 tokens (-21% cost)

### 4. Smart Features

#### Request Validation
```typescript
// Reject invalid/spam requests before API call
if (description.length < 3 || description.length > 200) {
  return error; // Free rejection
}

// Block repetitive requests
if (userRecentRequests.includes(description)) {
  return cached; // Use cached result
}
```

#### Progressive Enhancement
- **First generation**: Full detailed recipe with all fields
- **Subsequent edits**: Only modify specific fields (cheaper)

## Implementation: Usage Tracking & Limits

### Database Schema
```typescript
interface UserUsageStats {
  userId: string;
  dailyGenerations: number;
  monthlyGenerations: number;
  lastGenerationDate: Date;
  lastResetDate: Date;
  tier: 'free' | 'premium';
}
```

### Usage Enforcement
```typescript
async function checkUsageLimit(userId: string): Promise<boolean> {
  const stats = await getUserUsageStats(userId);
  const limits = USAGE_LIMITS[stats.tier];

  // Reset daily counter if needed
  if (isNewDay(stats.lastGenerationDate)) {
    stats.dailyGenerations = 0;
  }

  // Reset monthly counter if needed
  if (isNewMonth(stats.lastResetDate)) {
    stats.monthlyGenerations = 0;
  }

  // Check limits
  if (stats.dailyGenerations >= limits.generationsPerDay) {
    throw new Error('Daily limit reached. Try again tomorrow!');
  }

  if (stats.monthlyGenerations >= limits.generationsPerMonth) {
    throw new Error('Monthly limit reached. Upgrade for more generations!');
  }

  return true;
}
```

### User-Facing Limits Display
```typescript
// Show remaining generations to user
const remaining = {
  daily: limits.generationsPerDay - stats.dailyGenerations,
  monthly: limits.generationsPerMonth - stats.monthlyGenerations,
};

// UI: "✨ AI Generations: 2 of 3 remaining today"
```

## Monitoring & Alerts

### Key Metrics to Track
1. **Total API calls per day/month**
2. **Cost per user** (identify power users)
3. **Success rate** (failed generations still cost money)
4. **Average tokens per request** (detect prompt bloat)
5. **Cache hit rate** (measure caching effectiveness)

### Cost Alerts
```typescript
const COST_ALERTS = {
  dailyBudget: 5.00,      // Alert at $5/day
  monthlyBudget: 100.00,  // Alert at $100/month
  perUserLimit: 1.00,     // Alert if single user > $1/month
};
```

## Monetization Opportunities

### Premium Features
- **Free Tier**: 3 generations/day, 20/month
- **Premium Tier** ($2.99/month): 10 generations/day, 100/month
- **Cost per premium user**: ~$0.13/month (95% profit margin with 2.5 Flash-Lite)

### ROI Analysis
If 5% of users convert to premium:
- 10,000 total users
- 500 premium users × $2.99 = $1,495/month revenue
- Total cost (premium users): ~$6.50/month
- **Net profit**: ~$1,488/month (99.5% profit margin)

## Recommendations

### Phase 1: Launch (Free, Limited)
**Text Generation:**
- **Limits**: 3 generations/day, 20/month per user
- **Caching**: Enabled for common queries
- **Cost**: $0.50-$4/month for first 1,000-5,000 users (80% cheaper with 2.5 Flash-Lite)

**Image Generation:**
- **Limits**: 1 AI cover/day, 5/month per user (opt-in only)
- **Model**: Imagen 4 Fast ($0.02/image)
- **Cost**: $1-$10/month for first 1,000-5,000 users
- **Total Phase 1 Cost**: **$2-$15/month**
- **Goal**: Validate feature usage and demand

### Phase 2: Scale (Freemium)
**Free Tier:**
- Text: 3 recipes/day, 20/month
- Images: 1 AI cover/day, 5/month (Imagen 4 Fast)

**Premium Tier** ($4.99/month):
- Text: 10 recipes/day, 100/month
- Images: 3 AI covers/day, 30/month (Imagen 4 Standard)
- High-res exports, ad-free experience

**Costs:**
- Text: $10-20/month for 10K-50K users
- Images: $50-200/month (20% adoption, 5 images/user/month)
- **Total Phase 2 Cost**: **$60-220/month**
- **Revenue**: $2,500-12,500/month from premium (5% conversion)
- **Profit**: $2,200-12,000/month

### Phase 3: Optimize (Enterprise)
**Optimizations:**
- Text: Prompt optimization (-20% token usage), smart caching (-40% API calls)
- Images: Category-based cached covers (-50% generations)
- Imagen 4 Fast for free tier, Standard for premium
- Bulk API pricing: Negotiate with Google for volume discounts

**Costs:**
- Text: $60-100/month for 100K-500K users (80% reduction)
- Images: $500-2,000/month (optimized with caching)
- **Total Phase 3 Cost**: **$560-2,100/month**
- **Revenue**: $25,000-125,000/month (5% premium conversion)
- **Profit**: $23,000-123,000/month

## Alternative Models

### 1. Credit-Based System
- Free tier: 20 credits/month
- 1 generation = 1 credit
- Buy more credits: $0.99 for 10 credits
- **Benefit**: Better cost control, users pay for what they use

### 2. Tiered Complexity
- **Simple recipes** (5 ingredients, 5 steps): 1 credit, cheaper prompt
- **Complex recipes** (15+ ingredients, 10+ steps): 3 credits, detailed prompt
- **Benefit**: Optimize costs based on recipe complexity

### 3. Community Sharing
- Users share AI-generated recipes with community
- Popular recipes become templates (cached)
- Reduces duplicate generation requests
- **Benefit**: 50-70% cost reduction through community effects

## Conclusion

### Key Takeaways

**Text Generation (Gemini 2.5 Flash-Lite):**
1. ✅ **Extremely affordable** - 80% cheaper than 2.0 Flash, costs nearly negligible (~$0.000044/recipe)
2. ✅ **Simple rate limits** (3/day) reduce costs by 40-60%
3. ✅ **Caching** provides significant savings for common recipes
4. ✅ **Free tier sustainable** - Can easily support tens of thousands of users

**Image Generation (Imagen 4):**
1. ⚠️ **200-2000x more expensive** than text generation ($0.04/image vs $0.000044/recipe)
2. ⚠️ **Primary cost driver** - Images will dominate the budget
3. ✅ **Usage limits critical** - 1/day for free tier recommended
4. ✅ **Opt-in feature** - Don't generate automatically to save costs
5. ✅ **Imagen 4 Fast option** - 50% savings ($0.02/image) with minimal quality trade-off
6. ✅ **Monetization opportunity** - Premium tier with unlimited covers

### Combined Cost Summary

**Current Implementation (Imagen 4 Standard):**
- Recipe + AI Cover: $0.040044 total
- Text: 0.1% of cost
- Image: 99.9% of cost

**With Optimization (Imagen 4 Fast + opt-in):**
- 20-30% adoption rate
- $0.02 per image when used
- 80% cost reduction

### Implementation Priority

**Phase 1 (Critical):**
1. **High Priority**: Image generation usage limits (1/day, 5/month)
2. **High Priority**: Make AI covers opt-in (user request only)
3. **High Priority**: Usage tracking database for images
4. **High Priority**: Switch to Imagen 4 Fast for free tier

**Phase 2 (Important):**
5. **Medium Priority**: Text generation limits (3/day, 20/month)
6. **Medium Priority**: Cost monitoring dashboard
7. **Medium Priority**: Simple caching for common recipes

**Phase 3 (Nice to Have):**
8. **Low Priority**: Premium tier with unlimited AI covers
9. **Low Priority**: Category-based cached covers
10. **Low Priority**: Advanced prompt optimization

### Estimated Launch Cost

**Text Generation Only:**
- 100-1,000 users: $0.10-$1/month
- 1,000-10,000 users: $1-$10/month

**With AI Image Generation (Imagen 4 Fast, opt-in, 20% adoption):**
- 100-1,000 users: $2-$5/month
- 1,000-10,000 users: $20-$100/month

**Risk Assessment:**
- **Text generation**: Minimal risk, highly affordable
- **Image generation**: Moderate risk without limits, critical to implement usage caps
- **Mitigation**: Start with strict limits (1 image/day), adjust based on budget

### Final Recommendation

The AI features are **highly cost-effective with proper limits**:

1. **Text generation** is essentially free - implement generously
2. **Image generation** needs careful management:
   - Use Imagen 4 Fast ($0.02/image) for free tier
   - Make it opt-in, not automatic
   - Implement strict daily/monthly limits
   - Consider premium tier for power users

With these safeguards, Recipe Studio can provide amazing AI features while maintaining sustainable costs at scale.
