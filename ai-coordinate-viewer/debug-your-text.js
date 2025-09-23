// Debug your specific text to see N-split behavior
function debugYourText() {
  console.log('🔍 Debugging your specific text for N-split behavior');

  // Your actual text
  const yourText = `60% algodón - coton - cotton - algodão - katoen - cotone - ΒΑΜΒΑΚΙ - コットン - baumwolle - bomuld - bombaž - 棉 - 면 - katun - قطن - algodón - cotó - kotoia

10% poliéster - polyester - polyester - poliéster - polyester - poliestere - ΠΟΛΥΕΣΤΕΡΑΣ - ポリエステル - polyester - polyester - poliester - 聚酯纤维 - 폴리에스터 - poliester - بوليستير - poliéster - polièster - poliesterra

10% elastano - élasthanne - elastane - elastano - elastaan - elastan - ΕΛΑΣΤΑΝΗ - エラスタン - elastan - elastan - elastan - 氨纶 - 엘라스탄 - elastan - إيلاستان - elastano - elastà - elastanoa

10% nailon - nylon - nylon - nylon (so p/o Brasil poliamida) - nylon - nailon - ΝΑΪΛΟΝ - ナイロン - nylon - nylon - najlon - 锦纶 - 나일론 - nilon - نايلون - nailon - niló - nylona

10% lana - laine - wool - lã - wol - lana - ΜΑΛΛΙ - ウール - wolle - uld - volna - 羊毛 - 울 - wol - صوف - la - llana - artilea`;

  console.log(`📝 Your text length: ${yourText.length} characters`);

  // Settings from Text Overflow Analysis Settings (Settings.tsx)
  const regionWidth = 40; // mm
  const regionHeight = 90; // mm
  const fontSize = 10; // px
  const lineSpacing = 1.2;
  const userSafetyBuffer = 1.5; // mm
  const mmToPx = 3.779527559;

  // Exact calculations from Settings.tsx
  const regionWidthPx = regionWidth * mmToPx;
  const regionHeightPx = regionHeight * mmToPx;
  const paddingLeftPx = 4 * mmToPx; // 4mm padding from settings
  const paddingRightPx = 4 * mmToPx;
  const paddingTopPx = 4 * mmToPx;
  const paddingBottomPx = 4 * mmToPx;

  const availableWidthPx = regionWidthPx - paddingLeftPx - paddingRightPx;
  const availableHeightPx = regionHeightPx - paddingTopPx - paddingBottomPx;
  const availableWidthMm = availableWidthPx / mmToPx;
  const effectiveAvailableWidth = availableWidthMm - userSafetyBuffer;

  const scaledFontSize = Math.max(6, fontSize * 1.0); // zoom = 1.0
  const scaledFontSizeMm = scaledFontSize / mmToPx;
  const lineHeightMm = scaledFontSizeMm * lineSpacing;
  const availableHeightMm = availableHeightPx / mmToPx;

  // EXACT calculation from Settings.tsx line 530-536
  const maxLinesPerMother = Math.floor(availableHeightMm / lineHeightMm);

  console.log('📐 EXACT Settings.tsx calculations:', {
    regionWidthMm: regionWidth,
    regionHeightMm: regionHeight,
    availableWidthMm: availableWidthMm.toFixed(1),
    effectiveAvailableWidth: effectiveAvailableWidth.toFixed(1),
    scaledFontSizeMm: scaledFontSizeMm.toFixed(3),
    lineHeightMm: lineHeightMm.toFixed(3),
    availableHeightMm: availableHeightMm.toFixed(1),
    maxLinesPerMother: maxLinesPerMother
  });

  // Text width estimation (simplified)
  const estimateTextWidth = (text) => {
    // More accurate estimation based on character count and font size
    const avgCharWidthMm = scaledFontSizeMm * 0.6; // Rough estimate for Arial
    return text.length * avgCharWidthMm;
  };

  // Word wrapping logic (EXACT copy from NewCompTransDialog.tsx)
  const wrapTextToLines = (text) => {
    const lineBreakSymbol = '\n';
    const manualLines = text.split(lineBreakSymbol);
    const wrappedLines = [];

    console.log(`🔍 Manual lines from text: ${manualLines.length}`);

    manualLines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        wrappedLines.push('');
        return;
      }

      const words = trimmedLine.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = estimateTextWidth(testLine);

        if (testWidth <= effectiveAvailableWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            wrappedLines.push(currentLine);
            currentLine = word;
          } else {
            wrappedLines.push(word);
          }
        }
      });

      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    });

    return wrappedLines;
  };

  const allLines = wrapTextToLines(yourText);
  console.log(`📝 Total lines after wrapping: ${allLines.length}`);
  console.log(`📊 Max lines per mother: ${maxLinesPerMother}`);

  // Show first few lines for debugging
  console.log('📄 First 10 wrapped lines:');
  allLines.slice(0, 10).forEach((line, index) => {
    const width = estimateTextWidth(line);
    console.log(`  ${index + 1}: "${line}" (${width.toFixed(1)}mm width)`);
  });

  // Check overflow
  if (allLines.length <= maxLinesPerMother) {
    console.log('✅ NO OVERFLOW - text fits in single mother');
    return {
      hasOverflow: false,
      totalMothers: 1,
      reason: `${allLines.length} lines <= ${maxLinesPerMother} max lines`
    };
  }

  // Calculate mothers needed
  const totalMothersNeeded = Math.ceil(allLines.length / maxLinesPerMother);
  console.log(`🌊 OVERFLOW DETECTED - Need ${totalMothersNeeded} mothers`);
  console.log(`📊 Calculation: Math.ceil(${allLines.length} / ${maxLinesPerMother}) = ${totalMothersNeeded}`);

  // Show distribution
  let currentLineIndex = 0;
  for (let i = 0; i < totalMothersNeeded; i++) {
    const isLastMother = i === totalMothersNeeded - 1;
    const remainingLines = allLines.length - currentLineIndex;
    const linesToTake = isLastMother ? remainingLines : Math.min(maxLinesPerMother, remainingLines);

    console.log(`📄 Mother ${i + 1}: Lines ${currentLineIndex + 1}-${currentLineIndex + linesToTake} (${linesToTake} lines)`);
    currentLineIndex += linesToTake;
  }

  return {
    hasOverflow: true,
    totalMothers: totalMothersNeeded,
    totalLines: allLines.length,
    maxLinesPerMother: maxLinesPerMother
  };
}

// Run debug
debugYourText();