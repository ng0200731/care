# Character-Level Segmentation Analysis Report

## Overview
This report analyzes the exact character-level segmentation logic that breaks mixed CJK + Latin text into individual segments in the AI Coordinate Viewer application.

## Key Finding: Discrepancy with User's Observation

**USER'S CLAIM:** "聚酯纤维 - 폴리에스터" breaks into 4 parts: "聚酯纤维", "-", "폴리에스터", "-" in Illustrator.

**ACTUAL SEGMENTATION LOGIC RESULT:** 3 segments:
1. "聚酯纤维" → Language: chinese
2. " - " → Language: other
3. "폴리에스터" → Language: korean

## Segmentation Logic Implementation

### Location: App.tsx lines 5320-5360

### Core Functions:

#### 1. Language Detection Patterns (lines 5304-5309)
```typescript
const languagePatterns = {
    chinese: /[\u4E00-\u9FFF]/,
    japanese: /[\u3040-\u309F\u30A0-\u30FF]/,
    korean: /[\uAC00-\uD7AF]/,
    arabic: /[\u0600-\u06FF]/
};
```

#### 2. Character Language Detection (lines 5325-5331)
```typescript
const getCharLanguage = (char: string): string => {
    if (languagePatterns.chinese.test(char)) return 'chinese';
    if (languagePatterns.japanese.test(char)) return 'japanese';
    if (languagePatterns.korean.test(char)) return 'korean';
    if (languagePatterns.arabic.test(char)) return 'arabic';
    return 'other';
};
```

#### 3. Main Segmentation Algorithm (lines 5333-5356)
```typescript
for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charLanguage = getCharLanguage(char);

    // For non-CJK languages, group by words (space-separated)
    if (charLanguage === 'other') {
        if (currentLanguage === 'other') {
            currentSegment += char;
        } else {
            if (currentSegment) segments.push({ text: currentSegment, language: currentLanguage });
            currentSegment = char;
            currentLanguage = 'other';
        }
    } else {
        // For CJK languages, each character can be its own segment or group consecutive same-language chars
        if (charLanguage === currentLanguage) {
            currentSegment += char;
        } else {
            if (currentSegment) segments.push({ text: currentSegment, language: currentLanguage });
            currentSegment = char;
            currentLanguage = charLanguage;
        }
    }
}
```

## Detailed Analysis Results

### Test Case 1: "聚酯纤维 - 폴리에스터"
**Character-by-Character Breakdown:**
- "聚" → chinese (U+805A)
- "酯" → chinese (U+916F)
- "纤" → chinese (U+7EA4)
- "维" → chinese (U+7EF4)
- " " → other (U+0020)
- "-" → other (U+002D)
- " " → other (U+0020)
- "폴" → korean (U+D3F4)
- "리" → korean (U+B9AC)
- "에" → korean (U+C5D0)
- "스" → korean (U+C2A4)
- "터" → korean (U+D130)

**Segmentation Result:** 3 segments
1. "聚酯纤维" → Language: chinese
2. " - " → Language: other
3. "폴리에스터" → Language: korean

### Test Case 2: "엘라스탄 - elastan -"
**Character-by-Character Breakdown:**
- "엘" → korean (U+C5D8)
- "라" → korean (U+B77C)
- "스" → korean (U+C2A4)
- "탄" → korean (U+D0C4)
- " " → other (U+0020)
- "-" → other (U+002D)
- " " → other (U+0020)
- "e" → other (U+0065)
- "l" → other (U+006C)
- "a" → other (U+0061)
- "s" → other (U+0073)
- "t" → other (U+0074)
- "a" → other (U+0061)
- "n" → other (U+006E)
- " " → other (U+0020)
- "-" → other (U+002D)

**Segmentation Result:** 2 segments
1. "엘라스탄" → Language: korean
2. " - elastan -" → Language: other

## Key Segmentation Rules

### Rule 1: Language Change Triggers New Segment
- When character language changes, a new segment begins
- Example: "ABC - 한국어" → ["ABC - ", "한국어"]

### Rule 2: Non-CJK Characters (category 'other') Are Grouped Together
- Spaces, punctuation, Latin letters all belong to 'other'
- They stay together until a CJK character appears
- **Critical**: This explains why "-" does NOT become separate segment

### Rule 3: CJK Characters Group by Same Language
- Chinese characters stay together: "聚酯纤维" → 1 segment
- Korean characters stay together: "폴리에스터" → 1 segment

### Rule 4: Space and Punctuation Treatment
- Spaces (U+0020) and hyphens (U+002D) are both classified as 'other'
- They are combined with adjacent non-CJK text
- **This is why " - " becomes one segment, not three separate ones**

## Why the Discrepancy?

The user's observation that "聚酯纤维 - 폴리에스터" breaks into 4 parts ("聚酯纤维", "-", "폴리에스터", "-") **does NOT match the actual segmentation algorithm**.

**Possible explanations:**
1. **Different Illustrator behavior**: Illustrator might have its own text segmentation logic
2. **Different code version**: The user might be referring to different segmentation logic not in this codebase
3. **Manual processing**: The user might be describing manual text breaking rather than automatic segmentation
4. **Export processing**: There might be additional processing during SVG export that further breaks segments

## Actual Behavior vs Expected Behavior

### Current Implementation Result:
```
"聚酯纤维 - 폴리에스터" → 3 segments:
- "聚酯纤维" (chinese)
- " - " (other)
- "폴리에스터" (korean)
```

### User's Expected Result:
```
"聚酯纤维 - 폴리에스터" → 4 segments:
- "聚酯纤维"
- "-"
- "폴리에스터"
- "-" (unclear why there would be a second dash)
```

## Conclusion

The character-level segmentation logic in `App.tsx` (lines 5320-5360) groups characters by language, with all non-CJK characters (including spaces and punctuation) treated as a single 'other' category. This results in spaces and hyphens being combined with adjacent text rather than forming separate segments.

The discrepancy with the user's observation suggests either:
1. Different processing logic exists elsewhere in the codebase
2. Illustrator applies additional segmentation during import/processing
3. There's a misunderstanding about what constitutes "segmentation" in this context