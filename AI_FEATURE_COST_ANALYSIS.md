# AI Recipe Generation - Cost Analysis & Usage Limits

## Overview
This document provides cost estimates for the AI recipe generation feature using Google Gemini API and outlines strategies to control costs at scale.

## API Pricing (as of 2025)

### Google Gemini 2.0 Flash Experimental
- **Input tokens**: $0.10 per 1M tokens (~750K words)
- **Output tokens**: $0.30 per 1M tokens (~750K words)
- **Free tier**: 2M input tokens + 0.5M output tokens per day (as of Jan 2025)

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
Input cost:  350 tokens × $0.10 / 1M = $0.000035
Output cost: 600 tokens × $0.30 / 1M = $0.000180
───────────────────────────────────────────────
Total cost per recipe: ~$0.000215 (0.02 cents)
```

## Scaling Cost Projections

### Monthly Usage Scenarios

| Users | Generations/User/Month | Total Generations | Monthly Cost | Notes |
|-------|------------------------|-------------------|--------------|-------|
| 100 | 5 | 500 | $0.11 | Early stage |
| 1,000 | 5 | 5,000 | $1.08 | Small scale |
| 10,000 | 5 | 50,000 | $10.75 | Medium scale |
| 100,000 | 5 | 500,000 | $107.50 | Large scale |
| 1,000,000 | 3 | 3,000,000 | $645.00 | Enterprise scale |

### Key Insights
1. **Very affordable at small-medium scale** - Under $11/month for 10K users
2. **Scales linearly** - No volume discounts currently, but cost is predictable
3. **Free tier covers ~9,300 recipe generations per day** for development/testing

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
- **Without limits**: 5 gens/user/month = $10.75/month
- **With limits (3/day)**: Average 2-3 gens/user/month = $4.30-$6.45/month
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
- **Cost per premium user**: ~$0.65/month (78% profit margin)

### ROI Analysis
If 5% of users convert to premium:
- 10,000 total users
- 500 premium users × $2.99 = $1,495/month revenue
- Total cost (premium users): ~$32/month
- **Net profit**: ~$1,463/month

## Recommendations

### Phase 1: Launch (Free, Limited)
- **Limits**: 3 generations/day, 20/month per user
- **Caching**: Enabled for common queries
- **Cost**: $5-20/month for first 1,000-5,000 users
- **Goal**: Validate feature usage and demand

### Phase 2: Scale (Freemium)
- **Free Tier**: 3/day, 20/month
- **Premium Tier**: $2.99/month for 10/day, 100/month
- **Advanced caching**: Recipe templates for common categories
- **Cost**: $50-100/month for 10K-50K users
- **Revenue**: $1,000-5,000/month from premium

### Phase 3: Optimize (Enterprise)
- **Prompt optimization**: -20% token usage
- **Smart caching**: -40% API calls
- **Bulk API pricing**: Negotiate with Google for volume discounts
- **Cost**: $300-500/month for 100K-500K users
- **Revenue**: $15,000-50,000/month

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
1. ✅ **Very affordable** - Even at scale, costs are manageable
2. ✅ **Simple rate limits** (3/day) reduce costs by 40-60%
3. ✅ **Caching** provides significant savings for common recipes
4. ✅ **Monetization potential** - 78% profit margin on premium tier
5. ✅ **Free tier sustainable** - Can support thousands of users

### Implementation Priority
1. **High Priority**: Usage limits (3/day, 20/month)
2. **High Priority**: Usage tracking database
3. **Medium Priority**: Simple caching for common queries
4. **Medium Priority**: Cost monitoring dashboard
5. **Low Priority**: Premium tier (validate demand first)

### Estimated Launch Cost
- **100-1,000 users**: $1-5/month
- **1,000-10,000 users**: $5-50/month
- **Risk**: Minimal - Can always add tighter limits if needed

This feature is **highly cost-effective** and should be implemented with basic usage limits to prevent abuse while providing excellent value to users.
