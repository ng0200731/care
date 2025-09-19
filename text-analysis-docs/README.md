# Text Analysis Documentation

This folder contains comprehensive documentation for the text overflow analysis system used in the Care Label Layout application.

## 📁 Files in this folder:

### `complete-text-overflow-analysis.md`
Complete analysis showing all 12 factors that affect text overflow splitting, with:
- Step-by-step mathematical equations
- Clear explanations of technical terms
- Example text splitting for 40×90mm label with 4mm padding
- Line-by-line breakdown showing exactly where text splits

## 🎯 Purpose

This documentation helps understand:
1. **Why text splits** when it doesn't fit in a region
2. **How the system calculates** available space and line fitting  
3. **What factors affect** the splitting behavior
4. **Where exactly** the split occurs (line-by-line)

## 🔧 Technical Details

The analysis covers both user-controllable factors (region size, padding, font settings) and system factors (screen resolution, safety margins, word preservation) that influence how text overflows and splits into multiple mother objects.

## 📊 Example Case

The main analysis document uses a real-world example:
- **Region:** 40×90mm with 4mm padding
- **Font:** Arial 10px with 1.2 line spacing
- **Content:** Multilingual fabric composition (1,185 characters)
- **Result:** Text splits into 25 lines (original) + 3 lines (overflow)

---

*Part of Care Label Layout System v2.9.155*
