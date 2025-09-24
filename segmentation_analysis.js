// Character-Level Segmentation Analysis - exact copy from App.tsx

// Language detection patterns from App.tsx line 5304-5309
const languagePatterns = {
    chinese: /[\u4E00-\u9FFF]/,
    japanese: /[\u3040-\u309F\u30A0-\u30FF]/,
    korean: /[\uAC00-\uD7AF]/,
    arabic: /[\u0600-\u06FF]/
};

// getCharLanguage function from App.tsx line 5325-5331
const getCharLanguage = (char) => {
    if (languagePatterns.chinese.test(char)) return 'chinese';
    if (languagePatterns.japanese.test(char)) return 'japanese';
    if (languagePatterns.korean.test(char)) return 'korean';
    if (languagePatterns.arabic.test(char)) return 'arabic';
    return 'other';
};

// segmentTextByLanguage function from App.tsx line 5320-5360
const segmentTextByLanguage = (text) => {
    const segments = [];
    let currentSegment = '';
    let currentLanguage = 'other';

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

    if (currentSegment) segments.push({ text: currentSegment, language: currentLanguage });
    return segments;
};

function analyzeText(text) {
    console.log(`\n=== ANALYZING: "${text}" ===`);

    // Character-by-character analysis first
    console.log('\nCharacter-by-Character Analysis:');
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charLanguage = getCharLanguage(char);
        const code = char.charCodeAt(0);
        console.log(`  ${i + 1}. "${char}" → Language: ${charLanguage} (U+${code.toString(16).toUpperCase().padStart(4, '0')})`);
    }

    // Segmentation result
    const segments = segmentTextByLanguage(text);
    console.log('\nSegmentation Result:');
    console.log(`  Total segments: ${segments.length}`);
    segments.forEach((segment, index) => {
        console.log(`  ${index + 1}. "${segment.text}" → Language: ${segment.language}`);
    });

    return segments;
}

// Test cases from user's question
console.log('CHARACTER-LEVEL SEGMENTATION ANALYSIS');
console.log('=====================================');

// Main test cases
analyzeText("聚酯纤维 - 폴리에스터");  // Should break into 4 parts according to user
analyzeText("엘라스탄 - elastan -");     // Stays together according to user

// Additional test cases to understand the logic
analyzeText("聚酯纤维");
analyzeText("폴리에스터");
analyzeText("엘라스탄");
analyzeText("elastan");
analyzeText("-");
analyzeText(" - ");
analyzeText("ABC - 한국어");
analyzeText("中文 - English");

console.log('\n=====================================');
console.log('ANALYSIS COMPLETE');