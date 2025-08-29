// Test script for Phase 1: Text Measurement Implementation
// This script tests the new precise text measurement functions

console.log('🧪 Testing Phase 1: Precise Text Measurement');

// Test 1: Basic text measurement
const testText = "The quick brown fox jumps over the lazy dog";
const fontSize = 12;
const fontFamily = 'Arial';

console.log('\n📏 Test 1: Basic Text Measurement');
console.log(`Text: "${testText}"`);
console.log(`Font: ${fontSize}px ${fontFamily}`);

// Create canvas for measurement
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
if (ctx) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(testText);
    console.log(`✅ Canvas measurement successful:`);
    console.log(`   Width: ${metrics.width.toFixed(2)}px`);
    console.log(`   Height: ${metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || fontSize}px`);
} else {
    console.log('❌ Canvas context not available');
}

// Test 2: Region capacity calculation
console.log('\n📐 Test 2: Region Capacity Calculation');
const regionWidth = 50; // mm
const regionHeight = 30; // mm
const padding = { top: 2, right: 2, bottom: 2, left: 2 };

console.log(`Region: ${regionWidth}×${regionHeight}mm`);
console.log(`Padding: ${JSON.stringify(padding)}`);

const effectiveWidth = regionWidth - padding.left - padding.right;
const effectiveHeight = regionHeight - padding.top - padding.bottom;
console.log(`Effective area: ${effectiveWidth}×${effectiveHeight}mm`);

// Convert to pixels (3.78 px/mm at 96 DPI)
const mmToPx = 3.78;
const effectiveWidthPx = effectiveWidth * mmToPx;
const effectiveHeightPx = effectiveHeight * mmToPx;
console.log(`Effective area: ${effectiveWidthPx.toFixed(1)}×${effectiveHeightPx.toFixed(1)}px`);

// Calculate line metrics
const lineHeight = fontSize * 1.2;
const maxLines = Math.floor(effectiveHeightPx / lineHeight);
console.log(`Line height: ${lineHeight}px, Max lines: ${maxLines}`);

// Calculate character metrics
if (ctx) {
    const charSample = "The quick brown fox jumps over the lazy dog 1234567890";
    const charMetrics = ctx.measureText(charSample);
    const avgCharWidth = charMetrics.width / charSample.length;
    const avgCharsPerLine = Math.floor(effectiveWidthPx / avgCharWidth);
    const totalCapacity = maxLines * avgCharsPerLine;
    const utilizationTarget = Math.floor(totalCapacity * 0.95);
    
    console.log(`✅ Capacity calculation:`);
    console.log(`   Avg char width: ${avgCharWidth.toFixed(2)}px`);
    console.log(`   Chars per line: ${avgCharsPerLine}`);
    console.log(`   Total capacity: ${totalCapacity} chars`);
    console.log(`   95% target: ${utilizationTarget} chars`);
}

// Test 3: Text fitting simulation
console.log('\n🎯 Test 3: Text Fitting Simulation');
const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

console.log(`Long text: ${longText.length} chars`);

if (ctx) {
    const words = longText.split(' ');
    const fittingLines = [];
    let currentLine = '';
    let wordIndex = 0;
    
    while (wordIndex < words.length && fittingLines.length < maxLines) {
        const word = words[wordIndex];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const lineWidth = ctx.measureText(testLine).width;
        
        if (lineWidth <= effectiveWidthPx) {
            currentLine = testLine;
            wordIndex++;
        } else {
            if (currentLine) {
                fittingLines.push(currentLine);
                currentLine = word;
                wordIndex++;
            } else {
                fittingLines.push(word);
                currentLine = '';
                wordIndex++;
            }
        }
    }
    
    if (currentLine && fittingLines.length < maxLines) {
        fittingLines.push(currentLine);
    }
    
    const fitting = fittingLines.join(' ');
    const remainingWords = words.slice(wordIndex);
    const overflow = remainingWords.join(' ');
    
    console.log(`✅ Text fitting results:`);
    console.log(`   Lines used: ${fittingLines.length}/${maxLines}`);
    console.log(`   Fitting text: ${fitting.length} chars`);
    console.log(`   Overflow text: ${overflow.length} chars`);
    console.log(`   Utilization: ${((fitting.length / (maxLines * avgCharsPerLine)) * 100).toFixed(1)}%`);
}

console.log('\n🎉 Phase 1 testing complete!');
