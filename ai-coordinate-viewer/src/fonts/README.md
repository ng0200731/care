# Font Files

This directory contains font files needed for PDF generation.

## Wash Care Symbols M54 Font

To properly embed the "Wash Care Symbols M54" font in PDF exports:

1. **Get the font file**: Obtain `WashCareSymbolsM54.ttf` 
2. **Place it here**: Copy the TTF file to this directory
3. **Convert to base64**: Use the conversion script below
4. **Update the code**: Replace the placeholder in `embedWashCareFont()` function

## Font Conversion Script

```javascript
// Node.js script to convert TTF to base64
const fs = require('fs');

// Read the font file
const fontBuffer = fs.readFileSync('./WashCareSymbolsM54.ttf');

// Convert to base64
const fontBase64 = fontBuffer.toString('base64');

// Output the base64 string
console.log('Font base64 string:');
console.log(fontBase64);

// Save to file for easy copying
fs.writeFileSync('./font-base64.txt', fontBase64);
console.log('Base64 string saved to font-base64.txt');
```

## Usage

Once you have the base64 string, update the `embedWashCareFont()` function in `App.tsx`:

```javascript
const washCareFontBase64 = 'YOUR_BASE64_STRING_HERE';
```

This will enable proper font embedding in PDF exports.
