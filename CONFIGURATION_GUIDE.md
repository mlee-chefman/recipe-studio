# Configuration Guide

This guide explains all configurable parameters for PDF extraction and recipe parsing, and how they impact API usage, cost, latency, and quotas.

---

## Table of Contents

1. [PDF Extraction Configuration](#pdf-extraction-configuration)
2. [Recipe Parsing Configuration](#recipe-parsing-configuration)
3. [API Usage & Cost Impact](#api-usage--cost-impact)
4. [Optimization Strategies](#optimization-strategies)
5. [Troubleshooting](#troubleshooting)

---

## PDF Extraction Configuration

**File:** `src/utils/constants/pdfExtraction.ts`

### `PAGES_PER_CHUNK` (Default: 8)

**What it does:** Number of PDF pages to include in each chunk when splitting large PDFs.

**Impact on:**
- **API Calls:** Fewer pages per chunk = more chunks = more API calls
- **Cost:** More API calls = higher cost
- **Latency:** More chunks = longer total processing time (includes delays between chunks)
- **Success Rate:** Smaller chunks = less likely to hit file size limits (400 errors)

**Recommendations:**
- **Small PDFs (< 10 pages):** Set to `10-15` (fewer chunks)
- **Medium PDFs (10-30 pages):** Keep at `8` (balanced)
- **Large PDFs (30+ pages):** Keep at `8` or reduce to `5-6` if getting 400 errors
- **Very high-quality images:** Reduce to `5-6` (image-heavy PDFs are larger)

**Example:**
```typescript
// For a 34-page PDF:
PAGES_PER_CHUNK: 8   // = 5 API calls (recommended)
PAGES_PER_CHUNK: 15  // = 3 API calls (faster but may fail on large files)
PAGES_PER_CHUNK: 5   // = 7 API calls (slower but most reliable)
```

---

### `DELAY_BETWEEN_CHUNKS_MS` (Default: 4000)

**What it does:** Milliseconds to wait between PDF chunk extraction API calls.

**Impact on:**
- **API Calls:** No impact on number of calls
- **Cost:** No impact
- **Latency:** Longer delay = slower total processing
- **Rate Limiting:** Shorter delay = higher risk of 429 errors

**Recommendations:**
- **Free Tier:** Keep at `4000-5000ms` (avoid rate limits)
- **Paid Tier with higher limits:** Can reduce to `2000-3000ms`
- **Getting 429 errors:** Increase to `5000-6000ms`

**Formula:**
```
Total extraction time = (chunks × delay) + (chunks × processing_time)
Example: 5 chunks × 4s = 20s of waiting + ~10s processing = 30s total
```

---

### `RATE_LIMIT_RETRY_DELAY_MS` (Default: 10000)

**What it does:** Milliseconds to wait before retrying after a 429 rate limit error.

**Impact on:**
- **API Calls:** No impact (only activates after error)
- **Cost:** No impact
- **Latency:** Only adds time when rate limited
- **Success Rate:** Longer delay = better chance of successful retry

**Recommendations:**
- **Free Tier:** Keep at `10000ms` (10 seconds)
- **Frequent 429 errors:** Increase to `15000-20000ms`
- **Paid Tier:** Can reduce to `5000-8000ms`

---

### `MAX_OUTPUT_TOKENS` (Default: 8192)

**What it does:** Maximum number of output tokens the API can generate per chunk.

**Impact on:**
- **API Calls:** No impact on number of calls
- **Cost:** ⚠️ **DIRECT COST IMPACT** - Higher value = higher cost per call
- **Latency:** Higher value = slightly longer processing per chunk
- **Quality:** Higher value = can extract more text per chunk

**Pricing (Gemini 2.0 Flash):**
- **Input tokens:** $0.075 per 1M tokens (PDF data)
- **Output tokens:** $0.30 per 1M tokens (extracted text) ⚠️

**Recommendations:**
- **Keep at 8192** - This is the sweet spot for cost vs. quality
- **DO NOT increase** - Would extract same amount of text but cost 4x more if set to 32K

**Cost Example:**
```
8192 tokens per chunk × 5 chunks = 40,960 output tokens
= $0.012 per PDF (free tier: included in 50 requests/day)

If set to 32768:
32768 tokens × 5 chunks = 163,840 output tokens
= $0.049 per PDF (4x more expensive)
```

---

### `TEMPERATURE` (Default: 0.0)

**What it does:** Controls randomness in API responses (0.0 = deterministic, 1.0 = creative).

**Impact on:**
- **API Calls:** No impact
- **Cost:** No impact (temperature doesn't affect token usage)
- **Latency:** No impact
- **Quality:** For text extraction, 0.0 is best (consistent, accurate)

**Recommendations:**
- **Text Extraction:** Keep at `0.0` (deterministic is best)
- **Recipe Generation:** Use `0.7` (allows creativity)
- **Never change for PDF extraction** - We want exact text, not creative interpretation

---

### `API_TIMEOUT_MS` (Default: 180000)

**What it does:** Maximum time to wait for API response before timing out.

**Impact on:**
- **API Calls:** Prevents hanging requests
- **Cost:** No impact
- **Latency:** Sets upper bound on wait time
- **Success Rate:** Too short = premature timeouts on slow networks

**Recommendations:**
- **Keep at 180000ms (3 minutes)** - Safe for large chunks
- **Slow network:** Increase to `240000ms` (4 minutes)
- **Fast network & small PDFs:** Can reduce to `120000ms` (2 minutes)

---

## Recipe Parsing Configuration

**File:** `src/services/constants/geminiConfig.ts`

### `TEXT_CHUNK_SIZE` (Default: 6000)

**What it does:** Number of characters per text chunk when parsing recipes.

**Impact on:**
- **API Calls:** Smaller chunks = more API calls
- **Cost:** More calls = higher cost
- **Latency:** More chunks = longer processing
- **Quality:** Smaller chunks = better at finding all recipes

**Recommendations:**
- **Keep at 6000** - Optimal for finding all recipes
- **Small cookbooks (<10 recipes):** Can increase to `10000` (fewer calls)
- **Large cookbooks (30+ recipes):** Keep at `6000` or reduce to `5000`

**Cost Example:**
```
For 52,000 character text:
6000 chunk size = 11 chunks = 11 API calls
10000 chunk size = 6 chunks = 6 API calls (saves 5 calls but may miss recipes)
```

---

### `TEXT_CHUNK_OVERLAP` (Default: 1000)

**What it does:** Number of characters to overlap between chunks.

**Impact on:**
- **API Calls:** Increases total text processed
- **Cost:** Slight increase (overlap is re-processed)
- **Latency:** No significant impact
- **Quality:** Higher overlap = less likely to split recipes across chunks

**Recommendations:**
- **Keep at 1000** - Good balance
- **Missing recipes at chunk boundaries:** Increase to `1500-2000`
- **Want faster processing:** Reduce to `500` (riskier)

---

### `TEMPERATURE` (Default: 0.1)

**What it does:** Controls randomness in recipe parsing.

**Impact on:**
- **API Calls:** No impact
- **Cost:** ❌ **NO COST IMPACT** - Temperature is free!
- **Latency:** No impact
- **Quality:** Low temperature (0.1) = more thorough extraction

**Recommendations:**
- **Recipe Parsing:** Keep at `0.1` (consistent extraction)
- **Recipe Generation:** Use `0.7` (allows creativity)

---

### `MAX_OUTPUT_TOKENS` (Default: 16384)

**What it does:** Maximum tokens for recipe parsing output.

**Impact on:**
- **API Calls:** No impact
- **Cost:** ⚠️ **DIRECT COST IMPACT** - Each recipe costs output tokens
- **Latency:** Higher limit = slightly slower
- **Quality:** Must be high enough to return all recipes in chunk

**Recommendations:**
- **Keep at 16384** - Allows ~4-5 detailed recipes per chunk
- **DO NOT reduce** - May truncate recipe lists
- **Large recipes:** Keep as is

**Cost Impact:**
```
Typical chunk with 4 recipes = ~8,000 output tokens
11 chunks × 8,000 = 88,000 tokens = $0.026 per cookbook
```

---

### `DELAY_BETWEEN_CHUNKS_MS` (Default: 3000)

**What it does:** Delay between recipe parsing API calls.

**Impact:**
- Same as PDF extraction delay (see above)

**Recommendations:**
- **Free Tier:** Keep at `3000-4000ms`
- **Paid Tier:** Can reduce to `2000ms`

---

### `RATE_LIMIT_RETRY_DELAY_MS` (Default: 10000)

**What it does:** Wait time before retry after rate limit.

**Impact:**
- Same as PDF extraction retry delay (see above)

---

## API Usage & Cost Impact

### Free Tier Limits (Gemini 2.0 Flash)

- **Requests:** 50 per day (resets at midnight PST)
- **Rate:** 15 requests per minute
- **Cost:** Free

### Typical Cookbook Import (34 pages, 27 recipes)

**Phase 1: PDF Extraction**
```
Pages: 34
PAGES_PER_CHUNK: 8
= 5 chunks = 5 API calls

Wait time: 5 chunks × 4s delay = 20s
Processing time: ~10s
Total: ~30s
```

**Phase 2: Recipe Parsing**
```
Text: 52,000 characters
TEXT_CHUNK_SIZE: 6000
= 11 chunks = 11 API calls

Wait time: 11 chunks × 3s delay = 33s
Processing time: ~20s
Total: ~53s
```

**Total Usage per Cookbook:**
- **API Calls:** 16 requests (32% of daily free quota)
- **Time:** ~83 seconds (~1.5 minutes)
- **Cost (if paid):** ~$0.04 per cookbook

**Daily Capacity (Free Tier):**
- **Max cookbooks per day:** 3 cookbooks (50 requests ÷ 16 = 3.1)

---

### Paid Tier Costs (Gemini 2.0 Flash)

**Pricing:**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Per Cookbook Cost:**
```
PDF Extraction:
- Input: 5 chunks × ~10,000 tokens = 50,000 tokens = $0.00375
- Output: 5 chunks × 8,192 tokens = 40,960 tokens = $0.01229
Subtotal: $0.016

Recipe Parsing:
- Input: 11 chunks × ~5,000 tokens = 55,000 tokens = $0.00413
- Output: 11 chunks × 8,000 tokens = 88,000 tokens = $0.0264
Subtotal: $0.030

TOTAL PER COOKBOOK: ~$0.046 (less than 5 cents)
```

**Cost for 100 Cookbooks:** ~$4.60

---

## Optimization Strategies

### For Fastest Processing (Paid Tier)

```typescript
// pdfExtraction.ts
PAGES_PER_CHUNK: 10                    // Fewer chunks
DELAY_BETWEEN_CHUNKS_MS: 2000          // Shorter delays
RATE_LIMIT_RETRY_DELAY_MS: 5000       // Shorter retry

// geminiConfig.ts
TEXT_CHUNK_SIZE: 8000                  // Fewer chunks
DELAY_BETWEEN_CHUNKS_MS: 2000         // Shorter delays
```

**Result:** ~50% faster, same quality, slightly higher cost

---

### For Lowest Cost (Free Tier)

```typescript
// pdfExtraction.ts
PAGES_PER_CHUNK: 12                    // Fewer chunks = fewer API calls
DELAY_BETWEEN_CHUNKS_MS: 5000         // Avoid rate limits
MAX_OUTPUT_TOKENS: 8192               // Keep at minimum needed

// geminiConfig.ts
TEXT_CHUNK_SIZE: 8000                  // Fewer chunks = fewer API calls
TEXT_CHUNK_OVERLAP: 800               // Less overlap = less processing
DELAY_BETWEEN_CHUNKS_MS: 4000         // Avoid rate limits
```

**Result:** 30% fewer API calls, but higher risk of missing recipes

---

### For Best Quality (Recommended)

```typescript
// Keep current defaults - they're optimized for quality
PAGES_PER_CHUNK: 8
TEXT_CHUNK_SIZE: 6000
TEXT_CHUNK_OVERLAP: 1000
TEMPERATURE: 0.0 (PDF) / 0.1 (recipes)
```

**Result:** Highest success rate, finds all recipes

---

## Troubleshooting

### Getting 400 Errors (File Too Large)

**Problem:** PDF chunks are too large for API

**Solution:**
```typescript
PAGES_PER_CHUNK: 5  // Reduce from 8
```

---

### Getting 429 Errors (Rate Limit)

**Problem:** Sending requests too quickly

**Solution:**
```typescript
DELAY_BETWEEN_CHUNKS_MS: 5000         // Increase from 4000
RATE_LIMIT_RETRY_DELAY_MS: 15000      // Increase from 10000
```

---

### Missing Recipes

**Problem:** Some recipes not extracted

**Solution:**
```typescript
TEXT_CHUNK_SIZE: 5000                  // Reduce from 6000 (more chunks)
TEXT_CHUNK_OVERLAP: 1500              // Increase from 1000 (more overlap)
MAX_OUTPUT_TOKENS: 16384              // Keep high
```

---

### Too Slow

**Problem:** Processing takes too long

**Solution (Paid Tier Only):**
```typescript
PAGES_PER_CHUNK: 12                   // Increase (fewer chunks)
TEXT_CHUNK_SIZE: 8000                 // Increase (fewer chunks)
DELAY_BETWEEN_CHUNKS_MS: 2000        // Reduce delays
```

---

### Hitting Daily Quota (Free Tier)

**Problem:** Using all 50 requests too quickly

**Solution:**
```typescript
PAGES_PER_CHUNK: 12                   // Fewer PDF chunks
TEXT_CHUNK_SIZE: 8000                 // Fewer text chunks
```

Or upgrade to paid tier for 1,500 requests/day.

---

## Quick Reference

### What Affects Cost?

✅ **Yes:**
- `MAX_OUTPUT_TOKENS` - Higher = more expensive
- Number of API calls (affected by chunk sizes)

❌ **No:**
- `TEMPERATURE` - Free parameter
- `DELAY_BETWEEN_CHUNKS_MS` - Just waiting time
- `RATE_LIMIT_RETRY_DELAY_MS` - Only delays
- `API_TIMEOUT_MS` - Just timeout limit

### What Affects Latency?

- `PAGES_PER_CHUNK` - Fewer pages = more chunks = slower
- `TEXT_CHUNK_SIZE` - Smaller = more chunks = slower
- `DELAY_BETWEEN_CHUNKS_MS` - Directly adds wait time
- `RATE_LIMIT_RETRY_DELAY_MS` - Adds time if rate limited

### What Affects Quality?

- `PAGES_PER_CHUNK` - Smaller = more reliable
- `TEXT_CHUNK_SIZE` - Smaller = catches more recipes
- `TEXT_CHUNK_OVERLAP` - Higher = less likely to split recipes
- `TEMPERATURE` - Lower = more consistent (0.0-0.1 for extraction)
- `MAX_OUTPUT_TOKENS` - Higher = can extract more

---

## Summary

**Current Defaults Are Optimized For:**
- ✅ Finding all recipes (quality)
- ✅ Avoiding API errors (reliability)
- ✅ Free tier compatibility (50 requests/day)
- ⚠️ Not optimized for speed (can be 2x faster on paid tier)

**To change defaults, edit:**
- `src/utils/constants/pdfExtraction.ts`
- `src/services/constants/geminiConfig.ts`
