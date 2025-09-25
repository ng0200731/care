// DEBUG SCRIPT: Mother Text Rendering Comparison
// Paste this into your browser console to debug mother_1 vs mother_3 text rendering

function debugMotherTextComparison() {
  console.log('🔍 Starting Mother Text Rendering Debug...');

  // Method 1: Check React state (if available)
  if (window.regions) {
    const mother1 = window.regions.find(r => r.name === 'mother_1' || r.name === 'Mother_1');
    const mother3 = window.regions.find(r => r.name === 'mother_3' || r.name === 'Mother_3');

    console.log('👩 Mother 1 Found:', !!mother1);
    console.log('👩 Mother 3 Found:', !!mother3);

    if (mother1 && mother3) {
      // Compare dimensions
      console.log('📐 Dimensions Comparison:', {
        mother1: { w: mother1.width, h: mother1.height, x: mother1.x, y: mother1.y },
        mother3: { w: mother3.width, h: mother3.height, x: mother3.x, y: mother3.y }
      });

      // Find comp trans content
      const m1CompTrans = mother1.content?.find(c => c.type === 'new-comp-trans');
      const m3CompTrans = mother3.content?.find(c => c.type === 'new-comp-trans');

      if (m1CompTrans && m3CompTrans) {
        console.log('📝 Typography Comparison:', {
          mother1: {
            fontFamily: m1CompTrans.newCompTransConfig?.typography?.fontFamily,
            fontSize: m1CompTrans.newCompTransConfig?.typography?.fontSize,
            fontSizeUnit: m1CompTrans.newCompTransConfig?.typography?.fontSizeUnit,
            padding: m1CompTrans.newCompTransConfig?.padding,
            alignment: m1CompTrans.newCompTransConfig?.alignment
          },
          mother3: {
            fontFamily: m3CompTrans.newCompTransConfig?.typography?.fontFamily,
            fontSize: m3CompTrans.newCompTransConfig?.typography?.fontSize,
            fontSizeUnit: m3CompTrans.newCompTransConfig?.typography?.fontSizeUnit,
            padding: m3CompTrans.newCompTransConfig?.padding,
            alignment: m3CompTrans.newCompTransConfig?.alignment
          }
        });
      }
    }
  }

  // Method 2: Check DOM elements
  const svgTexts = document.querySelectorAll('text');
  console.log('📄 Total SVG text elements found:', svgTexts.length);

  const motherTexts = { mother1: [], mother3: [] };

  svgTexts.forEach((textEl, index) => {
    const parentGroup = textEl.closest('g[data-region-id]');
    if (parentGroup) {
      const regionId = parentGroup.getAttribute('data-region-id');

      // Try to identify mother regions by checking for mother names
      const allGroups = document.querySelectorAll('g[data-region-id]');
      allGroups.forEach(group => {
        const groupRegionId = group.getAttribute('data-region-id');
        if (groupRegionId === regionId) {
          // Check if this group has mother-like characteristics
          const rect = group.querySelector('rect');
          if (rect) {
            const width = parseFloat(rect.getAttribute('width') || '0');
            const height = parseFloat(rect.getAttribute('height') || '0');

            // If it's a reasonably large region, it might be a mother
            if (width > 100 && height > 100) {
              const textInfo = {
                regionId: regionId,
                fontFamily: textEl.getAttribute('font-family'),
                fontSize: textEl.getAttribute('font-size'),
                x: textEl.getAttribute('x'),
                y: textEl.getAttribute('y'),
                text: textEl.textContent?.substring(0, 30) + '...',
                width: width,
                height: height
              };

              // Store for comparison (we can't easily distinguish mother_1 vs mother_3 from DOM)
              console.log(`📝 Region ${regionId} Text:`, textInfo);
            }
          }
        }
      });
    }
  });

  // Method 3: Check canvas elements
  const canvases = document.querySelectorAll('canvas');
  console.log('🎨 Canvas elements found:', canvases.length);

  canvases.forEach((canvas, index) => {
    const ctx = canvas.getContext('2d');
    console.log(`🎨 Canvas ${index} font setting:`, ctx.font);
  });

  console.log('✅ Debug analysis complete. Check the console output above.');
  console.log('💡 To see real-time comparison, interact with mother_1 and mother_3 comp trans elements.');
}

// Auto-run the debug
debugMotherTextComparison();

// Also expose it globally for manual runs
window.debugMotherTextComparison = debugMotherTextComparison;

console.log('🔧 Debug script loaded. Run window.debugMotherTextComparison() anytime.');