# 🔍 Complete Text Overflow Analysis - All 12 Factors

**Comprehensive step-by-step analysis with detailed equations**

## 📋 All 12 Factors Affecting Text Overflow

### 👤 User-Specified Factors (6):

1. **Region Width:** 40mm
2. **Region Height:** 90mm  
3. **Padding Top:** 4mm
4. **Padding Right:** 4mm
5. **Padding Bottom:** 4mm
6. **Padding Left:** 4mm
7. **Font Family:** Arial
8. **Font Size:** 10px
9. **Line Spacing:** 1.2
10. **Text Content:** 1,185 characters (multilingual fabric composition)

### 🔧 System Factors (6) - How the Computer Calculates:

11. **Line Break Symbol:** "\n" *(What starts a new line - like pressing Enter)*
12. **Zoom Factor:** 1.0 *(Normal view - not zoomed in/out)*
13. **Screen Resolution:** 3.779527559 pixels per mm *(How computer converts mm to screen dots)*
14. **Text Position:** 0.8 × font size *(Where text sits on the line, not floating)*
15. **Safety Margin:** 1.5mm *(Extra space so text doesn't touch edges)*
16. **Keep Words Whole:** true *(Never break words in middle - move whole word to next line)*

## 💡 What These System Factors Really Mean:

### 🔤 Line Break Symbol ("\n"):
This tells the computer "start a new line here" - just like when you press Enter while typing.

### 🔍 Zoom Factor (1.0):
This means we're looking at normal size (100%). If it was 2.0, everything would be twice as big. We use 1.0 for accurate calculations.

### 📺 Screen Resolution (3.78 pixels/mm):
Your computer screen has tiny dots called pixels. This number tells us how many dots fit in 1mm. It's like knowing how many LEGO blocks fit in an inch.

### 📏 Text Position (0.8 × font size):
When you type, letters don't float in space - they sit on an invisible line. This factor makes sure we measure from the right spot so text doesn't get cut off.

### 🛡️ Safety Margin (1.5mm):
Like leaving space around the edges of a picture frame. We keep text 1.5mm away from the edges so it looks nice and doesn't get too close to the border.

### ✂️ Keep Words Whole (Yes):
The computer will NEVER break a word in the middle. If "computer" doesn't fit on a line, the whole word moves to the next line. No "compu-ter" splits!

## 🧮 Step-by-Step Calculation Equations

### 🔢 Step 1: Region Space Calculations

```
regionWidthPx = regionWidth × mmToPx
regionWidthPx = 40 × 3.779527559 = 151.18px

regionHeightPx = regionHeight × mmToPx  
regionHeightPx = 90 × 3.779527559 = 340.16px
```

### 🔢 Step 2: Available Space After Padding

```
paddingLeftPx = paddingLeft × mmToPx = 4 × 3.779527559 = 15.12px
paddingRightPx = paddingRight × mmToPx = 4 × 3.779527559 = 15.12px
paddingTopPx = paddingTop × mmToPx = 4 × 3.779527559 = 15.12px
paddingBottomPx = paddingBottom × mmToPx = 4 × 3.779527559 = 15.12px

availableWidthPx = regionWidthPx - paddingLeftPx - paddingRightPx
availableWidthPx = 151.18 - 15.12 - 15.12 = 120.94px

availableHeightPx = regionHeightPx - paddingTopPx - paddingBottomPx
availableHeightPx = 340.16 - 15.12 - 15.12 = 309.92px
```

### 🔢 Step 3: Font Size and Zoom Scaling

```
fontSizePx = 10 (already in pixels)
scaledFontSize = Math.max(6, fontSizePx × zoom)
scaledFontSize = Math.max(6, 10 × 1.0) = 10px

scaledFontSizeMm = scaledFontSize ÷ mmToPx
scaledFontSizeMm = 10 ÷ 3.779527559 = 2.646mm
```

### 🔢 Step 4: Line Height Calculation

```
lineHeightMm = scaledFontSizeMm × lineSpacing
lineHeightMm = 2.646 × 1.2 = 3.175mm

availableHeightMm = availableHeightPx ÷ mmToPx
availableHeightMm = 309.92 ÷ 3.779527559 = 82.0mm
```

### 🔢 Step 5: Safety Buffer Application

```
availableWidthMm = availableWidthPx ÷ mmToPx
availableWidthMm = 120.94 ÷ 3.779527559 = 32.0mm

effectiveAvailableWidth = availableWidthMm - userSafetyBuffer
effectiveAvailableWidth = 32.0 - 1.5 = 30.5mm
```

### 🔢 Step 6: Maximum Lines Calculation

```
maxVisibleLines = Math.floor(availableHeightMm ÷ lineHeightMm)
maxVisibleLines = Math.floor(82.0 ÷ 3.175) = 25 lines
```

## 📊 Analysis Results & Measurements

- **Effective Width:** 30.5mm
- **Available Height:** 82.0mm
- **Line Height:** 3.175mm
- **Max Lines:** 25
- **Total Lines Generated:** ~40 lines
- **Text Height Needed:** ~127mm
- **Has Overflow:** 🌊 YES

⚠️ **OVERFLOW DETECTED:** Text needs ~40 lines but only 25 fit. Overflow: ~15 lines.

## 📝 Text Splitting Results

### Sample Text Content:
```
60% algodón - coton - cotton - algodão - katoen - cotone - ΒΑΜΒΑΚΙ - コットン - baumwolle - bomuld - bombaž - 棉 - 면 - katun - قطن - algodón - cotó - kotoia

10% poliéster - polyester - polyester - poliéster - polyester - poliestere - ΠΟΛΥΕΣΤΕΡΑΣ - ポリエステル - polyester - polyester - poliester - 聚酯纤维 - 폴리에스터 - poliester - بوليستير - poliéster - polièster - poliesterra

10% elastano - élasthanne - elastane - elastano - elastaan - elastan - ΕΛΑΣΤΑΝΗ - エラスタン - elastan - elastan - elastan - 氨纶 - 엘라스탄 - elastan - إيلاستان - elastano - elastà - elastanoa

10% nailon - nylon - nylon - nylon (so p/o Brasil poliamida) - nylon - nailon - ΝΑΪΛΟΝ - ナイロン - nylon - nylon - najlon - 锦纶 - 나일론 - nilon - نايلون - nailon - niló - nylona

10% lana - laine - wool - lã - wol - lana - ΜΑΛΛΙ - ウール - wolle - uld - volna - 羊毛 - 울 - wol - صوف - la - llana - artilea
```

### 📄 SPLIT 1 - Original Mother (Keeps Text)

**Lines 1-25 (fits in original mother):**

```
Line 1: 60% algodón - coton - cotton - algodão -
Line 2: katoen - cotone - ΒΑΜΒΑΚΙ - コットン -
Line 3: baumwolle - bomuld - bombaž - 棉 - 면 -
Line 4: katun - قطن - algodón - cotó - kotoia
Line 5: (breakline)
Line 6: 10% poliéster - polyester - polyester -
Line 7: poliéster - polyester - poliestere -
Line 8: ΠΟΛΥΕΣΤΕΡΑΣ - ポリエステル - polyester -
Line 9: polyester - poliester - 聚酯纤维 -
Line 10: 폴리에스터 - poliester - بوليستير -
Line 11: poliéster - polièster - poliesterra
Line 12: (breakline)
Line 13: 10% elastano - élasthanne - elastane -
Line 14: elastano - elastaan - elastan - ΕΛΑΣΤΑΝΗ -
Line 15: エラスタン - elastan - elastan - elastan -
Line 16: 氨纶 - 엘라스탄 - elastan - إيلاستان -
Line 17: elastano - elastà - elastanoa
Line 18: (breakline)
Line 19: 10% nailon - nylon - nylon - nylon (so
Line 20: p/o Brasil poliamida) - nylon - nailon -
Line 21: ΝΑΪΛΟΝ - ナイロン - nylon - nylon -
Line 22: najlon - 锦纶 - 나일론 - nilon - نايلون -
Line 23: nailon - niló - nylona
Line 24: (breakline)
Line 25: 10% lana - laine - wool - lã - wol -
```

**----- SPLIT HERE (25 lines in original mother) -----**

### 👶 SPLIT 2 - New Child Mother (Gets Overflow)

**Lines 26-40 (goes to new child mother):**

```
Line 26: lana - ΜΑΛΛΙ - ウール - wolle - uld -
Line 27: volna - 羊毛 - 울 - wol - صوف - la -
Line 28: llana - artilea
```

## 🎯 Key Insights

1. **Most content fits in original mother** (25/28 lines = 89%)
2. **Only 3 lines overflow** to the new child mother
3. **Split happens at word boundaries** - no broken words
4. **Safety margin ensures clean edges** (1.5mm buffer)
5. **Automatic overflow protection** creates seamless user experience

## 🔧 Technical Implementation

The system uses HTML5 Canvas `measureText()` for precise width calculations, ensuring accurate text fitting across different fonts, sizes, and languages including Unicode characters (Arabic, Chinese, Japanese, Greek, etc.).

### Word Wrapping Algorithm:
1. Split text by manual line breaks
2. For each line, test if it fits within effective width
3. If not, split into words and build lines word-by-word
4. Never break words - always move complete words to next line
5. Apply safety buffer to prevent edge touching
6. Count total lines and compare to available height
7. Split at line boundaries when overflow detected

---

*Generated by Care Label Layout System v2.9.155*
*Analysis Date: September 19, 2025*
