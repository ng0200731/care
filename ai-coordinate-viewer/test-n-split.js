// Simple test for N-split functionality
// This simulates the detectOverflowAndSplitN function logic

function testNSplitLogic() {
  console.log('🧪 Testing N-Split Logic Upgrade');

  // Mock data similar to the actual implementation
  const regionWidth = 40; // mm
  const regionHeight = 90; // mm
  const fontSizePx = 10;
  const lineSpacing = 1.2;
  const userSafetyBuffer = 1.5;
  const mmToPx = 3.779527559;

  // Calculate capacity like the real function
  const regionWidthPx = regionWidth * mmToPx;
  const regionHeightPx = regionHeight * mmToPx;
  const paddingLeftPx = 2 * mmToPx;
  const paddingRightPx = 2 * mmToPx;
  const paddingTopPx = 2 * mmToPx;
  const paddingBottomPx = 2 * mmToPx;

  const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
  const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);
  const availableWidthMm = availableWidthPx / mmToPx;
  const effectiveAvailableWidth = availableWidthMm - userSafetyBuffer;

  const scaledFontSizeMm = fontSizePx / mmToPx;
  const lineHeightMm = scaledFontSizeMm * lineSpacing;
  const availableHeightMm = availableHeightPx / mmToPx;
  const maxLinesPerMother = Math.floor(availableHeightMm / lineHeightMm);

  console.log('📐 Capacity calculations:', {
    availableWidthMm: availableWidthMm.toFixed(1),
    effectiveAvailableWidth: effectiveAvailableWidth.toFixed(1),
    lineHeightMm: lineHeightMm.toFixed(3),
    availableHeightMm: availableHeightMm.toFixed(1),
    maxLinesPerMother
  });

  // Test with extra long text that should require multiple splits (repeated content)
  const baseText = `60% algodón - coton - cotton - algodão - katoen - cotone - ΒΑΜΒΑΚΙ - コットン - baumwolle - bomuld - bombaž - 棉 - 면 - katun - قطن - algodón - cotó - kotoia

10% poliéster - polyester - polyester - poliéster - polyester - poliestere - ΠΟΛΥΕΣΤΕΡΑΣ - ポリエステル - polyester - polyester - poliester - 聚酯纤维 - 폴리에스터 - poliester - بوليستير - poliéster - polièster - poliesterra

10% elastano - élasthanne - elastane - elastano - elastaan - elastan - ΕΛΑΣΤΑΝΗ - エラスタン - elastan - elastan - elastan - 氨纶 - 엘라스탄 - elastan - إيلاستان - elastano - elastà - elastanoa

10% nailon - nylon - nylon - nylon (so p/o Brasil poliamida) - nylon - nailon - ΝΑΪΛΟΝ - ナイロン - nylon - nylon - najlon - 锦纶 - 나일론 - nilon - نايلون - nailon - niló - nylona

10% lana - laine - wool - lã - wol - lana - ΜΑΛΛΙ - ウール - wolle - uld - volna - 羊毛 - 울 - wol - صوف - la - llana - artilea`;

  // Repeat the text multiple times to force N-split scenario
  const longText = [baseText, baseText, baseText, baseText].join('\n\n');

  // Simulate text wrapping (simplified)
  const estimateTextWidth = (text) => text.length * 0.6; // Rough estimate

  const wrapTextToLines = (text) => {
    const lineBreakSymbol = '\n';
    const manualLines = text.split(lineBreakSymbol);
    const wrappedLines = [];

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

  const allLines = wrapTextToLines(longText);
  console.log(`📝 Total lines after wrapping: ${allLines.length}`);
  console.log(`📊 Max lines per mother: ${maxLinesPerMother}`);

  // Check if N-split is needed
  if (allLines.length <= maxLinesPerMother) {
    console.log('✅ NO OVERFLOW - text fits in single mother');
    return {
      hasOverflow: false,
      totalSplits: 1,
      textSplits: [longText]
    };
  }

  // Calculate how many mothers needed
  const totalMothersNeeded = Math.ceil(allLines.length / maxLinesPerMother);
  console.log(`🌊 OVERFLOW DETECTED - Need ${totalMothersNeeded} mothers`);

  // Split lines optimally
  const textSplits = [];
  let currentLineIndex = 0;
  let motherIndex = 0;

  while (currentLineIndex < allLines.length && motherIndex < totalMothersNeeded) {
    const isLastMother = motherIndex === totalMothersNeeded - 1;
    const remainingLines = allLines.length - currentLineIndex;

    let linesToTake;
    if (isLastMother) {
      linesToTake = remainingLines;
    } else {
      linesToTake = Math.min(maxLinesPerMother, remainingLines);
    }

    const motherLines = allLines.slice(currentLineIndex, currentLineIndex + linesToTake);
    const motherText = motherLines.join('\n');

    textSplits.push(motherText);

    const fillPercentage = ((motherLines.length / maxLinesPerMother) * 100).toFixed(1);
    console.log(`📝 Split ${motherIndex + 1}/${totalMothersNeeded} - ${motherLines.length}/${maxLinesPerMother} lines (${fillPercentage}% fill)`);

    currentLineIndex += linesToTake;
    motherIndex++;
  }

  const result = {
    hasOverflow: true,
    totalSplits: totalMothersNeeded,
    textSplits: textSplits
  };

  console.log(`🎯 N-SPLIT RESULT:`, {
    totalSplits: result.totalSplits,
    hasOverflow: result.hasOverflow,
    splitLengths: result.textSplits.map(split => split.length)
  });

  // Verify all splits
  result.textSplits.forEach((split, index) => {
    console.log(`📄 SPLIT ${index + 1}: ${split.length} chars - "${split.substring(0, 50)}..."`);
  });

  console.log('✅ N-Split logic test completed!');
  return result;
}

// Run the test
testNSplitLogic();