import React, { useState, useEffect } from 'react';
import MovableDialog from './MovableDialog';

// Version tracking for debugging
const DIALOG_VERSION = 'v2.9.133-comprehensive-refresh';

// Available languages from composition table (18 languages) - Database codes
const availableLanguages = [
  { code: 'AR', name: 'Arabic' },
  { code: 'BS', name: 'Basque' },
  { code: 'CA', name: 'Catalan' },
  { code: 'CH', name: 'Chinese' },
  { code: 'DA', name: 'Danish' },
  { code: 'DU', name: 'Dutch' },
  { code: 'EN', name: 'English' },
  { code: 'FR', name: 'French' },
  { code: 'GA', name: 'Galician' },
  { code: 'DE', name: 'German' },
  { code: 'GR', name: 'Greek' },
  { code: 'ID', name: 'Indonesian' },
  { code: 'IT', name: 'Italian' },
  { code: 'JA', name: 'Japanese' },
  { code: 'KO', name: 'Korean' },
  { code: 'PT', name: 'Portuguese' },
  { code: 'SL', name: 'Slovenian' },
  { code: 'ES', name: 'Spanish' }
];

// Common materials from composition table (will be fetched from API)
const commonMaterials = [
  'COTTON',
  'POLYESTER',
  'ELASTANE',
  'VISCOSE',
  'NYLON',
  'WOOL',
  'SILK',
  'LINEN',
  'ACRYLIC',
  'POLYAMIDE',
  'SPANDEX',
  'MODAL',
  'BAMBOO',
  'CASHMERE',
  'ALPACA'
];

// Material translations mapping (from composition table)
// Order: ES, FR, EN, PT, DU, IT, GR, JA, DE, DA, SL, CH, KO, ID, AR, GA, CA, BS
const materialTranslations: { [key: string]: string[] } = {
  'COTTON': ['algodón', 'coton', 'cotton', 'algodão', 'katoen', 'cotone', 'ΒΑΜΒΑΚΙ', 'コットン', 'baumwolle', 'bomuld', 'bombaž', '棉', '면', 'katun', 'قطن', 'algodón', 'cotó', 'kotoia'],
  'POLYESTER': ['poliéster', 'polyester', 'polyester', 'poliéster', 'polyester', 'poliestere', 'ΠΟΛΥΕΣΤΕΡΑΣ', 'ポリエステル', 'polyester', 'polyester', 'poliester', '聚酯纤维', '폴리에스터', 'poliester', 'بوليستير', 'poliéster', 'polièster', 'poliesterra'],
  'ELASTANE': ['elastano', 'élasthanne', 'elastane', 'elastano', 'elastaan', 'elastan', 'ΕΛΑΣΤΑΝΗ', 'エラスタン', 'elastan', 'elastan', 'elastan', '氨纶', '엘라스탄', 'elastan', 'إيلاستان', 'elastano', 'elastà', 'elastanoa'],
  'VISCOSE': ['viscosa', 'viscose', 'viscose', 'viscose', 'viscose', 'viscosa', 'ΒΙΣΚΟΖΗ', 'ビスコース', 'viskose', 'viskose', 'viskoza', '粘胶纤维', '비스코스', 'viskosa', 'فيسكوز', 'viscosa', 'viscosa', 'biskosea'],
  'NYLON': ['nailon', 'nylon', 'nylon', 'nylon (so p/o Brasil poliamida)', 'nylon', 'nailon', 'ΝΑΪΛΟΝ', 'ナイロン', 'nylon', 'nylon', 'najlon', '锦纶', '나일론', 'nilon', 'نايلون', 'nailon', 'niló', 'nylona'],
  // Note: Add more materials as translations become available from the composition table
  // For materials without translations, they will display as the original material name
  'WOOL': ['lana', 'laine', 'wool', 'lã', 'wol', 'lana', 'ΜΑΛΛΙ', 'ウール', 'wolle', 'uld', 'volna', '羊毛', '울', 'wol', 'صوف', 'la', 'llana', 'artilea'],
  'SILK': ['seda', 'soie', 'silk', 'seda', 'zijde', 'seta', 'ΜΕΤΑΞΙ', 'シルク', 'seide', 'silke', 'svila', '丝绸', '실크', 'sutra', 'حرير', 'seda', 'seda', 'zetaa'],
  'LINEN': ['lino', 'lin', 'linen', 'linho', 'linnen', 'lino', 'ΛΙΝΑΡΙ', 'リネン', 'leinen', 'hør', 'lan', '亚麻', '린넨', 'linen', 'كتان', 'liño', 'lli', 'lihoaren'],
  // Materials from database with complete 18-language translations
  'ACRYLIC': ['acrílico', 'acrylique', 'acrylic', 'acrílico', 'acryl', 'acrilico', 'ΑΚΡΥΛΙΚΟ', 'アクリル', 'acryl', 'akryl', 'akril', '腈纶', '아크릴', 'akrilik', 'أكريليك', 'acrílico', 'acrílic', 'akrilikoa'],
  'POLYAMIDE': ['poliamida', 'polyamide', 'polyamide', 'poliamida', 'polyamide', 'poliammide', 'ΠΟΛΥΑΜΙΔΙΟ', 'ナイロン', 'polyamid', 'polyamid', 'poliamid', '锦纶', '폴리아미드', 'poliamida', 'بولياميد', 'poliamida', 'poliamida', 'poliamida'],
  'MODAL': ['modal', 'modal', 'modal', 'modal', 'modal', 'modale', 'ΙΝΑ ΜΟΝΤΑΛ', 'モダル', 'modal', 'modal', 'modal', '莫代尔纤维', '모달', 'modal', 'شكلي', 'modal', 'modal', 'modala'],
  'BAMBOO': ['bambú', 'bambou', 'bamboo', 'bambu', 'bamboe', 'bambù', 'ΜΠΑΜΠΟΥ', '竹材', 'bambus', 'bambus', 'bambus', '竹', '대나무', 'bambu', 'الخيزران', 'bambú', 'bambú', 'banbu'],
  'CASHMERE': ['cachemira', 'cachemire', 'cashmere', 'caxemira', 'kasjmier', 'cashmere', 'ΚΑΣΜΙΡΙ', 'カシミア', 'kaschmir', 'kashmir', 'kašmir', '山羊绒', '캐시미어', 'kasmir', 'كشمير', 'caxemira', 'caixmir', 'kaxmirra'],
  'ALPACA': ['alpaca', 'alpaga', 'alpaca', 'alpaca', 'alpaca', 'alpaca', 'ΑΛΠΑΚΑΣ', 'アルパカ', 'alpaka', 'alpaka', 'alpaka', '羊驼毛', '알파카', 'domba', 'الألبكة', 'alpaca', 'alpaca', 'alpaka']
};

// Line break symbol options
const lineBreakSymbols = [
  { value: '\n', label: '\\n (Standard)' },
  { value: '\r\n', label: '\\r\\n (Windows)' },
  { value: '<br>', label: '<br> (HTML)' },
  { value: ' | ', label: ' | (Pipe)' },
  { value: ' / ', label: ' / (Slash)' }
];

export interface MaterialComposition {
  id: string;
  percentage: number;
  material: string;
}

export interface NewCompTransConfig {
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontSizeUnit: string;
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  selectedLanguages: string[];
  materialCompositions: MaterialComposition[];
  textContent: {
    separator: string;
    generatedText: string;
    originalText?: string; // Store the original raw text before any processing
  };
  lineBreakSettings: {
    lineBreakSymbol: string;
    lineSpacing: number;
    lineWidth: number;
  };
  // overflowOption removed - now handled automatically
}

interface NewCompTransDialogProps {
  isOpen: boolean;
  regionId: string;
  regionWidth: number;
  regionHeight: number;
  editingContent?: any;
  existingCompositions?: MaterialComposition[][]; // Array of existing composition arrays from other regions
  onSave: (config: NewCompTransConfig) => void;
  onCancel: () => void;
  onCreateNewMother?: (childMotherId: string, textContent: string) => void; // Add content to existing child mother
  createChildMother?: (parentMotherId: string) => string; // Create child mother structure, returns child ID
}

const NewCompTransDialog: React.FC<NewCompTransDialogProps> = ({
  isOpen,
  regionId,
  regionWidth,
  regionHeight,
  editingContent,
  existingCompositions = [],
  onSave,
  onCancel,
  onCreateNewMother,
  createChildMother
}) => {
  // Initialize config from editing content or defaults
  function getInitialConfig(): NewCompTransConfig {
    console.log('🔬 DEBUG_FIX: getInitialConfig called');
    console.log('🔬 DEBUG_FIX: editingContent:', editingContent);
    console.log('🔬 DEBUG_FIX: editingContent.newCompTransConfig:', editingContent?.newCompTransConfig);
    console.log('🔬 DEBUG_FIX: existing text:', editingContent?.newCompTransConfig?.textContent?.generatedText);

    if (editingContent && editingContent.newCompTransConfig) {
      const existingText = editingContent.newCompTransConfig.textContent?.generatedText;
      console.log('🔬 DEBUG_FIX: Loading existing config');
      console.log('🔬 DEBUG_FIX: OLD text found:', existingText?.substring(0, 50));
      console.log('🔬 DEBUG_FIX: OLD text length:', existingText?.length || 0);

      // 🔧 FIX: When editing, ALWAYS CLEAR THE OLD TEXT!
      // User wants to start fresh, not edit old split1 garbage!
      console.log('🧹 FIX: CLEARING old text - user will start fresh');

      // Enhanced validation of existing config structure
      const loadedConfig = {
        ...editingContent.newCompTransConfig,
        selectedLanguages: editingContent.newCompTransConfig.selectedLanguages || ['EN'],
        materialCompositions: editingContent.newCompTransConfig.materialCompositions || [
          { id: '1', percentage: 100, material: 'COTTON' }
        ],
        // 🔧 FIX: CLEAR old text - set to empty!
        textContent: {
          separator: editingContent.newCompTransConfig.textContent?.separator || ' - ',
          generatedText: '',  // ALWAYS START EMPTY!
          originalText: ''    // ALWAYS START EMPTY!
        },
        lineBreakSettings: editingContent.newCompTransConfig.lineBreakSettings || {
          lineBreakSymbol: '\n',
          lineSpacing: 1.2,
          lineWidth: 100
        }
        // overflowOption removed - automatic handling
      };

      console.log('✅ FIX: Text CLEARED - starting fresh');
      console.log('✅ FIX: Material compositions kept:', loadedConfig.materialCompositions);
      console.log('✅ FIX: Selected languages kept:', loadedConfig.selectedLanguages);

      return loadedConfig;
    }

    console.log('🔬 DEBUG_FIX: No existing config found, using defaults');

    return {
      padding: {
        top: 2,
        right: 2,
        bottom: 2,
        left: 2
      },
      typography: {
        fontFamily: 'Arial',
        fontSize: 10,
        fontSizeUnit: 'px'
      },
      alignment: {
        horizontal: 'left',
        vertical: 'top'
      },
      selectedLanguages: ['EN'], // Default to English
      materialCompositions: [
        { id: '1', percentage: 100, material: 'COTTON' }
      ],
      textContent: {
        separator: ' - ',
        generatedText: '',
        originalText: ''
      },
      lineBreakSettings: {
        lineBreakSymbol: '\n',
        lineSpacing: 1.2,
        lineWidth: 100
      }
      // overflowOption removed - automatic handling enabled
    };
  };

  const [config, setConfig] = useState<NewCompTransConfig>(() => getInitialConfig());

  // Overflow handling is now automatic - no user selection needed

  // Overflow detection state for UI feedback
  const [hasOverflow, setHasOverflow] = useState(false);
  
  // Track whether user has manually edited the text
  const [isTextManuallyEdited, setIsTextManuallyEdited] = useState(false);
  
  // Step-by-step debugging state
  const [debugStep, setDebugStep] = useState(0);
  const [split1Text, setSplit1Text] = useState('');
  const [split2Text, setSplit2Text] = useState('');

  // Helper function to generate a unique signature for a composition
  const generateCompositionSignature = (compositions: MaterialComposition[]): string => {
    // Sort compositions by material name to ensure consistent signatures
    const sortedCompositions = [...compositions]
      .filter(comp => comp.material && comp.percentage > 0)
      .sort((a, b) => a.material.localeCompare(b.material));

    // Create signature based on materials AND percentages for exact duplicate detection
    return sortedCompositions
      .map(comp => `${comp.material}:${comp.percentage}`)
      .join('|');
  };

  // Helper function to generate material-only signature (ignoring percentages)
  const generateMaterialOnlySignature = (compositions: MaterialComposition[]): string => {
    // Sort materials to ensure consistent signatures, ignore percentages
    const materials = [...compositions]
      .filter(comp => comp.material && comp.percentage > 0)
      .map(comp => comp.material)
      .sort();

    return materials.join('|');
  };

  // Helper function to get available materials (excluding already selected ones)
  const getAvailableMaterials = (): string[] => {
    const selectedMaterials = config.materialCompositions
      .filter(comp => comp.material && comp.percentage > 0)
      .map(comp => comp.material);

    const availableMaterials = commonMaterials.filter(material =>
      !selectedMaterials.includes(material)
    );


    return availableMaterials;
  };

  // Helper function to check for duplicate materials within current composition
  const hasDuplicateMaterials = (): boolean => {
    const materials = config.materialCompositions
      .filter(comp => comp.material && comp.percentage > 0)
      .map(comp => comp.material);

    const uniqueMaterials = new Set(materials);
    const hasDuplicates = materials.length !== uniqueMaterials.size;


    return hasDuplicates;
  };

  // Helper function to check if current composition already exists
  const isCompositionAlreadyUsed = (): boolean => {
    const currentMaterialSignature = generateMaterialOnlySignature(config.materialCompositions);
    if (!currentMaterialSignature) return false; // Empty composition is not considered used


    // Check against existing compositions from other regions - prevent same materials regardless of percentages
    const isDuplicate = existingCompositions.some(existingComp => {
      const existingMaterialSignature = generateMaterialOnlySignature(existingComp);
      return existingMaterialSignature === currentMaterialSignature;
    });

    return isDuplicate;
  };

  // Helper functions for material composition validation
  const getTotalPercentage = () => {
    return config.materialCompositions.reduce((sum, comp) => sum + comp.percentage, 0);
  };

  const canAddMore = () => {
    const total = getTotalPercentage();
    return total < 100;
  };

  const canSave = () => {
    const total = getTotalPercentage();
    const isValidPercentage = total === 100;
    const hasNoDuplicateMaterials = !hasDuplicateMaterials();
    const isNotDuplicate = !isCompositionAlreadyUsed();


    return isValidPercentage && hasNoDuplicateMaterials && isNotDuplicate;
  };

  const areControlsDisabled = () => {
    const total = getTotalPercentage();
    return total > 100;
  };

  // Material inputs should always be active so users can fix over-100% situations
  const areInputsDisabled = () => {
    return false; // Always keep inputs active for editing
  };

  // Generate text content based on material compositions and selected languages
  const generateTextContent = () => {
    if (config.materialCompositions.length === 0 || config.selectedLanguages.length === 0) {
      return '';
    }

    const lines: string[] = [];

    config.materialCompositions.forEach(composition => {
      if (composition.material && composition.percentage > 0) {
        const translations = materialTranslations[composition.material];
        if (translations) {
          const materialTexts: string[] = [];

          // Map selected language codes to translation indices
          config.selectedLanguages.forEach(langCode => {
            const langIndex = availableLanguages.findIndex(lang => lang.code === langCode);
            if (langIndex !== -1 && translations[langIndex]) {
              materialTexts.push(translations[langIndex]);
            }
          });

          if (materialTexts.length > 0) {
            const line = `${composition.percentage}% ${materialTexts.join(config.textContent.separator)}`;
            lines.push(line);
          }
        }
      }
    });

    return lines.join('\n\n');
  };

  // Generate wrapped text for preview based on line break settings
  const generateWrappedPreview = () => {
    const baseText = generateTextContent();
    if (!baseText) return '';

    // Split into lines and apply line width wrapping
    const lines = baseText.split('\n\n');
    const wrappedLines: string[] = [];

    lines.forEach(line => {
      if (line.trim()) {
        // Simple character-based wrapping based on line width percentage
        const maxCharsPerLine = Math.floor(((config.lineBreakSettings?.lineWidth || 100) / 100) * 80); // Approximate chars per line

        if (line.length <= maxCharsPerLine) {
          wrappedLines.push(line);
        } else {
          // Split long lines at word boundaries
          const words = line.split(' ');
          let currentLine = '';

          words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
              currentLine = currentLine ? currentLine + ' ' + word : word;
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
        }
      }
    });

    // Join with the selected line break symbol
    return wrappedLines.join(config.lineBreakSettings?.lineBreakSymbol || '\n');
  };

  // Extract mother name from regionId (e.g., "Mother_3_Region_1" -> "Mother_3")
  const extractMotherNameFromRegionId = (regionId: string): string => {
    const match = regionId.match(/^(Mother_\d+)/);
    return match ? match[1] : 'Mother_3'; // Default fallback
  };

  // Clean up child mothers recursively
  const cleanupChildMothers = (parentMotherName: string) => {
    console.log(`🧹 Cleaning up child mothers for parent: ${parentMotherName}`);

    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ No app data available for cleanup');
      return;
    }

    // Find parent mother
    const parentMother = currentData.objects.find((obj: any) => obj.name === parentMotherName);
    if (!parentMother) {
      console.log(`❌ Parent mother ${parentMotherName} not found`);
      return;
    }

    // Recursive function to remove child mothers and their descendants
    const removeChildMothersRecursively = (motherIds: string[]) => {
      motherIds.forEach(childId => {
        const childMother = currentData.objects.find((obj: any) => obj.name === childId);
        if (childMother) {
          console.log(`🗑️ Removing child mother: ${childId}`);

          // First, recursively remove any grandchildren
          const grandchildIds = (childMother as any).childMotherIds || [];
          if (grandchildIds.length > 0) {
            console.log(`🔄 Recursively removing grandchildren of ${childId}:`, grandchildIds);
            removeChildMothersRecursively(grandchildIds);
          }
        }
      });

      // Remove all the child mothers from the objects array
      currentData.objects = currentData.objects.filter((obj: any) =>
        !motherIds.includes(obj.name)
      );
    };

    // Get child mother IDs and clean them up
    const childMotherIds = (parentMother as any).childMotherIds || [];
    if (childMotherIds.length > 0) {
      console.log(`🧹 Found ${childMotherIds.length} child mothers to clean up:`, childMotherIds);
      removeChildMothersRecursively(childMotherIds);

      // Clear the parent's child mother list
      (parentMother as any).childMotherIds = [];

      // Update the app data
      const updateAppData = (window as any).updateAppData;
      if (updateAppData) {
        updateAppData(currentData);
      }

      console.log(`✅ Cleanup completed for parent: ${parentMotherName}`);
    } else {
      console.log(`ℹ️ No child mothers found for parent: ${parentMotherName}`);
    }
  };

  // Enhanced N-split overflow detection and text splitting
  const detectOverflowAndSplitN = () => {
    // Check if we have a temporary config override from 2in1 button or Save button
    const effectiveConfig = (window as any).__temp2in1Config || (window as any).__tempConfigForSave || config;

    console.log(`🔍 N-SPLIT: effectiveConfig.textContent.originalText length:`, effectiveConfig.textContent.originalText?.length || 0);
    console.log(`🔍 N-SPLIT: effectiveConfig.textContent.generatedText length:`, effectiveConfig.textContent.generatedText?.length || 0);

    // Use original text if available, fallback to generated text, then to auto-generated content
    const text = effectiveConfig.textContent.originalText || effectiveConfig.textContent.generatedText || generateTextContent();
    console.log(`🔍 N-SPLIT: Detecting overflow for text:`, text?.substring(0, 50) || 'NO TEXT');
    console.log(`🔍 N-SPLIT: Text length:`, text?.length || 0);
    console.log(`🔍 N-SPLIT: Region dimensions:`, { regionWidth, regionHeight });

    if (!text || !regionWidth || !regionHeight) {
      console.log('🔍 N-SPLIT: Early return - no text or dimensions');
      return {
        hasOverflow: false,
        textSplits: [text || ''],
        totalSplits: 1,
        splitDetails: [{ text: text || '', lines: 0 }]
      };
    }

    // Calculate available space in pixels
    const regionWidthPx = regionWidth * 3.779527559; // Convert mm to px (96 DPI)
    const regionHeightPx = regionHeight * 3.779527559;
    const paddingLeftPx = effectiveConfig.padding.left * 3.779527559;
    const paddingRightPx = effectiveConfig.padding.right * 3.779527559;
    const paddingTopPx = effectiveConfig.padding.top * 3.779527559;
    const paddingBottomPx = effectiveConfig.padding.bottom * 3.779527559;

    const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
    const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

    // Convert font size to pixels
    let fontSizePx = effectiveConfig.typography.fontSize;
    if (effectiveConfig.typography.fontSizeUnit === 'mm') {
      fontSizePx = effectiveConfig.typography.fontSize * 3.779527559;
    } else if (effectiveConfig.typography.fontSizeUnit === 'pt') {
      fontSizePx = (effectiveConfig.typography.fontSize * 4/3);
    }

    const zoom = 1.0;
    const scaledFontSize = Math.max(6, fontSizePx * zoom);

    // Text width estimation using canvas measurement
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2;

      context.font = `${scaledFontSize}px ${effectiveConfig.typography.fontFamily}`;
      const textWidthPx = context.measureText(text).width;
      return textWidthPx / 3.779527559;
    };

    const availableWidthMm = availableWidthPx / 3.779527559;

    // CRITICAL: Apply safety buffer exactly like Text Overflow Analysis Settings
    // From Settings.tsx: userSafetyBuffer = 1.5mm
    const userSafetyBuffer = 1.5;
    const effectiveAvailableWidth = availableWidthMm - userSafetyBuffer;

    const scaledFontSizeMm = scaledFontSize / 3.779527559;
    // 🔧 FIX: Use effectiveConfig instead of config for lineSpacing
    const lineHeightMm = scaledFontSizeMm * (effectiveConfig.lineBreakSettings?.lineSpacing || 1.2);
    const availableHeightMm = availableHeightPx / 3.779527559;

    // CRITICAL: Follow Text Overflow Analysis Settings exactly
    // From Settings.tsx: maxVisibleLines = Math.floor(availableHeightMm / lineHeightMm)
    const maxLinesPerMother = Math.floor(availableHeightMm / lineHeightMm);

    console.log(`🔍 N-SPLIT: Font calculations:`, {
      scaledFontSizeMm: scaledFontSizeMm.toFixed(2),
      lineSpacing: config.lineBreakSettings?.lineSpacing || 1.2,
      lineHeightMm: lineHeightMm.toFixed(2),
      availableHeightMm: availableHeightMm.toFixed(2),
      maxLinesPerMother
    });

    console.log(`🔍 N-SPLIT: Text Overflow Analysis Settings compliance:`, {
      regionWidthMm: regionWidth,
      regionHeightMm: regionHeight,
      availableWidthMm: availableWidthMm.toFixed(1),
      userSafetyBuffer: userSafetyBuffer,
      effectiveAvailableWidth: effectiveAvailableWidth.toFixed(1),
      maxLinesPerMother: maxLinesPerMother,
      note: 'Following Settings.tsx calculations exactly'
    });

    console.log(`🔍 N-SPLIT: Max lines per mother: ${maxLinesPerMother}`);

    // Word wrapping logic
    const wrapTextToLines = (text: string): string[] => {
      // 🔧 FIX: Use effectiveConfig instead of config
      const lineBreakSymbol = effectiveConfig.lineBreakSettings?.lineBreakSymbol || '\n';
      const manualLines = text.split(lineBreakSymbol);
      const wrappedLines: string[] = [];

      console.log(`🔍 N-SPLIT: Line break symbol: "${lineBreakSymbol}"`);
      console.log(`🔍 N-SPLIT: Manual lines from original text: ${manualLines.length}`);

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

          // CRITICAL: Use effectiveAvailableWidth with safety buffer (like Text Overflow Analysis Settings)
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

    const allLines = wrapTextToLines(text);
    console.log(`🔍 N-SPLIT: Total lines after wrapping: ${allLines.length}`);

    // Check if splitting is needed
    if (allLines.length <= maxLinesPerMother) {
      console.log('🔍 N-SPLIT: NO OVERFLOW - text fits in single mother');
      return {
        hasOverflow: false,
        textSplits: [text],
        totalSplits: 1,
        splitDetails: [{ text: text, lines: allLines.length }]
      };
    }

    // Calculate how many mothers needed - be more conservative
    const totalMothersNeeded = Math.ceil(allLines.length / maxLinesPerMother);
    console.log(`🔍 N-SPLIT: OVERFLOW DETECTED - Need ${totalMothersNeeded} mothers`);

    // Double-check: ensure maxLinesPerMother is reasonable
    if (maxLinesPerMother <= 0) {
      console.error(`❌ N-SPLIT: Invalid maxLinesPerMother: ${maxLinesPerMother}`);
      return {
        hasOverflow: false,
        textSplits: [text],
        totalSplits: 1,
        splitDetails: [{ text: text, lines: allLines.length }]
      };
    }

    // Split lines optimally - fill each mother completely before moving to next
    const textSplits: string[] = [];
    const splitDetails: { text: string; lines: number }[] = [];

    console.log(`🔍 N-SPLIT: Starting optimal distribution across ${totalMothersNeeded} mothers`);
    console.log(`🔍 N-SPLIT: Total lines to distribute: ${allLines.length}`);
    console.log(`🔍 N-SPLIT: Max lines per mother: ${maxLinesPerMother}`);

    let currentLineIndex = 0;
    let motherIndex = 0;

    while (currentLineIndex < allLines.length && motherIndex < totalMothersNeeded) {
      // For each mother, take exactly maxLinesPerMother lines (or remaining lines if it's the last mother)
      const isLastMother = motherIndex === totalMothersNeeded - 1;
      const remainingLines = allLines.length - currentLineIndex;

      // Strategic distribution: Fill each mother to capacity, except last one which takes remainder
      let linesToTake: number;
      if (isLastMother) {
        // Last mother takes all remaining lines
        linesToTake = remainingLines;
      } else {
        // Non-last mothers take full capacity (maxLinesPerMother) to ensure optimal fill
        linesToTake = Math.min(maxLinesPerMother, remainingLines);
      }

      const motherLines = allLines.slice(currentLineIndex, currentLineIndex + linesToTake);
      const motherText = motherLines.join(config.lineBreakSettings?.lineBreakSymbol || '\n');

      textSplits.push(motherText);
      splitDetails.push({ text: motherText, lines: motherLines.length });

      // Calculate fill percentage for this mother
      const fillPercentage = ((motherLines.length / maxLinesPerMother) * 100).toFixed(1);

      console.log(`🔍 N-SPLIT: Split ${motherIndex + 1}/${totalMothersNeeded} - ${motherLines.length}/${maxLinesPerMother} lines (${fillPercentage}% fill)`);
      console.log(`🔍 N-SPLIT: Fill type: ${isLastMother ? 'LAST MOTHER - ALL REMAINING' : 'OPTIMAL CAPACITY FILL'}`);
      console.log(`🔍 N-SPLIT: Text preview: "${motherText.substring(0, 50)}..."`);
      console.log(`🔍 N-SPLIT: Remaining after this split: ${allLines.length - (currentLineIndex + linesToTake)} lines`);

      // CRITICAL VALIDATION: Check against Text Overflow Analysis Settings expectations
      if (!isLastMother && motherLines.length < maxLinesPerMother) {
        console.warn(`⚠️ SETTINGS VIOLATION: Mother ${motherIndex + 1} not filled to capacity! Expected ${maxLinesPerMother} lines, got ${motherLines.length}`);
      }
      if (!isLastMother && fillPercentage !== '100.0') {
        console.warn(`⚠️ SETTINGS VIOLATION: Mother ${motherIndex + 1} fill percentage is ${fillPercentage}%, should be 100.0%`);
      }

      currentLineIndex += linesToTake;
      motherIndex++;
    }

    // Final validation: ensure no text is lost
    const originalLineCount = allLines.length;
    const distributedLineCount = splitDetails.reduce((sum, detail) => sum + detail.lines, 0);

    if (originalLineCount !== distributedLineCount) {
      console.error(`❌ N-SPLIT: Line distribution error! Original: ${originalLineCount}, Distributed: ${distributedLineCount}`);
      console.error(`❌ N-SPLIT: Split details:`, splitDetails.map(d => ({ lines: d.lines, textLength: d.text.length })));
    } else {
      console.log(`✅ N-SPLIT: Perfect line distribution! ${originalLineCount} lines distributed across ${totalMothersNeeded} mothers`);
    }

    return {
      hasOverflow: true,
      textSplits,
      totalSplits: totalMothersNeeded,
      splitDetails
    };
  };

  // Legacy function for backward compatibility
  const detectOverflowAndSplit = () => {
    const nSplitResult = detectOverflowAndSplitN();
    return {
      hasOverflow: nSplitResult.hasOverflow,
      originalText: nSplitResult.textSplits[0] || '',
      overflowText: nSplitResult.textSplits.slice(1).join('\n\n') || '',
      overflowLines: nSplitResult.textSplits.slice(1)
    };
  };

  // Add new material composition row
  const addMaterialComposition = () => {
    if (canAddMore()) {
      const newId = Date.now().toString();
      setConfig(prev => ({
        ...prev,
        materialCompositions: [
          ...prev.materialCompositions,
          { id: newId, percentage: 0, material: '' }
        ]
      }));
    }
  };

  // Update material composition
  const updateMaterialComposition = (id: string, field: 'percentage' | 'material', value: number | string) => {
    setConfig(prev => ({
      ...prev,
      materialCompositions: prev.materialCompositions.map(comp =>
        comp.id === id
          ? { ...comp, [field]: field === 'percentage' ? Number(value) : value }
          : comp
      )
    }));
  };

  // Remove material composition
  const removeMaterialComposition = (id: string) => {
    if (config.materialCompositions.length > 1) {
      setConfig(prev => ({
        ...prev,
        materialCompositions: prev.materialCompositions.filter(comp => comp.id !== id)
      }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log(`🔧 ${DIALOG_VERSION}: NewCompTransDialog opened`);
      console.log(`🔧 ${DIALOG_VERSION}: Dialog version loaded with child mother removal fixes`);

      const initialConfig = getInitialConfig();
      setConfig(initialConfig);

      // 🔧 FIX: Text is now ALWAYS cleared in getInitialConfig()
      // So we ALWAYS start with isTextManuallyEdited = false
      // This allows auto-generation to work immediately
      console.log('✅ FIX: Text cleared on open - allowing auto-generation');
      setIsTextManuallyEdited(false);

      // Check for existing child mothers that need cleanup
      const currentAppData = (window as any).currentAppData;
      if (currentAppData && currentAppData.objects) {
        console.log('🔍 CLEANUP_CHECK: Checking for orphaned child mothers');

        // Extract parent mother ID from regionId
        let parentMotherId = 'Mother_1';
        if (currentAppData.objects) {
          const parentMother = currentAppData.objects.find((obj: any) =>
            obj.regions && obj.regions.some((region: any) => region.id === regionId)
          );
          if (parentMother) {
            parentMotherId = parentMother.name;
          }
        }

        // Check for existing child mothers
        const existingChildMothers = currentAppData.objects.filter((obj: any) =>
          obj.isOverflowChild && obj.parentMotherId === parentMotherId
        );

        if (existingChildMothers.length > 0) {
          console.warn(`⚠️ CLEANUP_CHECK: Found ${existingChildMothers.length} child mothers`);
          console.warn('⚠️ CLEANUP_CHECK: These will be removed when user clicks 2in1');
          console.warn('⚠️ CLEANUP_CHECK: Child mothers:', existingChildMothers.map((c: any) => c.name));
        }
      }

      // Debug: Check if callback is available (reduced logging)
      if (Math.random() < 0.1) { // Only log 10% of the time
        console.log('🔍 [v2.9.130] NewCompTransDialog opened with callback:', {
          hasOnCreateNewMother: !!onCreateNewMother,
          callbackType: typeof onCreateNewMother
        });
      }
    }
  }, [isOpen, editingContent]);

  // Overflow option sync removed - automatic handling enabled

  // Auto-generate text content when compositions or languages change
  useEffect(() => {
    // Auto-generate in two cases:
    // 1. User hasn't manually edited AND there's no existing text
    // 2. User has valid material compositions (even if they typed a value before)
    const hasExistingText = (config.textContent.originalText && config.textContent.originalText.trim().length > 0) ||
                           (config.textContent.generatedText && config.textContent.generatedText.trim().length > 0);

    // Check if we have valid material compositions to generate from
    const hasValidCompositions = config.materialCompositions.length > 0 &&
                                  config.materialCompositions.some(comp => comp.material && comp.percentage > 0);

    // Check if current text looks like a simple placeholder value (like "1", "100%", etc.)
    const currentText = config.textContent.generatedText || config.textContent.originalText || '';
    const isSimplePlaceholder = currentText.trim().length < 10 && /^[\d\s%]*$/.test(currentText.trim());

    // Auto-generate if:
    // - (Not manually edited AND no existing text) OR
    // - (Has valid compositions AND current text is just a placeholder)
    const shouldAutoGenerate = (!isTextManuallyEdited && !hasExistingText) ||
                                (hasValidCompositions && isSimplePlaceholder);

    if (shouldAutoGenerate) {
      const generatedText = generateTextContent();

      // Only update if we actually generated something
      if (generatedText && generatedText.trim().length > 0) {
        setConfig(prev => ({
          ...prev,
          textContent: {
            ...prev.textContent,
            generatedText,
            originalText: generatedText // Store as original when auto-generated
          }
        }));

        // Reset manual edit flag since we're auto-generating
        setIsTextManuallyEdited(false);

        // Debug: Log the current config when text is generated
        console.log('🔍 DEBUG: Auto-generated text:', {
          reason: shouldAutoGenerate ? (isSimplePlaceholder ? 'simple placeholder' : 'no existing text') : 'unknown',
          lineBreakSettings: config.lineBreakSettings,
          generatedText: generatedText.substring(0, 100) + '...'
        });
      }
    } else {
      if (hasExistingText) {
        const textToShow = config.textContent.originalText || config.textContent.generatedText;
        console.log('🔍 DEBUG: Preserving existing text content:', textToShow?.substring(0, 50) + '...');
      }
    }
  }, [config.materialCompositions, config.selectedLanguages, config.textContent.separator, isTextManuallyEdited, config.textContent.generatedText, config.textContent.originalText]);

  // Check for overflow whenever content or settings change
  useEffect(() => {
    const overflowResult = detectOverflowAndSplit();
    setHasOverflow(overflowResult.hasOverflow);
  }, [config, regionWidth, regionHeight]);

  // Automatic recursive overflow handling function
  const handleAutomaticOverflowSplitting = async (
    textToProcess: string,
    originalMotherConfig: any,
    sourceMotherName: string = 'Mother_3',
    recursionDepth: number = 0
  ): Promise<void> => {
    console.log(`🔄 Starting automatic overflow splitting (depth: ${recursionDepth})`);
    console.log(`📝 Text to process: "${textToProcess.substring(0, 50)}..."`);

    // Prevent infinite recursion
    if (recursionDepth > 10) {
      console.error('❌ Maximum recursion depth reached, stopping overflow splitting');
      return;
    }

    // Get current app data
    const currentData = (window as any).currentAppData;
    if (!currentData) {
      console.error('❌ No app data available for overflow splitting');
      return;
    }

    // Find the source mother to duplicate
    const sourceMother = currentData.objects.find((obj: any) =>
      obj.name === sourceMotherName || obj.name?.includes(sourceMotherName)
    );

    if (!sourceMother) {
      console.error(`❌ Source mother ${sourceMotherName} not found`);
      return;
    }

    // Calculate next mother number
    const motherNumbers = currentData.objects
      .filter((obj: any) => obj.name?.includes('Mother_'))
      .map((obj: any) => {
        const match = obj.name.match(/Mother_(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    const newMotherNumber = Math.max(...motherNumbers, 0) + 1;

    // Calculate position for new mother using EXACT same logic as "Add Master Layout" button
    const spacing = 20; // Consistent spacing between mothers (same as duplicateMother function)
    let newX = sourceMother.x;
    let newY = sourceMother.y;

    // Find the rightmost position of ALL existing mothers (same as duplicateMother function)
    let maxRightX = 0;
    const motherObjects = currentData.objects.filter((obj: any) => obj.type?.includes('mother'));
    motherObjects.forEach((mother: any) => {
      const rightEdge = mother.x + mother.width;
      if (rightEdge > maxRightX) {
        maxRightX = rightEdge;
      }
    });

    // Position new mother to the right of all existing mothers (same as duplicateMother function)
    newX = maxRightX + spacing;
    newY = sourceMother.y; // Same Y level as original mother

    console.log(`📍 Positioning Mother_${newMotherNumber} at (${newX}, ${newY}) using Add Master Layout logic`);
    console.log(`📏 Spacing from rightmost mother: ${spacing}mm`);

    // Create new mother with inherited properties from ORIGINAL mother config
    const newMother = {
      ...sourceMother,
      name: `Mother_${newMotherNumber}`,
      type: 'mother',
      typename: 'mother',
      x: newX, // Use calculated position to avoid overlaps
      y: newY, // Same Y level
      width: sourceMother.width,
      height: sourceMother.height,
      // 🔗 PARENT-CHILD RELATIONSHIP: Establish relationship tracking
      parentMotherId: sourceMotherName, // Track which mother this child belongs to
      isOverflowChild: true, // Mark as overflow-generated child mother
      childMotherIds: [], // Initialize empty array for potential grandchildren
      // Copy all the additional properties from original mother
      margins: (sourceMother as any).margins,
      sewingPosition: (sourceMother as any).sewingPosition,
      sewingOffset: (sourceMother as any).sewingOffset,
      midFoldLine: (sourceMother as any).midFoldLine,
      regions: (sourceMother as any).regions?.map((region: any) => {
        const newRegion = {
          ...region,
          id: `${region.id}_copy_${newMotherNumber}`, // Use same pattern as duplicateMother
          name: region.name?.replace(/Mother_\d+/, `Mother_${newMotherNumber}`)
        };

        // Check if this is the composition region
        const isCompositionRegion = region.name?.includes('R1') ||
                                  region.name?.includes('region_1') ||
                                  region.name?.toLowerCase().includes('composition') ||
                                  region.name?.toLowerCase().includes('unnamed') ||
                                  true; // Assume any region can be composition region

        if (isCompositionRegion) {
          // Create content with text to process and ORIGINAL mother config
          const overflowContent = {
            id: `content_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            type: 'new-comp-trans',
            regionId: newRegion.id,
            layout: {
              occupyLeftoverSpace: true,
              fullWidth: true,
              fullHeight: true,
              width: { value: 100, unit: '%' as const },
              height: { value: 100, unit: '%' as const },
              horizontalAlign: originalMotherConfig.alignment?.horizontal || 'center',
              verticalAlign: originalMotherConfig.alignment?.vertical || 'center',
              x: 0,
              y: 0,
              padding: {
                top: originalMotherConfig.padding?.top || 2,
                right: originalMotherConfig.padding?.right || 2,
                bottom: originalMotherConfig.padding?.bottom || 2,
                left: originalMotherConfig.padding?.left || 2
              }
            },
            newCompTransConfig: {
              // Inherit ALL properties from ORIGINAL mother config (not immediate parent)
              alignment: originalMotherConfig.alignment,
              padding: originalMotherConfig.padding,
              typography: originalMotherConfig.typography,
              selectedLanguages: originalMotherConfig.selectedLanguages,
              materialCompositions: originalMotherConfig.materialCompositions,
              textContent: {
                separator: originalMotherConfig.textContent?.separator || ' - ',
                generatedText: textToProcess
              },
              lineBreakSettings: originalMotherConfig.lineBreakSettings,
              isPreWrapped: true // Mark as pre-wrapped to prevent re-wrapping
              // overflowOption removed - automatic handling
            }
          };

          newRegion.contents = [overflowContent];
          console.log(`✅ Added overflow content to region: ${newRegion.id}`);
        }

        return newRegion;
      }) || []
    };

    // 🔗 UPDATE PARENT: Add this child to the parent's child list
    const parentMother = currentData.objects.find((obj: any) => obj.name === sourceMotherName);
    if (parentMother) {
      // Initialize childMotherIds array if it doesn't exist
      if (!(parentMother as any).childMotherIds) {
        (parentMother as any).childMotherIds = [];
      }
      // Add the new child mother to the parent's list
      (parentMother as any).childMotherIds.push(`Mother_${newMotherNumber}`);
      console.log(`🔗 Updated parent ${sourceMotherName} to track child Mother_${newMotherNumber}`);
      console.log(`👨‍👩‍👧‍👦 Parent ${sourceMotherName} now has children:`, (parentMother as any).childMotherIds);
    }

    // Add new mother to objects
    const updatedObjects = [...currentData.objects, newMother];

    // Update app data
    if ((window as any).updateAppData) {
      const newData = {
        ...currentData,
        objects: updatedObjects,
        totalObjects: updatedObjects.length
      };
      (window as any).updateAppData(newData);
    }

    // Update region contents for canvas rendering
    if ((window as any).updateRegionContents && newMother.regions) {
      newMother.regions.forEach((region: any) => {
        if (region.contents && region.contents.length > 0) {
          (window as any).updateRegionContents(region.id, region.contents);
        }
      });
    }

    console.log(`✅ Created Mother_${newMotherNumber} with overflow text (depth: ${recursionDepth})`);

    // Check if the newly created mother also has overflow
    // We need to simulate the overflow detection for the new mother
    const newMotherOverflowResult = await checkMotherForOverflow(newMother, textToProcess, originalMotherConfig);

    if (newMotherOverflowResult.hasOverflow) {
      console.log(`⚠️ New Mother_${newMotherNumber} also has overflow, continuing recursion...`);

      // Update the current mother to keep only the fitted text
      await updateMotherWithFittedText(newMother, newMotherOverflowResult.originalText, originalMotherConfig);

      // Recursively handle the overflow text
      await handleAutomaticOverflowSplitting(
        newMotherOverflowResult.overflowText,
        originalMotherConfig,
        `Mother_${newMotherNumber}`,
        recursionDepth + 1
      );
    }
  };

  // Helper function to check if a mother has overflow
  const checkMotherForOverflow = async (
    mother: any,
    textContent: string,
    originalConfig: any
  ): Promise<{ hasOverflow: boolean; originalText: string; overflowText: string }> => {
    // Use the same overflow detection logic as the main function
    if (!regionWidth || !regionHeight) {
      return { hasOverflow: false, originalText: textContent, overflowText: '' };
    }

    // Calculate available space in pixels
    const regionWidthPx = regionWidth * 3.779527559;
    const regionHeightPx = regionHeight * 3.779527559;
    const paddingLeftPx = originalConfig.padding.left * 3.779527559;
    const paddingRightPx = originalConfig.padding.right * 3.779527559;
    const paddingTopPx = originalConfig.padding.top * 3.779527559;
    const paddingBottomPx = originalConfig.padding.bottom * 3.779527559;

    const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
    const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

    // Convert font size to pixels
    let fontSizePx = originalConfig.typography.fontSize;
    if (originalConfig.typography.fontSizeUnit === 'mm') {
      fontSizePx = originalConfig.typography.fontSize * 3.779527559;
    } else if (originalConfig.typography.fontSizeUnit === 'pt') {
      fontSizePx = (originalConfig.typography.fontSize * 4/3);
    }

    // Text width estimation using canvas measurement
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2;

      context.font = `${fontSizePx}px ${originalConfig.typography.fontFamily}`;
      const textWidthPx = context.measureText(text).width;
      return textWidthPx / 3.779527559;
    };

    const availableWidthMm = availableWidthPx / 3.779527559;
    const fontSizeMm = fontSizePx / 3.779527559;

    // CRITICAL: Apply safety buffer exactly like Text Overflow Analysis Settings
    // From Settings.tsx: userSafetyBuffer = 1.5mm
    const userSafetyBuffer = 1.5;
    const effectiveAvailableWidth = availableWidthMm - userSafetyBuffer;

    // Word wrapping logic
    const wrapTextToLines = (text: string): string[] => {
      const manualLines = text.split(originalConfig.lineBreakSettings.lineBreakSymbol);
      const wrappedLines: string[] = [];

      manualLines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          wrappedLines.push('');
          return;
        }

        const lineWidth = estimateTextWidth(trimmedLine);
        if (lineWidth <= availableWidthMm) {
          wrappedLines.push(trimmedLine);
          return;
        }

        // Line exceeds boundaries - break to respect limits
        const words = trimmedLine.split(' ');
        let currentLine = '';

        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = estimateTextWidth(testLine);

          // CRITICAL: Use effectiveAvailableWidth with safety buffer (like Text Overflow Analysis Settings)
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

    const lines = wrapTextToLines(textContent);

    // Check for height overflow
    const lineHeightMm = fontSizeMm * originalConfig.lineBreakSettings.lineSpacing;
    const totalTextHeightMm = lines.length * lineHeightMm;
    const availableHeightMm = availableHeightPx / 3.779527559;
    const hasOverflow = totalTextHeightMm > availableHeightMm;

    if (hasOverflow) {
      const maxVisibleLines = Math.floor(availableHeightMm / lineHeightMm);
      const originalLines = lines.slice(0, maxVisibleLines);
      const overflowLines = lines.slice(maxVisibleLines);

      return {
        hasOverflow: true,
        originalText: originalLines.join(originalConfig.lineBreakSettings.lineBreakSymbol),
        overflowText: overflowLines.join(originalConfig.lineBreakSettings.lineBreakSymbol)
      };
    }

    return {
      hasOverflow: false,
      originalText: textContent,
      overflowText: ''
    };
  };

  // Helper function to update a mother with fitted text
  const updateMotherWithFittedText = async (
    mother: any,
    fittedText: string,
    originalConfig: any
  ): Promise<void> => {
    // Update the mother's region content with fitted text
    if (mother.regions && mother.regions.length > 0) {
      mother.regions.forEach((region: any) => {
        if (region.contents && region.contents.length > 0) {
          region.contents.forEach((content: any) => {
            if (content.type === 'new-comp-trans' && content.newCompTransConfig) {
              // Preserve the original text if it exists, or store current generatedText as original
              if (!content.newCompTransConfig.textContent.originalText) {
                content.newCompTransConfig.textContent.originalText = content.newCompTransConfig.textContent.generatedText;
              }
              // Update generatedText with fitted text for canvas rendering
              content.newCompTransConfig.textContent.generatedText = fittedText;
              console.log(`✅ Updated ${mother.name} with fitted text: "${fittedText.substring(0, 50)}..."`);
            }
          });
        }
      });

      // Update region contents for canvas rendering
      if ((window as any).updateRegionContents) {
        mother.regions.forEach((region: any) => {
          if (region.contents && region.contents.length > 0) {
            (window as any).updateRegionContents(region.id, region.contents);
          }
        });
      }
    }
  };

  const handleStepDebug = async () => {
    console.log(`🔧 [DEBUG] Step ${debugStep + 1} starting...`);

    if (debugStep === 0) {
      // Step 0: Calculate SPLIT 1 and SPLIT 2 (no visual change)
      const overflowResult = detectOverflowAndSplit();
      setSplit1Text(overflowResult.originalText);
      setSplit2Text(overflowResult.overflowText);
      console.log(`🔧 [DEBUG] Step 1 - Calculated splits:`);
      console.log(`📝 SPLIT 1 (${overflowResult.originalText.length} chars):`, overflowResult.originalText.substring(0, 50) + '...');
      console.log(`📝 SPLIT 2 (${overflowResult.overflowText.length} chars):`, overflowResult.overflowText.substring(0, 50) + '...');
      setDebugStep(1);

    } else if (debugStep === 1) {
      // Step 1: Fill SPLIT 1 in original (parent) mother
      console.log(`🔧 [DEBUG] Step 2 - Filling SPLIT 1 in parent mother:`, split1Text.substring(0, 50) + '...');

      // Update local config to show SPLIT 1 text
      const debugConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: split1Text
        }
      };

      setConfig(debugConfig);

      // Set debug mode flag and save (parent should handle keeping dialog open)
      (window as any).debugModeActive = true;
      onSave(debugConfig);

      // Dialog might close - if so, user needs to reopen and continue
      console.log('🔧 [DEBUG] Step 2 completed - Check if Mother_1 shows SPLIT 1 text');
      console.log('🔧 [DEBUG] If dialog closed, double-click Mother_1 again to continue with Step 3');

      setDebugStep(2);

    } else if (debugStep === 2) {
      // Step 2: Duplicate parent mother (including split text on it)
      console.log(`🔧 [DEBUG] Step 3 - Duplicating parent mother with current text`);
      if (onCreateNewMother) {
        onCreateNewMother(split1Text, split2Text);
      }
      setDebugStep(3);

    } else if (debugStep === 3) {
      // Step 3: Replace child mother text with SPLIT 2
      console.log(`🔧 [DEBUG] Step 4 - Child mother should now have SPLIT 2:`, split2Text.substring(0, 50) + '...');
      console.log(`🔧 [DEBUG] All steps completed!`);
      setDebugStep(4); // Mark as completed, don't reset yet
    }
  };

  // NEW: Create - Execute all 4 manual steps + Save in one click
  const handleCreate = async () => {
    try {
      console.log('🚀 CREATE: Starting all 4 manual steps + Save...');

      // STEP 1: Calculate SPLIT 1 and SPLIT 2 (EXACT COPY from debugStep === 0)
      console.log(`🔧 [DEBUG] Step 1 starting...`);
      const overflowResult = detectOverflowAndSplit();
      setSplit1Text(overflowResult.originalText);
      setSplit2Text(overflowResult.overflowText);
      console.log(`🔧 [DEBUG] Step 1 - Calculated splits:`);
      console.log(`📝 SPLIT 1 (${overflowResult.originalText.length} chars):`, overflowResult.originalText.substring(0, 50) + '...');
      console.log(`📝 SPLIT 2 (${overflowResult.overflowText.length} chars):`, overflowResult.overflowText.substring(0, 50) + '...');
      setDebugStep(1);

      // STEP 2: Fill SPLIT 1 in original (parent) mother (EXACT COPY from debugStep === 1)
      console.log(`🔧 [DEBUG] Step 2 starting...`);
      console.log(`🔧 [DEBUG] Step 2 - Filling SPLIT 1 in parent mother:`, overflowResult.originalText.substring(0, 50) + '...');

      // Update local config to show SPLIT 1 text
      const debugConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: overflowResult.originalText
        }
      };

      setConfig(debugConfig);

      // STEP 3: Duplicate parent mother ONLY if there's overflow
      if (overflowResult.hasOverflow) {
        console.log(`🔧 [DEBUG] Step 3 starting - Has overflow, creating child mother...`);
        console.log(`🔧 [DEBUG] Step 3 - Duplicating parent mother with current text`);
        if (onCreateNewMother) {
          onCreateNewMother(overflowResult.originalText, overflowResult.overflowText);
        }
        setDebugStep(3);

        // STEP 4: Replace child mother text with SPLIT 2 (EXACT COPY from debugStep === 3)
        console.log(`🔧 [DEBUG] Step 4 starting...`);
        console.log(`🔧 [DEBUG] Step 4 - Child mother should now have SPLIT 2:`, overflowResult.overflowText.substring(0, 50) + '...');
        console.log(`🔧 [DEBUG] All steps completed!`);
        setDebugStep(4); // Mark as completed, don't reset yet
      } else {
        console.log(`🔧 [DEBUG] Step 3 skipped - No overflow detected, only parent mother needed`);
        console.log(`🔧 [DEBUG] All steps completed - Single mother solution!`);
        setDebugStep(4); // Mark as completed
      }

      // FINAL STEP: Execute Save functionality (EXACT COPY from handleSave)
      console.log('🚀 CREATE: Now executing Save functionality...');

      if (overflowResult.hasOverflow) {
        // 🌊 AUTOMATIC OVERFLOW HANDLING - Use the proper callback
        console.log('🔄 Automatic overflow detected - creating new mother...');
        console.log('📊 Overflow details:', {
          originalTextLength: overflowResult.originalText.length,
          overflowTextLength: overflowResult.overflowText.length,
          hasOverflowLines: overflowResult.overflowLines?.length || 0
        });

        // Save SPLIT 1 text to the current region (overflowResult.originalText already contains the correct SPLIT 1)
        const split1Text = overflowResult.originalText; // This already contains SPLIT 1 from detectOverflowAndSplit()
        console.log('📝 Saving SPLIT 1 text to parent region:', { split1Length: split1Text.length, overflowLength: overflowResult.overflowText.length });

        // Save the current config with SPLIT 1 text
        onSave(debugConfig);
      } else {
        // No overflow - just save normally
        onSave(debugConfig);
      }

      console.log('🎉 CREATE: All steps + Save completed successfully!');

    } catch (error) {
      console.error('❌ CREATE: Error during execution:', error);
    }
  };

  // NEW: Button "12" - Combine Step 1 & Step 2
  const handle12 = async () => {
    try {
      console.log('🚀 12: Starting Step 1 & 2...');

      // STEP 1: Calculate Splits
      console.log('🔧 12 - Step 1: Calculate Splits');
      const overflowResult = detectOverflowAndSplit();
      setSplit1Text(overflowResult.originalText);
      setSplit2Text(overflowResult.overflowText);
      console.log(`📝 SPLIT 1 (${overflowResult.originalText.length} chars):`, overflowResult.originalText.substring(0, 50) + '...');
      console.log(`📝 SPLIT 2 (${overflowResult.overflowText.length} chars):`, overflowResult.overflowText.substring(0, 50) + '...');
      setDebugStep(1);

      // STEP 2: Fill Parent (SPLIT 1)
      console.log('🔧 12 - Step 2: Fill Parent (SPLIT 1)');
      const debugConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: overflowResult.originalText
        }
      };
      setConfig(debugConfig);
      (window as any).debugModeActive = true;
      onSave(debugConfig);
      setDebugStep(2);

      console.log('🎉 12: Step 1 & 2 completed successfully!');

    } catch (error) {
      console.error('❌ 12: Error during execution:', error);
    }
  };

  // NEW: Button "34" - Combine Step 3 & Step 4 (EXACT COPY of manual steps)
  const handle34 = async () => {
    try {
      console.log('🚀 34: Starting Step 3 & 4...');

      // Check if we have split texts from previous steps
      if (!split1Text || !split2Text) {
        console.error('❌ 34: No split texts available. Please run Step 1 & 2 first.');
        return;
      }

      // STEP 3: EXACT COPY from debugStep === 2
      console.log(`🔧 [DEBUG] Step 3 - Duplicating parent mother with current text`);
      if (onCreateNewMother) {
        onCreateNewMother(split1Text, split2Text);
      }
      setDebugStep(3);

      // STEP 4: EXACT COPY from debugStep === 3
      console.log(`🔧 [DEBUG] Step 4 - Child mother should now have SPLIT 2:`, split2Text.substring(0, 50) + '...');
      console.log(`🔧 [DEBUG] All steps completed!`);
      setDebugStep(4); // Mark as completed, don't reset yet

      console.log('🎉 34: Step 3 & 4 completed successfully!');

    } catch (error) {
      console.error('❌ 34: Error during execution:', error);
    }
  };

  // NEW: Button "3-1" - Create Child Mother Structure Only
  const handle31 = async (providedSplit1?: string, providedSplit2?: string) => {
    try {
      console.log('🚀 3-1: Creating child mother structure...');

      // Use provided split texts if available, otherwise fall back to state variables
      const useSplit1Text = providedSplit1 || split1Text;
      const useSplit2Text = providedSplit2 || split2Text;

      // Check if we have split texts from previous steps
      if (!useSplit1Text || !useSplit2Text) {
        console.error('❌ 3-1: No split texts available. Please run Step 1 & 2 first.');
        return;
      }

      console.log('🔧 3-1: Creating child mother structure (configuration, size, width, padding, font family, font size, line spacing) with empty region 1');
      
      // Find the correct parent mother by searching which mother contains this regionId
      const globalData = (window as any).currentAppData;
      let parentMotherId = 'Mother_1'; // Default fallback
      if (globalData && globalData.objects) {
        console.log(`🔍 3-1: Searching ${globalData.objects.length} objects for region ${regionId}...`);
        for (const obj of globalData.objects) {
          if (obj.type?.includes('mother') && obj.regions) {
            for (const region of obj.regions) {
              if (region.id === regionId) {
                parentMotherId = obj.name;
                console.log(`✅ 3-1: Found region ${regionId} in mother: ${parentMotherId}`);
                break;
              }
            }
            if (parentMotherId !== 'Mother_1') break; // Found it, stop searching
          }
        }
      }
      console.log(`🔍 3-1: Using parent mother: ${parentMotherId}`);
      
      // Step 3-1: Create child mother structure only
      if (createChildMother) {
        const childMotherId = createChildMother(parentMotherId); // Use correct parent!
        if (childMotherId) {
          console.log(`✅ 3-1: Child mother structure created: ${childMotherId}`);
          // Store the child ID for later steps
          (window as any).lastCreatedChildId = childMotherId;
        } else {
          console.error('❌ 3-1: Failed to create child mother structure');
          return;
        }
      } else {
        console.error('❌ 3-1: createChildMother function not available');
        return;
      }

      console.log('🎉 3-1: Child mother structure creation completed!');

    } catch (error) {
      console.error('❌ 3-1: Error during execution:', error);
    }
  };

  // NEW: Button "3-2" - Place New CT Comp Trans in Child Mother
  const handle32 = async () => {
    try {
      console.log('🚀 3-2: Placing new CT comp trans in child mother...');

      // Get the child mother ID from previous step
      const childMotherId = (window as any).lastCreatedChildId;
      if (!childMotherId) {
        console.error('❌ 3-2: No child mother ID found. Please run step 3-1 first.');
        return;
      }

      console.log('🔧 3-2: Adding CT comp trans to child mother:', childMotherId);
      
      // Step 3-2: Add CT comp trans to child mother with empty content
      if (onCreateNewMother) {
        onCreateNewMother(childMotherId, ''); // Empty content for now
        console.log('✅ 3-2: CT comp trans added to child mother (empty content)');
      } else {
        console.error('❌ 3-2: onCreateNewMother function not available');
        return;
      }

      console.log('🎉 3-2: CT comp trans placement completed!');

    } catch (error) {
      console.error('❌ 3-2: Error during execution:', error);
    }
  };

  // NEW: Button "3-3" - Load SPLIT 2 into Child Mother CT Comp Trans
  const handle33 = async (providedSplit1?: string, providedSplit2?: string) => {
    try {
      console.log('🚀 3-3: Loading SPLIT 2 into child mother CT comp trans...');

      // Use provided split texts if available, otherwise fall back to state variables
      const useSplit1Text = providedSplit1 || split1Text;
      const useSplit2Text = providedSplit2 || split2Text;

      // Check if we have split texts
      if (!useSplit1Text || !useSplit2Text) {
        console.error('❌ 3-3: No split texts available.');
        return;
      }

      // Get the child mother ID from previous step
      const childMotherId = (window as any).lastCreatedChildId;
      if (!childMotherId) {
        console.error('❌ 3-3: No child mother ID found. Please run steps 3-1 and 3-2 first.');
        return;
      }

      console.log(`📝 3-3: SPLIT 2 to load (${useSplit2Text.length} chars):`, useSplit2Text.substring(0, 50) + '...');
      console.log('🔧 3-3: Loading SPLIT 2 into child mother:', childMotherId);

      // Step 3-3: Load SPLIT 2 into the child mother's CT comp trans
      if (onCreateNewMother) {
        onCreateNewMother(childMotherId, useSplit2Text); // Load actual SPLIT 2 content
        console.log('✅ 3-3: SPLIT 2 loaded into child mother CT comp trans!');
      } else {
        console.error('❌ 3-3: onCreateNewMother function not available');
        return;
      }

      setDebugStep(4);
      console.log('🎉 3-3: SPLIT 2 loading completed!');

    } catch (error) {
      console.error('❌ 3-3: Error during execution:', error);
    }
  };

  // Helper function to wait for app data updates
  const waitForAppDataUpdate = (timeoutMs: number = 2000): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = timeoutMs / 100;
      
      const checkInterval = setInterval(() => {
        attempts++;
        const currentData = (window as any).currentAppData;
        
        if (currentData && currentData.objects) {
          console.log(`🔍 App data check ${attempts}: Found ${currentData.objects.length} objects`);
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          console.log(`⏰ App data check timeout after ${attempts} attempts`);
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  };

  // Helper function to verify child mother exists
  const verifyChildMotherExists = (childMotherId: string): boolean => {
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ No app data available for verification');
      return false;
    }
    
    const childMother = currentData.objects.find((obj: any) => obj.name === childMotherId);
    const exists = !!childMother;
    console.log(`🔍 Child mother ${childMotherId} verification: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    return exists;
  };

  // Helper function to verify child mother has CT content
  const verifyChildMotherHasContent = (childMotherId: string): boolean => {
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ No app data available for content verification');
      return false;
    }
    
    const childMother = currentData.objects.find((obj: any) => obj.name === childMotherId);
    if (!childMother) {
      console.log(`❌ Child mother ${childMotherId} not found for content verification`);
      return false;
    }
    
    // Debug: Log the actual structure
    console.log(`🔍 Child mother ${childMotherId} structure:`, {
      hasRegions: !!childMother.regions,
      regionsLength: childMother.regions?.length || 0,
      firstRegion: childMother.regions?.[0] || null,
      firstRegionContents: childMother.regions?.[0]?.contents || null
    });
    
    const hasRegions = childMother.regions && childMother.regions.length > 0;
    const hasContents = hasRegions && 
                       childMother.regions[0].contents && 
                       childMother.regions[0].contents.length > 0;
    
    // For step 3-2, we just need the structure to exist (even with empty content)
    // The actual content will be added in step 3-3
    const hasStructure = hasRegions; // Just check if regions exist
    
    console.log(`🔍 Child mother ${childMotherId} verification:`, {
      hasRegions,
      hasContents,
      hasStructure,
      result: hasStructure ? 'STRUCTURE EXISTS' : 'NO STRUCTURE'
    });
    
    return hasStructure;
  };

  // Helper function to find child mother in app data
  const findChildMotherInAppData = (childMotherId: string): any => {
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ No app data available to find child mother');
      return null;
    }
    
    const childMother = currentData.objects.find((obj: any) => obj.name === childMotherId);
    console.log(`🔍 Finding child mother ${childMotherId}:`, childMother ? 'FOUND' : 'NOT FOUND');
    return childMother;
  };

  // Helper function to manually add CT comp trans to child mother
  const addCTCompTransToChildMother = (childMotherId: string, textContent: string): boolean => {
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ No app data available to add CT comp trans');
      return false;
    }
    
    const childMother = currentData.objects.find((obj: any) => obj.name === childMotherId);
    if (!childMother) {
      console.log(`❌ Child mother ${childMotherId} not found for CT comp trans addition`);
      return false;
    }
    
    // Ensure child mother has regions
    if (!childMother.regions || childMother.regions.length === 0) {
      console.log(`❌ Child mother ${childMotherId} has no regions`);
      return false;
    }
    
    // Get the first region (usually region 1)
    const targetRegion = childMother.regions[0];
    if (!targetRegion) {
      console.log(`❌ Child mother ${childMotherId} has no target region`);
      return false;
    }
    
    // Create new CT comp trans content
    const newContent = {
      id: `content_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: 'new-comp-trans',
      regionId: targetRegion.id,
      layout: {
        occupyLeftoverSpace: true,
        fullWidth: true,
        fullHeight: true,
        width: { value: 100, unit: '%' as const },
        height: { value: 100, unit: '%' as const },
        horizontalAlign: config.alignment?.horizontal || 'center',
        verticalAlign: config.alignment?.vertical || 'center',
        x: 0,
        y: 0,
        padding: {
          top: config.padding?.top || 2,
          right: config.padding?.right || 2,
          bottom: config.padding?.bottom || 2,
          left: config.padding?.left || 2
        }
      },
      newCompTransConfig: {
        alignment: config.alignment,
        padding: config.padding,
        typography: config.typography,
        selectedLanguages: config.selectedLanguages,
        materialCompositions: config.materialCompositions,
        textContent: {
          separator: config.textContent?.separator || ' - ',
          generatedText: textContent
        },
        lineBreakSettings: config.lineBreakSettings,
        isPreWrapped: true
      }
    };
    
    // Add content to region
    if (!targetRegion.contents) {
      targetRegion.contents = [];
    }
    targetRegion.contents.push(newContent);
    
    // Update app data and force canvas refresh
    const updateAppData = (window as any).updateAppData;
    if (updateAppData) {
      updateAppData(currentData);
      console.log(`✅ CT comp trans added to child mother ${childMotherId} manually`);
      
      // Force canvas refresh to show the new content
      setTimeout(() => {
        const refreshCanvas = (window as any).refreshCanvas;
        if (refreshCanvas) {
          refreshCanvas();
          console.log('🎨 Canvas refreshed after adding content');
        }
      }, 100);
      
      return true;
    } else {
      console.log('❌ updateAppData function not available');
      return false;
    }
  };

  // Helper function to wait for specific condition with polling
  const waitForCondition = async (
    conditionFn: () => boolean, 
    timeoutMs: number = 5000, 
    pollIntervalMs: number = 200,
    description: string = 'condition'
  ): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (conditionFn()) {
        console.log(`✅ ${description} satisfied`);
        return true;
      }
      console.log(`🔍 Waiting for ${description}... (${Date.now() - startTime}ms)`);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    console.error(`❌ Timeout waiting for ${description} after ${timeoutMs}ms`);
    return false;
  };

  // Helper function to verify 3-1 completion (child mother exists and has regions)
  const verify31Completion = (): boolean => {
    const childMotherId = (window as any).lastCreatedChildId;
    if (!childMotherId) {
      console.log('❌ 3-1 verification: No child mother ID stored');
      return false;
    }
    
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ 3-1 verification: No app data available');
      return false;
    }
    
    const childMother = currentData.objects.find((obj: any) => obj.name === childMotherId);
    if (!childMother) {
      console.log(`❌ 3-1 verification: Child mother ${childMotherId} not found`);
      return false;
    }
    
    const hasRegions = childMother.regions && childMother.regions.length > 0;
    console.log(`🔍 3-1 verification: Child mother ${childMotherId} has regions: ${hasRegions}`);
    return hasRegions;
  };

  // Helper function to verify 3-2 completion (child mother has CT content structure)
  const verify32Completion = (): boolean => {
    const childMotherId = (window as any).lastCreatedChildId;
    if (!childMotherId) {
      console.log('❌ 3-2 verification: No child mother ID stored');
      return false;
    }
    
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ 3-2 verification: No app data available');
      return false;
    }
    
    const childMother = currentData.objects.find((obj: any) => obj.name === childMotherId);
    if (!childMother || !childMother.regions || childMother.regions.length === 0) {
      console.log(`❌ 3-2 verification: Child mother ${childMotherId} has no regions`);
      return false;
    }
    
    const firstRegion = childMother.regions[0];
    const hasContents = firstRegion.contents && firstRegion.contents.length > 0;
    console.log(`🔍 3-2 verification: Child mother ${childMotherId} region has contents: ${hasContents}`);
    return hasContents;
  };

  // Helper function to verify 3-3 completion (child mother has CT content with SPLIT 2 text)
  const verify33Completion = (): boolean => {
    const childMotherId = (window as any).lastCreatedChildId;
    if (!childMotherId) {
      console.log('❌ 3-3 verification: No child mother ID stored');
      return false;
    }
    
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.log('❌ 3-3 verification: No app data available');
      return false;
    }
    
    const childMother = currentData.objects.find((obj: any) => obj.name === childMotherId);
    if (!childMother || !childMother.regions || childMother.regions.length === 0) {
      console.log(`❌ 3-3 verification: Child mother ${childMotherId} has no regions`);
      return false;
    }
    
    const firstRegion = childMother.regions[0];
    if (!firstRegion.contents || firstRegion.contents.length === 0) {
      console.log(`❌ 3-3 verification: Child mother ${childMotherId} region has no contents`);
      return false;
    }
    
    const ctContent = firstRegion.contents.find((content: any) => content.type === 'new-comp-trans');
    if (!ctContent) {
      console.log(`❌ 3-3 verification: Child mother ${childMotherId} has no CT content`);
      return false;
    }
    
    const hasText = ctContent.newCompTransConfig?.textContent?.generatedText;
    const textMatches = hasText && hasText.includes(split2Text.substring(0, 20)); // Check first 20 chars of SPLIT 2
    console.log(`🔍 3-3 verification: Child mother ${childMotherId} CT content has SPLIT 2 text: ${textMatches}`);
    return !!textMatches;
  };

  // Helper function to get Mother_1 complete configuration
  const getMother1Configuration = () => {
    console.log('🔍 Getting Mother_1 complete configuration...');
    
    // Get from global data where Mother_1 actually exists
    const currentData = (window as any).currentAppData;
    if (!currentData || !currentData.objects) {
      console.error('❌ No global app data available');
      return null;
    }
    
    // Find Mother_1
    let mother1 = null;
    for (const obj of currentData.objects) {
      if (obj.type?.includes('mother') && obj.name === 'Mother_1') {
        mother1 = obj;
        break;
      }
    }
    
    if (!mother1) {
      console.error('❌ Mother_1 not found in global data');
      return null;
    }
    
    console.log('✅ Mother_1 found! Complete configuration:');
    console.log('📐 Size & Position:', {
      width: mother1.width,
      height: mother1.height,
      x: mother1.x,
      y: mother1.y
    });
    
    console.log('📝 Typography:', {
      fontFamily: mother1.fontFamily,
      fontSize: mother1.fontSize,
      fontWeight: mother1.fontWeight,
      lineHeight: mother1.lineHeight,
      letterSpacing: mother1.letterSpacing
    });
    
    console.log('📦 Padding & Margins:', {
      padding: mother1.padding,
      paddingTop: mother1.paddingTop,
      paddingRight: mother1.paddingRight,
      paddingBottom: mother1.paddingBottom,
      paddingLeft: mother1.paddingLeft,
      margin: mother1.margin
    });
    
    console.log('🎨 Visual Properties:', {
      backgroundColor: mother1.backgroundColor,
      borderColor: mother1.borderColor,
      borderWidth: mother1.borderWidth,
      borderRadius: mother1.borderRadius,
      opacity: mother1.opacity
    });
    
    console.log('📋 Regions:', {
      regionCount: mother1.regions?.length || 0,
      regions: mother1.regions?.map((r: any) => ({
        id: r.id,
        width: r.width,
        height: r.height,
        x: r.x,
        y: r.y
      })) || []
    });
    
    console.log('🔧 Full Mother_1 Object:', mother1);
    
    return mother1;
  };

  // Helper function to find where Mother_1A actually exists
  const verifyChildMotherInAppData = async (childMotherId: string, timeoutMs: number = 5000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      console.log(`🔍 3v2: Searching ALL possible data sources for ${childMotherId}...`);
      
      // Check all possible global data sources
      const dataSources = [
        { name: 'window.data', data: (window as any).data },
        { name: 'window.webCreationData', data: (window as any).webCreationData },
        { name: 'window.currentAppData', data: (window as any).currentAppData },
        { name: 'window.appData', data: (window as any).appData },
        { name: 'window.projectData', data: (window as any).projectData }
      ];
      
      for (const source of dataSources) {
        if (source.data && source.data.objects) {
          console.log(`🔍 3v2: Checking ${source.name} - ${source.data.objects.length} objects`);
          for (const obj of source.data.objects) {
            if (obj.type?.includes('mother') && obj.name === childMotherId) {
              console.log(`✅ 3v2: FOUND ${childMotherId} in ${source.name}!`);
              console.log(`🔍 3v2: Object details:`, {
                name: obj.name,
                type: obj.type,
                hasRegions: !!(obj as any).regions,
                regionCount: (obj as any).regions?.length || 0
              });
              return true;
            }
          }
        } else {
          console.log(`🔍 3v2: ${source.name} - no data or objects`);
        }
      }
      
      console.log(`🔍 3v2: ${childMotherId} not found in any data source, waiting... (${Date.now() - startTime}ms)`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.error(`❌ 3v2: Timeout - ${childMotherId} not found in ANY data source after ${timeoutMs}ms`);
    return false;
  };

  // NEW: Button "4/4" - Same as "1/2" (handle12) plus duplicate mother_1 to create mother_1A
  const handle44 = async () => {
    try {
      console.log('🚀 4/4: Starting Step 1 & 2 + Duplicate Mother...');

      // STEP 1: Calculate Splits
      console.log('🔧 4/4 - Step 1: Calculate Splits');
      const overflowResult = detectOverflowAndSplit();
      setSplit1Text(overflowResult.originalText);
      setSplit2Text(overflowResult.overflowText);
      console.log(`📝 SPLIT 1 (${overflowResult.originalText.length} chars):`, overflowResult.originalText.substring(0, 50) + '...');
      console.log(`📝 SPLIT 2 (${overflowResult.overflowText.length} chars):`, overflowResult.overflowText.substring(0, 50) + '...');
      setDebugStep(1);

      // STEP 2: Fill Parent (SPLIT 1)
      console.log('🔧 4/4 - Step 2: Fill Parent (SPLIT 1)');
      const debugConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: overflowResult.originalText
        }
      };
      setConfig(debugConfig);
      (window as any).debugModeActive = true;
      onSave(debugConfig);
      setDebugStep(2);

      // Wait a moment for the save to process
      await new Promise(resolve => setTimeout(resolve, 300));

      // STEP 3: Find parent mother and duplicate it to create Mother_1A
      console.log('🔧 4/4 - Step 3: Duplicating Mother_1 to create Mother_1A');
      
      // Find the correct parent mother by searching which mother contains this regionId
      const globalData = (window as any).currentAppData;
      let parentMotherId = 'Mother_1'; // Default fallback
      if (globalData && globalData.objects) {
        console.log(`🔍 4/4: Searching ${globalData.objects.length} objects for region ${regionId}...`);
        for (const obj of globalData.objects) {
          if (obj.type?.includes('mother') && obj.regions) {
            for (const region of obj.regions) {
              if (region.id === regionId) {
                parentMotherId = obj.name;
                console.log(`✅ 4/4: Found region ${regionId} in mother: ${parentMotherId}`);
                break;
              }
            }
            if (parentMotherId !== 'Mother_1') break; // Found it, stop searching
          }
        }
      }
      console.log(`🔍 4/4: Using parent mother: ${parentMotherId}`);
      
      // Create child mother (Mother_1A) structure
      if (createChildMother) {
        const childMotherId = createChildMother(parentMotherId);
        if (childMotherId) {
          console.log(`✅ 4/4: Child mother created: ${childMotherId} (Mother_1A)`);
          // Store the child ID for potential later use
          (window as any).lastCreatedChildId = childMotherId;
        } else {
          console.error('❌ 4/4: Failed to create child mother structure');
          return;
        }
      } else {
        console.error('❌ 4/4: createChildMother function not available');
        return;
      }

      console.log('🎉 4/4: Completed! Mother_1 has SPLIT 1 text and Mother_1A created');

    } catch (error) {
      console.error('❌ 4/4: Error during execution:', error);
    }
  };

  // NEW: Button "3v2" - Simple combination of 3-1, 3-2, and 3-3 with verification
  const handle3v2 = async (providedSplit1Text?: string, providedSplit2Text?: string) => {
    try {
      console.log('🚀 3v2: Starting simple 3-1 + 3-2 + 3-3 combination...');
      console.log('🔍 3v2: Current regionId:', regionId);
      
      // Use provided split texts if available, otherwise fall back to state variables
      const actualSplit1Text = providedSplit1Text || split1Text;
      const actualSplit2Text = providedSplit2Text || split2Text;
      
      console.log('🔍 3v2: Split texts available:', { 
        split1Text: !!actualSplit1Text, 
        split2Text: !!actualSplit2Text,
        fromParameters: !!(providedSplit1Text && providedSplit2Text)
      });

      // Check if we have split texts from previous steps
      if (!actualSplit1Text || !actualSplit2Text) {
        console.error('❌ 3v2: No split texts available. Please run Step 1 & 2 first.');
        console.error('❌ 3v2: split1Text:', actualSplit1Text?.substring(0, 50) || 'null');
        console.error('❌ 3v2: split2Text:', actualSplit2Text?.substring(0, 50) || 'null');
        return;
      }

      // Get Mother_1 configuration before creating child
      const mother1Config = getMother1Configuration();
      if (!mother1Config) {
        console.error('❌ 3v2: Cannot get Mother_1 configuration');
        return;
      }

      // Execute 3-1
      console.log('🚀 3v2: Executing 3-1...');
      await handle31(actualSplit1Text, actualSplit2Text);
      await new Promise(resolve => setTimeout(resolve, 500));

      // VERIFY: Check that child mother exists in app data before proceeding
      const childMotherId = (window as any).lastCreatedChildId;
      if (!childMotherId) {
        console.error('❌ 3v2: No child mother ID stored after 3-1');
        return;
      }
      
      console.log(`🔍 3v2: Verifying ${childMotherId} exists in app data before 3-2...`);
      const childMotherExists = await verifyChildMotherInAppData(childMotherId);
      if (!childMotherExists) {
        console.error(`❌ 3v2: Child mother ${childMotherId} not found in app data - cannot proceed to 3-2`);
        return;
      }

      // Execute 3-2: Test the FIXED App.tsx callback
      console.log('🚀 3v2: Testing FIXED App.tsx callback for 3-2...');
      await handle32();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Execute 3-3: Test the FIXED App.tsx callback  
      console.log('🚀 3v2: Testing FIXED App.tsx callback for 3-3...');
      await handle33(actualSplit1Text, actualSplit2Text);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🎉 3v2: All steps completed!');

      // Close the dialog
      onCancel();

    } catch (error) {
      console.error('❌ 3v2: Error during execution:', error);
      console.error('❌ 3v2: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert(`3v2 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Wrapper functions for button click handlers
  const handle31ButtonClick = () => handle31();
  const handle33ButtonClick = () => handle33();
  const handle3v2ButtonClick = () => handle3v2();

  // Special console logging function for easy capture
  const logNSplitDebug = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `🎯 N-SPLIT-DEBUG [${timestamp}]: ${message}`;
    console.log(logMessage, data || '');

    // Also store in window for easy access
    if (!(window as any).nSplitLogs) {
      (window as any).nSplitLogs = [];
    }
    (window as any).nSplitLogs.push({
      timestamp,
      message,
      data
    });
  };

  // Function to export debug logs
  const exportNSplitLogs = () => {
    const logs = (window as any).nSplitLogs || [];
    const logText = logs.map((log: any) =>
      `[${log.timestamp}] ${log.message}${log.data ? ' | ' + JSON.stringify(log.data) : ''}`
    ).join('\n');

    console.log('📋 ALL N-SPLIT DEBUG LOGS:');
    console.log(logText);

    // Copy to clipboard if possible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(logText).then(() => {
        console.log('✅ Logs copied to clipboard!');
      }).catch(() => {
        console.log('❌ Could not copy to clipboard');
      });
    }

    return logText;
  };

  // Make functions available globally for easy access after dialog closes
  React.useEffect(() => {
    (window as any).exportNSplitLogs = exportNSplitLogs;
    (window as any).clearNSplitLogs = clearNSplitLogs;

    return () => {
      // Cleanup on unmount (optional)
      // delete (window as any).exportNSplitLogs;
      // delete (window as any).clearNSplitLogs;
    };
  }, []);

  // Clear debug logs
  const clearNSplitLogs = () => {
    (window as any).nSplitLogs = [];
    console.log('🧹 N-Split debug logs cleared');
  };

  // NEW: Button "FF" - Fast Flow: First save mother_1 with split1, then create mother_1A with split2
  const handleFF = async () => {
    try {
      console.log('🚀 Generate: Starting Generate Flow - step by step...');
      console.log('🚀 Generate: Current text to process:', (config.textContent.originalText || config.textContent.generatedText || generateTextContent()).substring(0, 100) + '...');

      // STEP 0: Remove ALL active parent-linked child mothers (object hierarchy cleanup)
      console.log('🗑️ Generate - FIRST PRIORITY: Complete removal of all active parent-linked child mothers');
      let currentAppData = (window as any).currentAppData;

      // Find parent mother ID
      let parentMotherId = 'Mother_1'; // Default fallback
      let parentMother: any = null;

      if (currentAppData && currentAppData.objects) {
        parentMother = currentAppData.objects.find((obj: any) =>
          obj.regions && obj.regions.some((region: any) => region.id === regionId)
        );
        if (parentMother) {
          parentMotherId = parentMother.name;
        }
        console.log('🗑️ Generate: Target parent mother:', parentMotherId);

        // AGGRESSIVE CHILD MOTHER DETECTION - REMOVE ALL LINKED CHILD MOTHERS
        const allChildMothersToRemove: any[] = [];

        // Method 1: Remove child mothers that are linked to this parent only
        const directChildMothers = currentAppData.objects.filter((obj: any) =>
          obj.type && obj.type.includes('mother') &&
          obj.name !== parentMotherId &&
          (obj.parentMotherId === parentMotherId || obj.isOverflowChild === true)
        );
        allChildMothersToRemove.push(...directChildMothers);

        // Method 2: Also check for any remaining relationship markers
        const childrenByRelationship = currentAppData.objects.filter((obj: any) =>
          (obj.isOverflowChild === true) ||
          (obj.parentMotherId && obj.parentMotherId === parentMotherId)
        );
        childrenByRelationship.forEach((child: any) => {
          if (!allChildMothersToRemove.find((existing: any) => existing.name === child.name)) {
            allChildMothersToRemove.push(child);
          }
        });

        // Method 3: Pattern-based removal (Mother_1A, Mother_1B, Mother_2, etc.)
        const patternBasedMothers = currentAppData.objects.filter((obj: any) =>
          obj.name && (
            obj.name.match(/^Mother_\d+[A-Z]$/) ||  // Mother_1A, Mother_1B, etc.
            obj.name.match(/^Mother_[2-9]\d*$/)     // Mother_2, Mother_3, etc.
          ) && obj.name !== parentMotherId
        );
        patternBasedMothers.forEach((child: any) => {
          if (!allChildMothersToRemove.find((existing: any) => existing.name === child.name)) {
            allChildMothersToRemove.push(child);
          }
        });

        console.log(`🗑️ Generate: Found ${allChildMothersToRemove.length} child mothers to remove from object hierarchy:`,
          allChildMothersToRemove.map((c: any) => c.name));

        if (allChildMothersToRemove.length > 0) {
          // Remove ALL detected child mothers from objects array
          const childMotherNamesToRemove = allChildMothersToRemove.map((c: any) => c.name);
          const cleanedObjects = currentAppData.objects.filter((obj: any) =>
            !childMotherNamesToRemove.includes(obj.name)
          );

          // Clear ALL parent relationship tracking
          if (parentMother) {
            // Clear childMotherIds array completely
            if (parentMother.childMotherIds) {
              parentMother.childMotherIds = [];
            }
            // Remove any other relationship tracking properties
            delete parentMother.hasChildren;
            delete parentMother.childCount;
            console.log('🗑️ Generate: Cleared ALL parent relationship tracking');
          }

          // Update global app data with cleaned objects
          const cleanedAppData = {
            ...currentAppData,
            objects: cleanedObjects,
            totalObjects: cleanedObjects.length
          };

          if ((window as any).updateAppData) {
            (window as any).updateAppData(cleanedAppData);
            console.log('✅ Generate: All child mothers removed from object hierarchy');
          }

          // Force canvas refresh to reflect removal
          if ((window as any).refreshCanvas) {
            (window as any).refreshCanvas();
          }

          // Wait for cleanup to be fully applied
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log('ℹ️ Generate: No child mothers found in object hierarchy - proceeding with clean slate');
        }
      }

      // STEP 1: Clear parent canvas text
      console.log('🔧 Generate - Step 1: Clear parent canvas text');
      const clearConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: '' // Clear canvas first
        }
      };
      onSave(clearConfig);
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause for clear

      // STEP 2: Apply N-split logic and detect overflow
      logNSplitDebug('STEP 2: Apply N-split logic to original text');
      const nSplitResult = detectOverflowAndSplitN();
      logNSplitDebug('N-SPLIT RESULT', {
        totalSplits: nSplitResult.totalSplits,
        hasOverflow: nSplitResult.hasOverflow,
        textSplitsLength: nSplitResult.textSplits?.length || 0
      });

      // Store all splits for later use
      const allTextSplits = nSplitResult.textSplits;
      setSplit1Text(allTextSplits[0] || '');
      setSplit2Text(allTextSplits.slice(1).join('\n\n') || ''); // Store remaining splits as split2 for legacy compatibility

      // Store all splits in window for advanced N-split usage
      (window as any).lastNSplitResult = {
        textSplits: allTextSplits,
        totalSplits: nSplitResult.totalSplits,
        hasOverflow: nSplitResult.hasOverflow,
        splitDetails: nSplitResult.splitDetails
      };

      // Log each split with detailed analysis
      allTextSplits.forEach((split, index) => {
        console.log(`📝 SPLIT ${index + 1}/${nSplitResult.totalSplits} (${split.length} chars):`, split.substring(0, 50) + '...');
        if (index === 0) {
          console.log(`👑 Split 1 (Parent): "${split.substring(0, 100)}..."`);
        } else {
          console.log(`👶 Split ${index + 1} (Child ${index}): "${split.substring(0, 100)}..."`);
        }
      });

      // Verify total text distribution
      const totalOriginalText = config.textContent.originalText || config.textContent.generatedText || generateTextContent();
      const lineBreakSymbol = config.lineBreakSettings?.lineBreakSymbol || '\n';
      const totalSplitText = allTextSplits.join(lineBreakSymbol);
      console.log(`🔍 TEXT VERIFICATION: Original text length: ${totalOriginalText.length}`);
      console.log(`🔍 TEXT VERIFICATION: Total split text length: ${totalSplitText.length}`);
      console.log(`🔍 TEXT VERIFICATION: Text distribution complete: ${totalOriginalText.length === totalSplitText.length ? '✅' : '❌'}`);

      if (totalOriginalText.length !== totalSplitText.length) {
        console.warn(`⚠️ TEXT MISMATCH: Original vs Split difference: ${totalOriginalText.length - totalSplitText.length} chars`);
        console.warn(`⚠️ Original text preview: "${totalOriginalText.substring(0, 100)}..."`);
        console.warn(`⚠️ Split text preview: "${totalSplitText.substring(0, 100)}..."`);
      }

      // Verify text distribution percentages
      allTextSplits.forEach((split, index) => {
        const percentage = ((split.length / totalOriginalText.length) * 100).toFixed(1);
        console.log(`📊 Split ${index + 1} fills ${percentage}% of total text (${split.length}/${totalOriginalText.length} chars)`);
      });

      setDebugStep(1);

      // STEP 3: Save wrapped text to parent canvas
      console.log('🔧 Generate - Step 3: Save wrapped text to parent canvas');
      const wrappedConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: nSplitResult.textSplits[0] // This is the wrapped text that fits
        }
      };
      setConfig(wrappedConfig);
      (window as any).debugModeActive = true;

      console.log('🔧 Generate-DEBUG: Saving wrapped text to parent canvas');
      onSave(wrappedConfig);
      console.log('🔧 Generate-DEBUG: Parent canvas updated with wrapped text');
      setDebugStep(2);

      // Wait for mother_1 to be properly saved
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify mother_1 still has content before proceeding
      console.log('🔴🔴🔴 Generate-DEBUG: VERIFICATION - Checking mother_1 content...');
      currentAppData = (window as any).currentAppData;
      if (currentAppData && currentAppData.objects) {
        const mother1 = currentAppData.objects.find((obj: any) => obj.name === 'Mother_1');
        console.log('🔴🔴🔴 FF-DEBUG: mother1 found:', !!mother1);

        if (mother1 && mother1.regions) {
          console.log('🔴🔴🔴 FF-DEBUG: mother1.regions length:', mother1.regions.length);
          const targetRegion = mother1.regions.find((region: any) => region.id === regionId);
          console.log('🔴🔴🔴 FF-DEBUG: targetRegion found:', !!targetRegion);
          console.log('🔴🔴🔴 FF-DEBUG: regionId searching for:', regionId);

          if (targetRegion) {
            console.log('🔴🔴🔴 FF-DEBUG: targetRegion.contents length:', targetRegion.contents?.length || 0);
            if (targetRegion.contents && targetRegion.contents.length > 0) {
              const ctContent = targetRegion.contents.find((c: any) => c.type === 'new-comp-trans');
              console.log('🔴🔴🔴 FF-DEBUG: CT content found:', !!ctContent);
              if (ctContent) {
                const textContent = ctContent.newCompTransConfig?.textContent?.generatedText;
                console.log('🔴🔴🔴 FF-DEBUG: Text content length:', textContent?.length || 0);
                console.log('🔴🔴🔴 FF-DEBUG: Text preview:', textContent?.substring(0, 50) || 'NO TEXT');
                console.log('✅ FF: mother_1 content verified - proceeding with child creation');
              } else {
                console.log('🔴🔴🔴 FF-DEBUG: NO CT CONTENT FOUND!');
              }
            } else {
              console.log('🔴🔴🔴 FF-DEBUG: NO CONTENTS IN TARGET REGION!');
              console.warn('⚠️ FF: mother_1 content missing - will try to restore');
              onSave(wrappedConfig);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } else {
            console.log('🔴🔴🔴 FF-DEBUG: TARGET REGION NOT FOUND!');
          }
        } else {
          console.log('🔴🔴🔴 FF-DEBUG: NO REGIONS IN MOTHER1!');
        }
      } else {
        console.log('🔴🔴🔴 FF-DEBUG: NO APP DATA OR OBJECTS!');
      }

      // 🔬 N-SPLIT: Enhanced overflow detection debugging
      console.log('🔬 N-SPLIT: Overflow detection results:', {
        hasOverflow: nSplitResult.hasOverflow,
        totalSplits: nSplitResult.totalSplits,
        needsChildMothers: nSplitResult.totalSplits > 1,
        splits: nSplitResult.textSplits.map((split, i) => ({
          index: i + 1,
          length: split.length,
          preview: split.substring(0, 30) + '...'
        }))
      });

      // CHECK: Determine next action based on N-split result
      if (nSplitResult.totalSplits <= 1) {
        console.log('✅ Generate: No overflow detected - wrapped text fits in parent');
        console.log('✅ Generate: Parent canvas already contains properly wrapped text');
        console.log('✅ Generate: Child mothers already removed - process complete');
        setDebugStep(4);
        console.log('🎉 Generate: Flow completed without overflow!');
        return;
      }

      // STEP 4: Create N child mothers for overflow content
      console.log(`🔧 Generate - Step 4: Creating ${nSplitResult.totalSplits - 1} child mothers for overflow content`);

      // Find parent mother ID
      const globalData = (window as any).currentAppData;
      let parentMotherIdForStep3 = 'Mother_1'; // Default fallback
      if (globalData && globalData.objects) {
        for (const obj of globalData.objects) {
          if (obj.type?.includes('mother') && obj.regions) {
            for (const region of obj.regions) {
              if (region.id === regionId) {
                parentMotherIdForStep3 = obj.name;
                break;
              }
            }
            if (parentMotherIdForStep3 !== 'Mother_1') break;
          }
        }
      }

      logNSplitDebug(`STEP 4: Creating ${nSplitResult.totalSplits - 1} child mothers for splits 2-${nSplitResult.totalSplits}`);

      // Store created child mother IDs
      const createdChildMotherIds: string[] = [];

      // Create N-1 child mothers sequentially (since split 1 goes to parent)
      for (let i = 1; i < nSplitResult.totalSplits; i++) {
        const childNumber = i;
        const totalChildrenNeeded = nSplitResult.totalSplits - 1;

        logNSplitDebug(`LOOP ITERATION ${i}: Creating child mother ${childNumber}/${totalChildrenNeeded} (for split ${i + 1}/${nSplitResult.totalSplits})`);

        // Check current state before creation
        const preCreationData = (window as any).currentAppData;
        if (preCreationData && preCreationData.objects) {
          const existingMothers = preCreationData.objects.filter((obj: any) => obj.type?.includes('mother'));
          logNSplitDebug(`PRE-CREATION: Found ${existingMothers.length} existing mothers`, existingMothers.map((m: any) => m.name));
        }

        let childMotherId: string | null = null;

        // Enhanced approach: Call createChildMother with N-split context
        if (createChildMother) {
          try {
            logNSplitDebug(`CALLING createChildMother for iteration ${i}`);

            childMotherId = createChildMother(parentMotherIdForStep3);

            logNSplitDebug(`createChildMother returned: ${childMotherId}`);

            if (childMotherId) {
              logNSplitDebug(`SUCCESS: Child mother created: ${childMotherId} (holds split ${i + 1})`);
              createdChildMotherIds.push(childMotherId);
              (window as any).lastCreatedChildId = childMotherId;

              // Store N-split context for this child
              (window as any)[`childMother_${childMotherId}_splitIndex`] = i + 1;
              (window as any)[`childMother_${childMotherId}_totalSplits`] = nSplitResult.totalSplits;

              // Verify creation was successful
              const postCreationData = (window as any).currentAppData;
              if (postCreationData && postCreationData.objects) {
                const existingMothersAfter = postCreationData.objects.filter((obj: any) => obj.type?.includes('mother'));
                logNSplitDebug(`POST-CREATION: Found ${existingMothersAfter.length} mothers`, existingMothersAfter.map((m: any) => m.name));

                const createdMother = postCreationData.objects.find((obj: any) => obj.name === childMotherId);
                if (createdMother) {
                  logNSplitDebug(`VERIFICATION SUCCESS: ${childMotherId} exists in app data`);
                } else {
                  logNSplitDebug(`VERIFICATION FAILED: ${childMotherId} NOT found in app data!`);
                }
              }

              // Wait longer between creations to ensure proper state updates
              logNSplitDebug(`Waiting 1000ms before next iteration...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
            } else {
              logNSplitDebug(`FAILED: createChildMother returned null for iteration ${i}`);
              alert(`Error: Failed to create child mother ${childNumber} for N-split ${i + 1}/${nSplitResult.totalSplits}`);
              return;
            }
          } catch (error) {
            logNSplitDebug(`EXCEPTION in iteration ${i}`, error);
            alert(`Error: Failed to create child mother ${childNumber} for N-split ${i + 1}/${nSplitResult.totalSplits}: ${error}`);
            return;
          }
        } else {
          logNSplitDebug('FAILED: createChildMother function not available');
          alert('Error: createChildMother function not available');
          return;
        }

        logNSplitDebug(`COMPLETED iteration ${i}, continuing to next...`);
      }

      logNSplitDebug(`FINAL RESULT: Created ${createdChildMotherIds.length} child mothers`, createdChildMotherIds);
      logNSplitDebug(`TEXT DISTRIBUTION STARTING: Will distribute ${nSplitResult.textSplits.length} splits to child mothers`);

      // Log the split assignment plan
      createdChildMotherIds.forEach((childId, index) => {
        const splitIndex = index + 1; // Child gets split 1, 2, 3... (parent gets split 0)
        const splitContent = nSplitResult.textSplits[splitIndex] || '';
        logNSplitDebug(`PLAN: ${childId} (index ${index}) should get split ${splitIndex + 1} (${splitContent.length} chars)`);
      });

      // Auto-export logs for easy capture after dialog closes
      setTimeout(() => {
        console.log('🎯 AUTO-EXPORTING N-SPLIT LOGS FOR EASY CAPTURE:');
        exportNSplitLogs();
        console.log('🎯 TO ACCESS LOGS AFTER DIALOG CLOSES, RUN: exportNSplitLogs()');
      }, 100);

      // Wait for all child mothers to be fully created
      logNSplitDebug(`About to wait 500ms before text distribution...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      logNSplitDebug(`Wait completed, proceeding to text distribution...`);

      // STEP 5: Distribute text across all child mothers
      logNSplitDebug(`STEP 5: Distributing text across ${createdChildMotherIds.length} child mothers`);
      logNSplitDebug(`About to start text distribution loop`, {
        createdChildMotherIdsLength: createdChildMotherIds.length,
        createdChildMotherIds: createdChildMotherIds,
        nSplitResultTextSplitsLength: nSplitResult.textSplits.length
      });

      // Distribute text to each child mother using N-split data
      for (let i = 0; i < createdChildMotherIds.length; i++) {
        logNSplitDebug(`TEXT LOOP ITERATION ${i}: Starting distribution for child ${i}`);
        const childMotherId = createdChildMotherIds[i];
        const splitIndex = i + 1; // Split 0 is for parent, split 1+ for children
        const textForChild = nSplitResult.textSplits[splitIndex] || '';

        console.log(`🔧 Generate: Adding text to child mother ${i + 1}/${createdChildMotherIds.length} (${childMotherId})`);
        console.log(`📝 N-SPLIT ${splitIndex + 1}/${nSplitResult.totalSplits}: Text for ${childMotherId} (${textForChild.length} chars):`, textForChild.substring(0, 50) + '...');
        console.log(`🔍 Generate: Full N-split ${splitIndex + 1} content: "${textForChild.substring(0, 100)}..."`);

        // Verify we have the right split
        const expectedSplitIndex = (window as any)[`childMother_${childMotherId}_splitIndex`];
        if (expectedSplitIndex && expectedSplitIndex !== splitIndex + 1) {
          console.warn(`⚠️ N-SPLIT MISMATCH: Expected split ${expectedSplitIndex} but assigning split ${splitIndex + 1} to ${childMotherId}`);
        }

        if (onCreateNewMother && childMotherId && textForChild) {
          logNSplitDebug(`ASSIGNING TEXT: ${childMotherId} gets split ${splitIndex + 1} (${textForChild.length} chars)`, {
            childMotherId,
            splitIndex: splitIndex + 1,
            textLength: textForChild.length,
            textPreview: textForChild.substring(0, 100)
          });

          // Enhanced pre-check: Verify child mother exists and has proper structure
          let preCheckPassed = false;
          let retryCount = 0;
          const maxRetries = 5;

          while (!preCheckPassed && retryCount < maxRetries) {
            const preAddData = (window as any).currentAppData;
            if (preAddData && preAddData.objects) {
              const preChildMother = preAddData.objects.find((obj: any) => obj.name === childMotherId);
              if (preChildMother && preChildMother.regions && preChildMother.regions.length > 0) {
                console.log(`✅ Generate: Child mother ${childMotherId} verified with ${preChildMother.regions.length} regions (attempt ${retryCount + 1})`);
                preCheckPassed = true;
              } else {
                retryCount++;
                console.log(`⏳ Generate: Child mother ${childMotherId} not ready, retrying (${retryCount}/${maxRetries})...`);
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }
            } else {
              retryCount++;
              console.log(`⏳ Generate: App data not ready, retrying (${retryCount}/${maxRetries})...`);
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            }
          }

          if (!preCheckPassed) {
            console.error(`❌ Generate: Child mother ${childMotherId} failed pre-check after ${maxRetries} attempts`);
            alert(`Error: Child mother ${childMotherId} is not ready for content assignment`);
            continue; // Skip this child and continue with the next one
          }

          // Call the callback with verified child mother
          onCreateNewMother(childMotherId, textForChild);
          logNSplitDebug(`TEXT ASSIGNED: Called onCreateNewMother for ${childMotherId} with split ${splitIndex + 1}`);

          // Enhanced post-check: Verify content was actually added
          let postCheckPassed = false;
          let postRetryCount = 0;
          const maxPostRetries = 5;

          while (!postCheckPassed && postRetryCount < maxPostRetries) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait for content addition

            console.log(`🔍 N-SPLIT DEBUG: Post-check attempt ${postRetryCount + 1} for ${childMotherId}...`);
            const postAddData = (window as any).currentAppData;
            if (postAddData && postAddData.objects) {
              const postChildMother = postAddData.objects.find((obj: any) => obj.name === childMotherId);
              if (postChildMother && postChildMother.regions && postChildMother.regions[0]) {
                const region = postChildMother.regions[0];
                const hasContent = region.contents && region.contents.length > 0;
                const hasCtContent = hasContent && region.contents.find((c: any) => c.type === 'new-comp-trans');

                if (hasCtContent) {
                  const content = region.contents.find((c: any) => c.type === 'new-comp-trans');
                  const actualText = content.newCompTransConfig?.textContent?.generatedText;
                  console.log(`✅ N-SPLIT DEBUG: Content verified for ${childMotherId} - ${actualText?.length || 0} chars: "${actualText?.substring(0, 50) || 'NO TEXT'}..."`);
                  postCheckPassed = true;
                } else {
                  postRetryCount++;
                  console.log(`⏳ N-SPLIT DEBUG: Content not ready for ${childMotherId}, retrying (${postRetryCount}/${maxPostRetries})...`);
                  if (postRetryCount < maxPostRetries) {
                    await new Promise(resolve => setTimeout(resolve, 400));
                  }
                }
              } else {
                postRetryCount++;
                console.log(`⏳ N-SPLIT DEBUG: Child mother structure changed, retrying (${postRetryCount}/${maxPostRetries})...`);
                if (postRetryCount < maxPostRetries) {
                  await new Promise(resolve => setTimeout(resolve, 400));
                }
              }
            } else {
              postRetryCount++;
              console.log(`⏳ N-SPLIT DEBUG: App data unavailable, retrying (${postRetryCount}/${maxPostRetries})...`);
              if (postRetryCount < maxPostRetries) {
                await new Promise(resolve => setTimeout(resolve, 400));
              }
            }
          }

          if (!postCheckPassed) {
            console.error(`❌ N-SPLIT DEBUG: Content verification failed for ${childMotherId} after ${maxPostRetries} attempts`);
            console.error(`❌ This indicates the onCreateNewMother callback failed or had timing issues`);
            alert(`Warning: Content may not have been added to ${childMotherId}. Check manually.`);
          }

        } else {
          logNSplitDebug(`FAILED TEXT ASSIGNMENT: ${childMotherId}`, {
            hasOnCreateNewMother: !!onCreateNewMother,
            hasChildMotherId: !!childMotherId,
            hasTextForChild: !!textForChild,
            textLength: textForChild?.length || 0
          });

          if (!onCreateNewMother) {
            logNSplitDebug('ERROR: onCreateNewMother callback not available');
          }
          if (!childMotherId) {
            logNSplitDebug('ERROR: childMotherId is empty');
          }
          if (!textForChild) {
            logNSplitDebug('ERROR: textForChild is empty');
          }

          alert(`Error: Cannot add N-split ${splitIndex + 1} content to child mother ${childMotherId}`);
          return;
        }

        // Longer wait between child text distributions to allow data synchronization
        console.log(`⏳ Generate: Waiting 800ms before next child distribution...`);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      console.log(`✅ Generate: Text distribution completed for all ${createdChildMotherIds.length} child mothers`);

      // Final verification that mother_1 still has content
      console.log('🟢🟢🟢 FF-DEBUG: FINAL CHECK - Verifying mother_1 after child creation...');
      const finalAppData = (window as any).currentAppData;
      if (finalAppData && finalAppData.objects) {
        const finalMother1 = finalAppData.objects.find((obj: any) => obj.name === 'Mother_1');
        console.log('🟢🟢🟢 FF-DEBUG: Final mother1 found:', !!finalMother1);

        if (finalMother1 && finalMother1.regions) {
          console.log('🟢🟢🟢 FF-DEBUG: Final mother1.regions length:', finalMother1.regions.length);
          const finalTargetRegion = finalMother1.regions.find((region: any) => region.id === regionId);
          console.log('🟢🟢🟢 FF-DEBUG: Final targetRegion found:', !!finalTargetRegion);

          if (finalTargetRegion) {
            console.log('🟢🟢🟢 FF-DEBUG: Final targetRegion.contents length:', finalTargetRegion.contents?.length || 0);
            if (finalTargetRegion.contents && finalTargetRegion.contents.length > 0) {
              const finalCtContent = finalTargetRegion.contents.find((c: any) => c.type === 'new-comp-trans');
              console.log('🟢🟢🟢 FF-DEBUG: Final CT content found:', !!finalCtContent);
              if (finalCtContent) {
                const finalTextContent = finalCtContent.newCompTransConfig?.textContent?.generatedText;
                console.log('🟢🟢🟢 FF-DEBUG: Final text content length:', finalTextContent?.length || 0);
                console.log('🟢🟢🟢 FF-DEBUG: Final text preview:', finalTextContent?.substring(0, 50) || 'NO TEXT');
                console.log('✅ FF: mother_1 content still preserved after child creation');
              } else {
                console.log('🟢🟢🟢 FF-DEBUG: FINAL CHECK - NO CT CONTENT FOUND!');
              }
            } else {
              console.log('🟢🟢🟢 FF-DEBUG: FINAL CHECK - NO CONTENTS IN TARGET REGION!');
              console.error('❌ FF: mother_1 content was lost during child creation - restoring');
              onSave(wrappedConfig);
            }
          } else {
            console.log('🟢🟢🟢 FF-DEBUG: FINAL CHECK - TARGET REGION NOT FOUND!');
          }
        } else {
          console.log('🟢🟢🟢 FF-DEBUG: FINAL CHECK - NO REGIONS IN MOTHER1!');
        }
      } else {
        console.log('🟢🟢🟢 FF-DEBUG: FINAL CHECK - NO APP DATA OR OBJECTS!');
      }

      setDebugStep(4);
      console.log('🎉 Generate: N-Split Flow completed!');
      console.log(`✅ mother_1 should have SPLIT 1 text (saved)`);
      console.log(`✅ Created ${createdChildMotherIds.length} child mothers for splits 2-${nSplitResult.totalSplits}`);
      console.log(`🎯 N-SPLIT SUMMARY: Total ${nSplitResult.totalSplits} mothers created (1 parent + ${createdChildMotherIds.length} children)`);

      // Log each child mother and its split assignment
      createdChildMotherIds.forEach((childId, index) => {
        const splitNumber = index + 2; // Split 1 is parent, Split 2+ are children
        console.log(`✅ ${childId} should have SPLIT ${splitNumber} text`);
      });

      // IMPORTANT: Keep dialog open to prevent content loss
      console.log('🔵🔵🔵 FF-DEBUG: Keeping dialog open to prevent content loss');
      console.log('🔵🔵🔵 FF-DEBUG: Check canvas now - mother_1 should show split1Text');
      console.log('🔵🔵🔵 FF-DEBUG: If mother_1 appears empty, the issue is canvas rendering not data loss');

      // Force multiple canvas refresh mechanisms to ensure content is displayed
      setTimeout(() => {
        console.log('🔵🔵🔵 FF-DEBUG: Attempting multiple canvas refresh methods...');

        // Method 1: Standard canvas refresh
        const refreshCanvas = (window as any).refreshCanvas;
        if (refreshCanvas) {
          console.log('🔵🔵🔵 Generate-DEBUG: Method 1 - refreshCanvas()');
          refreshCanvas();
        }

        // Method 2: Force app data update
        const updateAppData = (window as any).updateAppData;
        const latestAppData = (window as any).currentAppData;
        if (updateAppData && latestAppData) {
          console.log('🔵🔵🔵 Generate-DEBUG: Method 2 - updateAppData()');
          updateAppData(latestAppData);
        }

        // Method 3: Trigger region content update
        const updateRegionContents = (window as any).updateRegionContents;
        if (updateRegionContents) {
          console.log('🔵🔵🔵 Generate-DEBUG: Method 3 - updateRegionContents()');
          const targetData = (window as any).currentAppData;
          if (targetData && targetData.objects) {
            const mother1 = targetData.objects.find((obj: any) => obj.name === 'Mother_1');
            if (mother1 && mother1.regions) {
              const targetRegion = mother1.regions.find((region: any) => region.id === regionId);
              if (targetRegion && targetRegion.contents) {
                updateRegionContents(regionId, targetRegion.contents);
              }
            }
          }
        }

        // Method 4: Force state update
        setTimeout(() => {
          console.log('🔵🔵🔵 Generate-DEBUG: Method 4 - Force state refresh');
          const forceUpdate = (window as any).forceUpdate;
          if (forceUpdate) {
            forceUpdate();
          }

          // Final check - if still not visible, it's a deeper rendering issue
          setTimeout(() => {
            console.log('🔵🔵🔵 Generate-DEBUG: All refresh methods attempted');
            console.log('🔵🔵🔵 Generate-DEBUG: If mother_1 still empty, issue is in canvas rendering system');
          }, 200);
        }, 100);
      }, 100);

    } catch (error) {
      console.error('❌ Generate: Error during Generate Flow execution:', error);
      console.error('❌ Generate: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert(`Generate Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // NEW: Button "123v2" - Combine "12" and "3v2" (Step 1&2 + Step 3v2)
  const handle123v2 = async () => {
    try {
      console.log('🚀 123v2: Starting combined 12 + 3v2 process...');

      // First execute "12" (Step 1 & 2) - NO CHANGES TO EXISTING CODE
      console.log('🚀 123v2: Executing "12" first...');
      await handle12();

      // Verify "12" completed by checking Mother_1 canvas text matches split1Text
      console.log('🔍 123v2: Verifying "12" completion by checking Mother_1 canvas text...');

      // Get the actual text displayed on Mother_1 canvas
      const currentData = (window as any).currentAppData;
      if (!currentData || !currentData.objects) {
        console.error('❌ 123v2: No app data available for verification');
        return;
      }

      // Find Mother_1
      const mother1 = currentData.objects.find((obj: any) => obj.name === 'Mother_1');
      if (!mother1) {
        console.error('❌ 123v2: Mother_1 not found');
        return;
      }

      // Find the region with content (check the region that was just updated)
      const targetRegion = mother1.regions?.find((region: any) => region.id === regionId);
      if (!targetRegion) {
        console.error('❌ 123v2: Target region not found in Mother_1');
        return;
      }

      // Get the actual canvas text from the region's contents
      const regionContentsArray = targetRegion.contents || [];
      const compTransContent = regionContentsArray.find((c: any) => c.type === 'new-comp-trans');
      const canvasText = compTransContent?.newCompTransConfig?.textContent?.generatedText || '';

      // Show popup with Mother_1 text after "12"
      alert(`After "12" - Mother_1 Text:\n\n${canvasText}\n\n(${canvasText.length} characters)`);

      // Verify "12" worked by checking if canvas has content
      if (canvasText && canvasText.length > 0) {
        console.log(`✅ 123v2: Mother_1 has content (${canvasText.length} chars) - "12" completed successfully!`);
      } else {
        console.error('❌ 123v2: Mother_1 has no content - "12" failed!');
        return;
      }

      // Get the split texts from the canvas data since closure variables are stale
      const actualSplit1Text = canvasText; // This is the SPLIT 1 text we verified

      // Calculate SPLIT 2 from the original full text
      const fullText = generateTextContent();
      const overflowResult = detectOverflowAndSplit();
      const actualSplit2Text = overflowResult.overflowText;

      console.log(`🔍 123v2: Passing split texts to 3v2 - SPLIT 1: ${actualSplit1Text.length} chars, SPLIT 2: ${actualSplit2Text.length} chars`);

      // Temporarily set the split texts for 3v2 to use
      setSplit1Text(actualSplit1Text);
      setSplit2Text(actualSplit2Text);

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now execute "3v2" (Step 3-1, 3-2, 3-3) - Pass split texts as parameters
      console.log('🚀 123v2: Now executing "3v2"...');
      await handle3v2(actualSplit1Text, actualSplit2Text);

      console.log('🎉 123v2: All steps completed successfully!');

    } catch (error) {
      console.error('❌ 123v2: Error during execution:', error);
      console.error('❌ 123v2: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert(`123v2 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  // NEW: Button "1234" - Combine all 4 steps (12 + 34)
  const handle1234 = async () => {
    try {
      console.log('🚀 1234: Starting all 4 steps in one click...');

      // STEP 1: Calculate Splits (same as handle12 step 1)
      console.log('🔧 1234 - Step 1: Calculate Splits');
      const overflowResult = detectOverflowAndSplit();
      const currentSplit1 = overflowResult.originalText;
      const currentSplit2 = overflowResult.overflowText;
      
      // Update state for UI display
      setSplit1Text(currentSplit1);
      setSplit2Text(currentSplit2);
      
      console.log(`📝 SPLIT 1 (${currentSplit1.length} chars):`, currentSplit1.substring(0, 50) + '...');
      console.log(`📝 SPLIT 2 (${currentSplit2.length} chars):`, currentSplit2.substring(0, 50) + '...');
      setDebugStep(1);

      // STEP 2: Fill Parent (same as handle12 step 2)
      console.log('🔧 1234 - Step 2: Fill Parent (SPLIT 1)');
      const debugConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: currentSplit1
        }
      };
      setConfig(debugConfig);
      (window as any).debugModeActive = true;
      onSave(debugConfig);
      setDebugStep(2);

      // STEP 3: EXACT COPY from debugStep === 2
      console.log(`🔧 [DEBUG] Step 3 - Duplicating parent mother with current text`);
      if (onCreateNewMother) {
        onCreateNewMother(currentSplit1, currentSplit2);
      }
      setDebugStep(3);

      // STEP 4: EXACT COPY from debugStep === 3
      console.log(`🔧 [DEBUG] Step 4 - Child mother should now have SPLIT 2:`, currentSplit2.substring(0, 50) + '...');
      console.log(`🔧 [DEBUG] All steps completed!`);
      setDebugStep(4); // Mark as completed, don't reset yet

      console.log('🎉 1234: All 4 steps completed successfully!');

    } catch (error) {
      console.error('❌ 1234: Error during execution:', error);
    }
  };

  // NEW: Button "2in1" - Universal handler combining Save and Generate logic
  const handle2in1 = async () => {
    try {
      console.log('🚀🚀🚀 2in1: FUNCTION STARTED 🚀🚀🚀');
      console.log('UNIQUE_2IN1_START:', new Date().toISOString());

      // STEP 1: Remove all child mothers FIRST
      console.log('🗑️ 2in1 - STEP 1: Remove all child mothers');
      const currentAppData = (window as any).currentAppData;
      console.log('🗑️ 2in1: currentAppData exists:', !!currentAppData);
      console.log('🗑️ 2in1: currentAppData.objects exists:', !!currentAppData?.objects);

      // Find parent mother ID - THIS IS THE MOTHER THAT OWNS THE REGION WE'RE EDITING
      let parentMotherId = 'Mother_1'; // Default fallback
      let parentMother: any = null;

      if (currentAppData && currentAppData.objects) {
        parentMother = currentAppData.objects.find((obj: any) =>
          obj.regions && obj.regions.some((region: any) => region.id === regionId)
        );
        if (parentMother) {
          parentMotherId = parentMother.name;
        }
        console.log('🗑️ 2in1: Found mother with this region:', parentMotherId);
        console.log('🗑️ 2in1: Is this mother a child?', parentMother?.isOverflowChild);
        console.log('🗑️ 2in1: Parent mother ID field:', parentMother?.parentMotherId);

        // CRITICAL FIX: If we're editing a CHILD mother, we need to find the ROOT PARENT
        if (parentMother?.isOverflowChild && parentMother?.parentMotherId) {
          const rootParentId = parentMother.parentMotherId;
          console.log('⚠️ 2in1: We are editing a CHILD mother! Root parent is:', rootParentId);

          // Find the root parent
          const rootParent = currentAppData.objects.find((obj: any) => obj.name === rootParentId);
          if (rootParent) {
            parentMother = rootParent;
            parentMotherId = rootParentId;
            console.log('✅ 2in1: Switched to root parent:', parentMotherId);
          } else {
            console.error('❌ 2in1: Could not find root parent:', rootParentId);
          }
        }

        console.log('🗑️ 2in1: Final target parent mother:', parentMotherId);

        // AGGRESSIVE: Remove ALL child mothers (any pattern match)
        const allChildMothersToRemove: any[] = [];

        console.log('🔍 2in1: Scanning all objects for child mothers...');
        console.log('🔍 2in1: Total objects in app data:', currentAppData.objects.length);

        // Method 1: Direct children - linked to THIS parent
        const directChildMothers = currentAppData.objects.filter((obj: any) =>
          obj.type && obj.type.includes('mother') &&
          obj.name !== parentMotherId &&
          obj.parentMotherId === parentMotherId &&
          obj.isOverflowChild === true
        );
        console.log('🔍 2in1: Method 1 (direct children) found:', directChildMothers.map((c: any) => c.name));
        allChildMothersToRemove.push(...directChildMothers);

        // Method 2: Pattern-based - ANY mother with letter suffix (Mother_1A, Mother_1B, Mother_1C, etc.)
        const parentNumberMatch = parentMotherId.match(/^Mother_(\d+)$/);
        if (parentNumberMatch) {
          const parentNumber = parentNumberMatch[1];
          const patternBasedMothers = currentAppData.objects.filter((obj: any) =>
            obj.type && obj.type.includes('mother') &&
            obj.name &&
            obj.name.match(new RegExp(`^Mother_${parentNumber}[A-Z]+$`)) && // One or more letters
            obj.name !== parentMotherId
          );
          console.log('🔍 2in1: Method 2 (pattern match) found:', patternBasedMothers.map((c: any) => c.name));
          patternBasedMothers.forEach((child: any) => {
            if (!allChildMothersToRemove.find((existing: any) => existing.name === child.name)) {
              allChildMothersToRemove.push(child);
            }
          });
        }

        // Method 3: Parent's childMotherIds array
        if (parentMother && (parentMother as any).childMotherIds) {
          const childIdsFromParent = (parentMother as any).childMotherIds;
          console.log('🔍 2in1: Method 3 (parent tracking) found:', childIdsFromParent);
          const childrenFromParentList = currentAppData.objects.filter((obj: any) =>
            childIdsFromParent.includes(obj.name)
          );
          childrenFromParentList.forEach((child: any) => {
            if (!allChildMothersToRemove.find((existing: any) => existing.name === child.name)) {
              allChildMothersToRemove.push(child);
            }
          });
        }

        // Method 4: ANY mother with isOverflowChild flag
        const overflowFlaggedMothers = currentAppData.objects.filter((obj: any) =>
          obj.type && obj.type.includes('mother') &&
          obj.isOverflowChild === true &&
          obj.name !== parentMotherId
        );
        console.log('🔍 2in1: Method 4 (overflow flag) found:', overflowFlaggedMothers.map((c: any) => c.name));
        overflowFlaggedMothers.forEach((child: any) => {
          if (!allChildMothersToRemove.find((existing: any) => existing.name === child.name)) {
            allChildMothersToRemove.push(child);
          }
        });

        console.log(`🗑️ 2in1: Found ${allChildMothersToRemove.length} child mothers to remove:`,
          allChildMothersToRemove.map((c: any) => c.name));

        console.log('UNIQUE_2IN1_REMOVAL_DEBUG:', JSON.stringify({
          parentMother: parentMotherId,
          childrenFound: allChildMothersToRemove.map((c: any) => c.name),
          childrenCount: allChildMothersToRemove.length
        }));

        if (allChildMothersToRemove.length > 0) {
          // Remove child mothers
          const childMotherNamesToRemove = allChildMothersToRemove.map((c: any) => c.name);
          const cleanedObjects = currentAppData.objects.filter((obj: any) =>
            !childMotherNamesToRemove.includes(obj.name)
          );

          // Clear parent relationship tracking
          if (parentMother) {
            if (parentMother.childMotherIds) {
              parentMother.childMotherIds = [];
            }
            delete parentMother.hasChildren;
            delete parentMother.childCount;
            console.log('🗑️ 2in1: Cleared parent relationship tracking');
          }

          // Update global app data
          const cleanedAppData = {
            ...currentAppData,
            objects: cleanedObjects,
            totalObjects: cleanedObjects.length
          };

          if ((window as any).updateAppData) {
            (window as any).updateAppData(cleanedAppData);
            console.log('✅ 2in1: Child mothers removed from data');
            console.log('✅ 2in1: Removed mothers:', childMotherNamesToRemove);
            console.log('✅ 2in1: Remaining object count:', cleanedObjects.length);
          }

          if ((window as any).refreshCanvas) {
            (window as any).refreshCanvas();
            console.log('✅ 2in1: Canvas refreshed');
          }

          // CHECK-BASED: Verify removal was successful
          let removalVerified = false;
          let verifyCount = 0;

          while (!removalVerified && verifyCount < 20) {
            const verifyData = (window as any).currentAppData;
            if (verifyData && verifyData.objects) {
              const stillExisting = verifyData.objects.filter((obj: any) =>
                childMotherNamesToRemove.includes(obj.name)
              );

              if (stillExisting.length === 0) {
                console.log(`✅ 2in1: Removal verified - all ${childMotherNamesToRemove.length} children gone (check ${verifyCount + 1})`);
                removalVerified = true;
                break;
              } else {
                console.log(`⏳ 2in1: Still found ${stillExisting.length} children (check ${verifyCount + 1}):`, stillExisting.map((c: any) => c.name));
              }
            }

            verifyCount++;
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          if (!removalVerified) {
            console.error(`❌ 2in1: CRITICAL - Removal verification failed after ${verifyCount} checks`);
            const finalCheck = (window as any).currentAppData;
            if (finalCheck) {
              const stillThere = finalCheck.objects.filter((obj: any) => childMotherNamesToRemove.includes(obj.name));
              console.error(`❌ 2in1: These children still exist:`, stillThere.map((c: any) => c.name));
            }
            alert(`ERROR: Failed to remove child mothers. Please try again.`);
            return; // BLOCK: Do not proceed if removal failed
          }

          // CRITICAL: Force multiple canvas refresh methods after successful removal
          console.log('🎨 2in1: Forcing comprehensive canvas refresh after removal...');

          // Method 1: Standard refresh
          if ((window as any).refreshCanvas) {
            (window as any).refreshCanvas();
            console.log('🎨 2in1: Method 1 - refreshCanvas() called');
          }

          // Method 2: Force app data update again
          if ((window as any).updateAppData) {
            const finalData = (window as any).currentAppData;
            (window as any).updateAppData(finalData);
            console.log('🎨 2in1: Method 2 - updateAppData() called');
          }

          // Method 3: Force render trigger
          if ((window as any).forceUpdate) {
            (window as any).forceUpdate();
            console.log('🎨 2in1: Method 3 - forceUpdate() called');
          }

          // Method 4: Window resize event
          window.dispatchEvent(new Event('resize'));
          console.log('🎨 2in1: Method 4 - resize event dispatched');

          // Wait for canvas to update
          await new Promise(resolve => setTimeout(resolve, 300));

          // FINAL VERIFICATION: Absolutely ensure NO child mothers exist before proceeding
          console.log('🔍 2in1: FINAL CHECK - Ensuring no child mothers exist...');
          const finalVerifyData = (window as any).currentAppData;
          if (finalVerifyData && finalVerifyData.objects) {
            // Check for ANY child mothers with _A, _B, _C pattern
            const anyChildMothers = finalVerifyData.objects.filter((obj: any) =>
              obj.type?.includes('mother') &&
              (obj.isOverflowChild === true || obj.name?.match(/_[A-Z]+$/))
            );

            if (anyChildMothers.length > 0) {
              console.error(`❌ 2in1: BLOCKING - Found ${anyChildMothers.length} child mothers still exist!`);
              console.error(`❌ 2in1: Child mothers found:`, anyChildMothers.map((c: any) => c.name));
              alert(`ERROR: Child mothers still exist: ${anyChildMothers.map((c: any) => c.name).join(', ')}\n\nCannot proceed. Please try again.`);
              return; // BLOCK: Absolutely do not proceed
            }

            const remainingMothers = finalVerifyData.objects
              .filter((obj: any) => obj.type?.includes('mother'))
              .map((obj: any) => ({ name: obj.name, isChild: obj.isOverflowChild, parent: obj.parentMotherId }));

            console.log('🔍 2in1 VERIFICATION: All remaining mothers after cleanup:', remainingMothers);

            console.log('UNIQUE_2IN1_AFTER_REMOVAL:', JSON.stringify({
              allRemainingMothers: remainingMothers.map((m: any) => m.name),
              totalRemaining: remainingMothers.length
            }));

            // Check specifically for child mothers that should be gone
            const stillExistingChildren = finalVerifyData.objects.filter((obj: any) =>
              childMotherNamesToRemove.includes(obj.name)
            );

            if (stillExistingChildren.length > 0) {
              console.error('❌ 2in1 VERIFICATION FAILED: These child mothers still exist:', stillExistingChildren.map((c: any) => c.name));
              console.log('UNIQUE_2IN1_REMOVAL_FAILED:', JSON.stringify({
                shouldBeRemoved: childMotherNamesToRemove,
                stillExist: stillExistingChildren.map((c: any) => c.name)
              }));
              alert(`ERROR: Child mothers not removed: ${stillExistingChildren.map((c: any) => c.name).join(', ')}`);
              return;
            } else {
              console.log('✅ 2in1 VERIFICATION: All child mothers successfully removed');
            }
          }
        } else {
          console.log('ℹ️ 2in1: No child mothers found - clean slate');
        }
      }

      // ABSOLUTE FINAL CHECK: Ensure no child mothers before proceeding to STEP 2
      console.log('🛡️ 2in1: ABSOLUTE FINAL CHECK before STEP 2...');
      const absoluteFinalCheck = (window as any).currentAppData;
      if (absoluteFinalCheck && absoluteFinalCheck.objects) {
        const anyRemainingChildren = absoluteFinalCheck.objects.filter((obj: any) =>
          obj.type?.includes('mother') &&
          (obj.isOverflowChild === true ||
           obj.name?.match(/Mother_\d+[A-Z]/) ||
           obj.parentMotherId)
        );

        if (anyRemainingChildren.length > 0) {
          console.error('❌ 2in1: CRITICAL BLOCK - Child mothers found before STEP 2!');
          console.error('❌ 2in1: Found:', anyRemainingChildren.map((c: any) => c.name));
          alert(`CRITICAL ERROR: Child mothers detected before STEP 2!\n${anyRemainingChildren.map((c: any) => c.name).join(', ')}\n\nAborting.`);
          return;
        }

        console.log('✅ 2in1: ABSOLUTE FINAL CHECK passed - no child mothers exist');
        console.log('✅ 2in1: Clean to proceed to STEP 2');
      }

      // STEP 1.5: CLEAN parent mother's SAVED text content ONLY (NOT the dialog textarea)
      // The user might have pasted NEW text in the textarea - we want to keep that!
      // We only clean the SAVED text in the global data (old split1 from previous run)
      console.log('🧹 2in1 - STEP 1.5: Cleaning parent mother SAVED text content');

      // DON'T touch the dialog config - user might have pasted new text!
      // We'll use whatever is in config.textContent for STEP 2
      console.log('📝 2in1: Keeping dialog text as-is:', config.textContent.generatedText?.substring(0, 100) + '...');
      console.log('📝 2in1: Dialog text length:', config.textContent.generatedText?.length || 0);

      // SECOND: Also clean the global data
      const cleanAppData = (window as any).currentAppData;
      if (cleanAppData && cleanAppData.objects && parentMother) {
        console.log('🧹 2in1: Looking for parent mother:', parentMotherId);
        const freshParent = cleanAppData.objects.find((obj: any) => obj.name === parentMotherId);

        if (freshParent && freshParent.regions) {
          console.log('🧹 2in1: Found parent mother, checking regions...');
          const targetRegion = freshParent.regions.find((r: any) => r.id === regionId);

          if (targetRegion) {
            console.log('🧹 2in1: Found target region:', regionId);

            // Find and clear the comp-trans content
            if (targetRegion.contents) {
              const ctContent = targetRegion.contents.find((c: any) => c.type === 'new-comp-trans');
              if (ctContent && ctContent.newCompTransConfig) {
                const oldText = ctContent.newCompTransConfig.textContent?.generatedText || '';
                console.log('🧹 2in1: Found old text in global data:', oldText.substring(0, 100) + '...');
                console.log('🧹 2in1: Old text length:', oldText.length);

                // Clear the old text - set to empty string
                ctContent.newCompTransConfig.textContent.generatedText = '';
                ctContent.newCompTransConfig.textContent.originalText = '';

                console.log('✅ 2in1: Global data text CLEANED (set to empty)');

                // Update the global data
                (window as any).currentAppData = cleanAppData;
                if ((window as any).updateAppData) {
                  (window as any).updateAppData(cleanAppData);
                }
              } else {
                console.log('ℹ️ 2in1: No comp-trans content found in region');
              }
            }
          } else {
            console.warn('⚠️ 2in1: Target region not found:', regionId);
          }
        } else {
          console.warn('⚠️ 2in1: Parent mother not found or has no regions');
        }
      }

      // STEP 2: Get user input text and run overflow detection
      console.log('📝 2in1 - STEP 2: Get user input text and run overflow detection');

      // Use the dialog config directly - it has whatever the user typed/pasted
      console.log('📝 2in1: config.textContent.generatedText:', config.textContent.generatedText?.substring(0, 100));
      console.log('📝 2in1: config.textContent.originalText:', config.textContent.originalText?.substring(0, 100));

      // Get text from dialog - use what user typed/pasted
      let userInputText = config.textContent.generatedText || config.textContent.originalText || '';

      // 🔧 FIX: Check if text is empty or a simple placeholder value (like "1", "100%", etc.)
      // Only auto-generate if text is truly a placeholder, NOT if user pasted real content
      const isEmptyOrPlaceholder = !userInputText.trim() ||
                                    (userInputText.trim().length < 10 && /^[\d\s%]*$/.test(userInputText.trim()));

      if (isEmptyOrPlaceholder) {
        console.log('🔧 2in1 FIX: Text is empty or placeholder "' + userInputText + '" - auto-generating from materials');
        userInputText = generateTextContent();
        console.log('🔧 2in1 FIX: Generated text length:', userInputText.length);
        console.log('🔧 2in1 FIX: Generated text preview:', userInputText.substring(0, 100) + '...');
      } else {
        console.log('✅ 2in1: Using user-provided text (not a placeholder)');
      }

      console.log('📝 2in1: Final user input text:', userInputText.substring(0, 100) + '...');
      console.log('📝 2in1: Final text length:', userInputText.length);

      // Temporarily store user text for detectOverflowAndSplitN to use
      (window as any).__temp2in1Config = {
        ...config,
        textContent: {
          ...config.textContent,
          originalText: userInputText,
          generatedText: userInputText
        }
      };

      const nSplitResult = detectOverflowAndSplitN();
      delete (window as any).__temp2in1Config;

      console.log('📊 2in1: totalSplits =', nSplitResult.totalSplits, ', hasOverflow =', nSplitResult.hasOverflow);

      // STEP 3: Check if overflow exists
      if (!nSplitResult.hasOverflow || nSplitResult.totalSplits === 1) {
        // NO OVERFLOW: Save text directly to region
        console.log('✅ 2in1: No overflow - saving text directly');

        // 🔧 FIX: Use onSave instead of direct data manipulation!
        // This ensures React state is updated properly
        const saveConfig = {
          ...config,
          textContent: {
            ...config.textContent,
            originalText: userInputText,
            generatedText: userInputText
          }
        };

        console.log('✅ 2in1: Calling onSave to update React state');
        onSave(saveConfig);

        // Also update global data for canvas
        const freshAppData = (window as any).currentAppData;
        if (freshAppData && freshAppData.objects) {
          const freshParent = freshAppData.objects.find((obj: any) =>
            obj.regions && obj.regions.some((region: any) => region.id === regionId)
          );

          if (freshParent) {
            console.log('✅ 2in1: Found parent:', freshParent.name);
            const region = freshParent.regions.find((r: any) => r.id === regionId);
            if (region) {
              // Update or create content
              let ctContent = region.contents?.find((c: any) => c.type === 'new-comp-trans');
              if (!ctContent) {
                // Create new content if doesn't exist
                if (!region.contents) region.contents = [];
                ctContent = {
                  id: `content_${Date.now()}`,
                  type: 'new-comp-trans',
                  newCompTransConfig: saveConfig
                };
                region.contents.push(ctContent);
              } else {
                // Update existing content
                ctContent.newCompTransConfig = saveConfig;
              }

              // Update app data
              (window as any).updateAppData(freshAppData);

              // Refresh canvas
              if ((window as any).refreshCanvas) {
                (window as any).refreshCanvas();
              }

              console.log('✅ 2in1: Text saved to parent');
            }
          }
        }

        onCancel();
        return;
      }

      // HAS OVERFLOW: Save split1 to parent using onSave to update both global and React state
      console.log('⚠️ 2in1: Has overflow - saving split1 and creating child mothers');
      console.log('⚠️ 2in1: Total splits:', nSplitResult.totalSplits);
      console.log('⚠️ 2in1: Split1 text length:', nSplitResult.textSplits[0]?.length || 0);
      console.log('⚠️ 2in1: Split1 preview:', nSplitResult.textSplits[0]?.substring(0, 100));

      // CRITICAL: Use BOTH onSave AND direct data update to ensure text is saved
      // Set skip flag to prevent overflow trigger
      (window as any).__skip2in1OverflowTrigger = true;

      // Save split1 using the proper save mechanism
      const split1Config = {
        ...config,
        textContent: {
          ...config.textContent,
          originalText: nSplitResult.textSplits[0],
          generatedText: nSplitResult.textSplits[0]
        }
      };

      console.log('✅ 2in1: Calling onSave with split1 text');
      onSave(split1Config);

      // DIRECT DATA UPDATE: Ensure text is actually saved to parent region
      const directUpdateData = (window as any).currentAppData;
      if (directUpdateData && directUpdateData.objects) {
        const directParent = directUpdateData.objects.find((obj: any) =>
          obj.regions && obj.regions.some((region: any) => region.id === regionId)
        );

        if (directParent) {
          const directRegion = directParent.regions.find((r: any) => r.id === regionId);
          if (directRegion) {
            const directContent = directRegion.contents?.find((c: any) => c.type === 'new-comp-trans');
            if (directContent) {
              // Directly update the text in global data
              directContent.newCompTransConfig.textContent.originalText = nSplitResult.textSplits[0];
              directContent.newCompTransConfig.textContent.generatedText = nSplitResult.textSplits[0];

              // Force update
              if ((window as any).updateAppData) {
                (window as any).updateAppData(directUpdateData);
              }

              console.log('✅ 2in1: Direct data update completed');
            }
          }
        }
      }

      // Wait for save to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear skip flag
      delete (window as any).__skip2in1OverflowTrigger;

      // VERIFICATION: Check if parent has split1
      const verifyAfterSave = (window as any).currentAppData;
      if (verifyAfterSave && verifyAfterSave.objects) {
        const verifyParent = verifyAfterSave.objects.find((obj: any) =>
          obj.regions && obj.regions.some((region: any) => region.id === regionId)
        );

        if (verifyParent) {
          const verifyRegion = verifyParent.regions.find((r: any) => r.id === regionId);
          const verifyContent = verifyRegion?.contents?.find((c: any) => c.type === 'new-comp-trans');
          const verifyText = verifyContent?.newCompTransConfig?.textContent?.generatedText;

          console.log('🔍 2in1 VERIFY AFTER SAVE:', {
            parentName: verifyParent.name,
            savedTextLength: verifyText?.length || 0,
            savedTextPreview: verifyText?.substring(0, 100),
            expectedLength: nSplitResult.textSplits[0].length,
            matches: verifyText === nSplitResult.textSplits[0]
          });

          if (!verifyText || verifyText.length === 0) {
            console.error('❌ 2in1 CRITICAL: Parent text is EMPTY after save!');
            alert('ERROR: Failed to save split1 text to parent');
            return;
          }

          if (verifyText !== nSplitResult.textSplits[0]) {
            console.error('❌ 2in1 CRITICAL: Parent text does not match split1!');
            console.error('Expected:', nSplitResult.textSplits[0].substring(0, 100));
            console.error('Got:', verifyText?.substring(0, 100));
            alert('ERROR: Parent text mismatch after save');
            return;
          }

          console.log('✅ 2in1: Parent text verified successfully');
        } else {
          console.error('❌ 2in1: Could not find parent for verification');
          alert('ERROR: Could not verify parent after save');
          return;
        }
      }

      // STEP 5: Create child mothers
      console.log(`🏗️ 2in1: Creating ${nSplitResult.totalSplits - 1} child mothers...`);

      // VERIFICATION: Confirm clean state before child creation
      const preCreateData = (window as any).currentAppData;
      if (preCreateData && preCreateData.objects) {
        const allMothers = preCreateData.objects
          .filter((obj: any) => obj.type?.includes('mother'))
          .map((obj: any) => ({ name: obj.name, isChild: obj.isOverflowChild, hasText: !!obj.regions?.[0]?.contents?.[0]?.newCompTransConfig?.textContent?.generatedText }));

        console.log('🔍 2in1 PRE-CREATE VERIFICATION: All mothers before child creation:', allMothers);

        const parentForVerify = preCreateData.objects.find((obj: any) =>
          obj.regions && obj.regions.some((region: any) => region.id === regionId)
        );

        if (parentForVerify) {
          const parentRegion = parentForVerify.regions.find((r: any) => r.id === regionId);
          const parentContent = parentRegion?.contents?.find((c: any) => c.type === 'new-comp-trans');
          const parentText = parentContent?.newCompTransConfig?.textContent?.generatedText;

          console.log('🔍 2in1 PRE-CREATE PARENT TEXT:', {
            parent: parentForVerify.name,
            textLength: parentText?.length || 0,
            textPreview: parentText?.substring(0, 100),
            hasChildren: parentForVerify.childMotherIds?.length || 0
          });
        }
      }

      // Find parent mother for child creation
      const globalData = (window as any).currentAppData;
      let parentMotherIdForCreation = 'Mother_1';
      if (globalData && globalData.objects) {
        for (const obj of globalData.objects) {
          if (obj.type?.includes('mother') && obj.regions) {
            for (const region of obj.regions) {
              if (region.id === regionId) {
                parentMotherIdForCreation = obj.name;
                break;
              }
            }
            if (parentMotherIdForCreation !== 'Mother_1') break;
          }
        }
      }

      const createdChildMotherIds: string[] = [];

      // Create child mothers sequentially
      for (let i = 1; i < nSplitResult.totalSplits; i++) {
        console.log(`🏗️ 2in1: Creating child mother ${i}/${nSplitResult.totalSplits - 1}`);

        let childMotherId: string | null = null;

        if (createChildMother) {
          try {
            childMotherId = createChildMother(parentMotherIdForCreation);

            if (childMotherId) {
              console.log(`✅ 2in1: Child mother created: ${childMotherId}`);
              createdChildMotherIds.push(childMotherId);
              (window as any).lastCreatedChildId = childMotherId;

              // CHECK-BASED: Wait until child is actually ready in app data
              console.log(`🔍 2in1: Checking if ${childMotherId} is ready...`);
              let checkCount = 0;
              let childIsReady = false;

              while (!childIsReady && checkCount < 50) { // Max 50 checks = 10 seconds
                const checkData = (window as any).currentAppData;
                if (checkData && checkData.objects) {
                  const childMother = checkData.objects.find((obj: any) => obj.name === childMotherId);

                  if (childMother && childMother.regions && childMother.regions.length > 0 && childMother.regions[0].id) {
                    console.log(`✅ 2in1: ${childMotherId} is ready! (check ${checkCount + 1})`);
                    childIsReady = true;
                    break;
                  }
                }

                checkCount++;
                await new Promise(resolve => setTimeout(resolve, 200)); // Small polling interval
              }

              if (!childIsReady) {
                console.error(`❌ 2in1: ${childMotherId} not ready after ${checkCount} checks`);
              }
            } else {
              console.error(`❌ 2in1: Failed to create child mother ${i}`);
              alert(`Error: Failed to create child mother ${i}`);
              return;
            }
          } catch (error) {
            console.error(`❌ 2in1: Exception creating child mother ${i}:`, error);
            alert(`Error: Failed to create child mother ${i}: ${error}`);
            return;
          }
        } else {
          console.error('❌ 2in1: createChildMother function not available');
          alert('Error: createChildMother function not available');
          return;
        }
      }

      console.log(`✅ 2in1: Created ${createdChildMotherIds.length} child mothers:`, createdChildMotherIds);

      // STEP 7: Distribute text to child mothers
      console.log(`📤 2in1 - STEP 7: Distributing text to ${createdChildMotherIds.length} child mothers`);

      for (let i = 0; i < createdChildMotherIds.length; i++) {
        const childMotherId = createdChildMotherIds[i];
        const splitIndex = i + 1; // Split 0 = parent, Split 1+ = children
        const textForChild = nSplitResult.textSplits[splitIndex] || '';

        console.log(`📤 2in1: Assigning split ${splitIndex + 1} to ${childMotherId} (${textForChild.length} chars)`);

        if (onCreateNewMother && childMotherId && textForChild) {
          // CHECK-BASED: Verify child is ready before assigning text
          console.log(`🔍 2in1: Verifying ${childMotherId} before text assignment...`);

          // Quick check - child should already be ready from creation phase
          const checkData = (window as any).currentAppData;
          const childMother = checkData?.objects?.find((obj: any) => obj.name === childMotherId);

          if (!childMother || !childMother.regions || childMother.regions.length === 0) {
            console.error(`❌ 2in1: Child ${childMotherId} not ready for text assignment`);
            alert(`Error: Child ${childMotherId} not ready for content`);
            continue;
          }

          console.log(`✅ 2in1: ${childMotherId} verified, assigning text...`);

          // Assign text to child
          onCreateNewMother(childMotherId, textForChild);
          console.log(`✅ 2in1: Text assigned to ${childMotherId}`);

          // CHECK-BASED: Verify text was actually assigned
          let textVerified = false;
          let verifyCount = 0;

          while (!textVerified && verifyCount < 25) { // Max 25 checks = 5 seconds
            const verifyData = (window as any).currentAppData;
            if (verifyData && verifyData.objects) {
              const verifyChild = verifyData.objects.find((obj: any) => obj.name === childMotherId);
              if (verifyChild && verifyChild.regions && verifyChild.regions[0]) {
                const region = verifyChild.regions[0];
                const ctContent = region.contents?.find((c: any) => c.type === 'new-comp-trans');
                if (ctContent && ctContent.newCompTransConfig?.textContent?.generatedText) {
                  const assignedText = ctContent.newCompTransConfig.textContent.generatedText;
                  console.log(`✅ 2in1: Verified ${childMotherId} has text (${assignedText.length} chars) - check ${verifyCount + 1}`);
                  textVerified = true;
                  break;
                }
              }
            }

            verifyCount++;
            await new Promise(resolve => setTimeout(resolve, 200)); // Small polling interval
          }

          if (!textVerified) {
            console.warn(`⚠️ 2in1: Could not verify text in ${childMotherId} after ${verifyCount} checks`);
          }
        } else {
          console.error(`❌ 2in1: Cannot assign text to ${childMotherId}`);
          alert(`Error: Cannot assign text to ${childMotherId}`);
          return;
        }
      }

      console.log('🎉 2in1: Complete! Parent + children created with text distributed');

      // FINAL VERIFICATION: Show complete state
      const finalData = (window as any).currentAppData;
      if (finalData && finalData.objects) {
        console.log('🏁 2in1: FINAL CHECK - What mothers exist on canvas?');
        const allFinalMothers = finalData.objects
          .filter((obj: any) => obj.type?.includes('mother'))
          .map((obj: any) => {
            const region = obj.regions?.[0];
            const content = region?.contents?.find((c: any) => c.type === 'new-comp-trans');
            const text = content?.newCompTransConfig?.textContent?.generatedText;
            return {
              name: obj.name,
              isChild: obj.isOverflowChild,
              parentId: obj.parentMotherId,
              textLength: text?.length || 0,
              textPreview: text?.substring(0, 60)
            };
          });

        console.log('🏁 2in1 FINAL STATE: All mothers with their text:', allFinalMothers);
        console.log('🏁 2in1: Total mothers count:', allFinalMothers.length);
        allFinalMothers.forEach((mother: any) => {
          console.log(`🏁 2in1: # ${mother.name} (child: ${mother.isChild}, parent: ${mother.parentId}, text: ${mother.textLength} chars)`);
        });

        console.log('UNIQUE_2IN1_FINAL_RESULT:', JSON.stringify({
          totalMothers: allFinalMothers.length,
          motherNames: allFinalMothers.map((m: any) => m.name),
          childMothers: allFinalMothers.filter((m: any) => m.isChild).map((m: any) => m.name)
        }));

        // CRITICAL: Force complete canvas refresh to remove ghost mothers
        console.log('🎨 2in1: Forcing FINAL canvas refresh to remove ghost visuals...');

        // Method 1: Force app data update
        if ((window as any).updateAppData) {
          (window as any).updateAppData(finalData);
          console.log('🎨 2in1: Final updateAppData() called');
        }

        // Method 2: Multiple refresh calls
        if ((window as any).refreshCanvas) {
          (window as any).refreshCanvas();
          await new Promise(resolve => setTimeout(resolve, 100));
          (window as any).refreshCanvas();
          console.log('🎨 2in1: Final refreshCanvas() called 2x');
        }

        // Method 3: Force window resize
        window.dispatchEvent(new Event('resize'));
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify parent has split1
        const finalParent = finalData.objects.find((obj: any) =>
          obj.regions && obj.regions.some((region: any) => region.id === regionId)
        );

        if (finalParent) {
          const finalParentRegion = finalParent.regions.find((r: any) => r.id === regionId);
          const finalParentContent = finalParentRegion?.contents?.find((c: any) => c.type === 'new-comp-trans');
          const finalParentText = finalParentContent?.newCompTransConfig?.textContent?.generatedText;

          console.log('🏁 2in1 FINAL PARENT:', {
            name: finalParent.name,
            textLength: finalParentText?.length || 0,
            textPreview: finalParentText?.substring(0, 100),
            expectedSplit1Length: nSplitResult.textSplits[0]?.length || 0,
            textMatches: finalParentText === nSplitResult.textSplits[0]
          });

          if (finalParentText !== nSplitResult.textSplits[0]) {
            console.error('❌ 2in1 VERIFICATION FAILED: Parent text does not match split1!');
            console.error('Expected:', nSplitResult.textSplits[0]?.substring(0, 100));
            console.error('Got:', finalParentText?.substring(0, 100));
          }
        }
      }

      setTimeout(() => onCancel(), 1000);

    } catch (error) {
      console.error('❌ 2in1: Error:', error);
      alert(`2in1 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    console.log(`🔧 ${DIALOG_VERSION}: Starting handleSave function`);
    console.log(`🔧 ${DIALOG_VERSION}: Current config text:`, config.textContent.generatedText?.substring(0, 50) || 'NO TEXT');
    console.log(`🔧 ${DIALOG_VERSION}: Current config text length:`, config.textContent.generatedText?.length || 0);

    // 🔧 FIX: Check if current text is a simple placeholder - if so, auto-generate first
    let currentText = config.textContent.generatedText || config.textContent.originalText || '';
    const isSimplePlaceholder = currentText.trim().length < 10 && /^[\d\s%]*$/.test(currentText.trim());

    if (isSimplePlaceholder) {
      console.log('🔧 SAVE FIX: Current text is placeholder "' + currentText + '" - auto-generating from materials');
      const generatedText = generateTextContent();
      console.log('🔧 SAVE FIX: Generated text length:', generatedText.length);

      // Update config with generated text before overflow detection
      setConfig(prev => ({
        ...prev,
        textContent: {
          ...prev.textContent,
          generatedText,
          originalText: generatedText
        }
      }));

      // Important: We need to use the generated text for overflow detection
      // Create a temporary config with the generated text
      const tempConfig = {
        ...config,
        textContent: {
          ...config.textContent,
          generatedText,
          originalText: generatedText
        }
      };

      // Store temp config for detectOverflowAndSplit to use
      (window as any).__tempConfigForSave = tempConfig;
    }

    // Always check for overflow to provide user feedback
    const overflowResult = detectOverflowAndSplit();

    // Clear temp config
    delete (window as any).__tempConfigForSave;
    console.log(`🔧 ${DIALOG_VERSION}: Overflow result:`, {
      hasOverflow: overflowResult.hasOverflow,
      originalTextLength: overflowResult.originalText?.length || 0,
      overflowTextLength: overflowResult.overflowText?.length || 0
    });

    if (overflowResult.hasOverflow) {
      // 🌊 AUTOMATIC OVERFLOW HANDLING - Use the proper callback
      console.log('🔄 Automatic overflow detected - creating new mother...');
      console.log('📊 Overflow details:', {
        originalTextLength: overflowResult.originalText.length,
        overflowTextLength: overflowResult.overflowText.length,
        hasOverflowLines: overflowResult.overflowLines?.length || 0
      });

      // Save SPLIT 1 text to the current region (overflowResult.originalText already contains the correct SPLIT 1)
      const split1Text = overflowResult.originalText; // This already contains SPLIT 1 from detectOverflowAndSplit()
      console.log('📝 Saving SPLIT 1 text to parent region:', { split1Length: split1Text.length, overflowLength: overflowResult.overflowText.length });
      
      onSave({
        ...config,
        textContent: {
          ...config.textContent,
          generatedText: split1Text // Save SPLIT 1 text only
        }
      });

      // Use the proper callback to create new mother for overflow
      console.log('🔍 [v2.9.130] Debug onCreateNewMother before call:', {
        hasCallback: !!onCreateNewMother,
        callbackType: typeof onCreateNewMother,
        callback: onCreateNewMother
      });
      
      if (onCreateNewMother) {
        console.log('📞 Calling onCreateNewMother callback with overflow text');
        console.log('📊 Calling with params:', {
          originalLength: overflowResult.originalText.length,
          overflowLength: overflowResult.overflowText.length
        });
        onCreateNewMother(overflowResult.originalText, overflowResult.overflowText);
      } else {
        console.warn('⚠️ onCreateNewMother callback not available - cannot create new mother');
        console.warn('🔍 Available props at error:', Object.keys({ isOpen, regionId, regionWidth, regionHeight, editingContent, existingCompositions, onSave, onCancel, onCreateNewMother }));
      }

      console.log('✅ Overflow handling completed');
      return;
    }

    // No overflow detected - remove existing child mothers and save
    console.log(`✅ ${DIALOG_VERSION}: No overflow detected - checking for child mothers to remove`);
    console.log(`🔍 ${DIALOG_VERSION}: regionId:`, regionId);

    // Check if child mothers exist that should be removed
    const currentAppData = (window as any).currentAppData;
    console.log(`🔍 ${DIALOG_VERSION}: currentAppData exists:`, !!currentAppData);
    console.log(`🔍 ${DIALOG_VERSION}: objects count:`, currentAppData?.objects?.length);

    let hasExistingChildren = false;

    if (currentAppData && currentAppData.objects) {
      console.log(`🔍 ${DIALOG_VERSION}: Entering child mother detection logic`);
      console.log(`🔍 ${DIALOG_VERSION}: Total objects in app data:`, currentAppData.objects.length);
      // Debug all objects
      console.log(`🔍 ${DIALOG_VERSION}: All objects in currentAppData:`);
      currentAppData.objects.forEach((obj: any, index: number) => {
        console.log(`🔍 ${DIALOG_VERSION}: Object ${index}: name=${obj.name}, type=${obj.type}, isOverflowChild=${obj.isOverflowChild}, parentMotherId=${obj.parentMotherId}`);
      });

      // Find parent mother ID - CRITICAL FIX: Extract mother from regionId instead of searching
      console.log(`🔍 ${DIALOG_VERSION}: Looking for parent mother with regionId:`, regionId);

      // SAFE METHOD: Extract mother name directly from regionId pattern
      let parentMotherIdForSave = 'Mother_1'; // default fallback
      if (regionId) {
        // Pattern examples: "region_xxx_master_3_slice_xxx" -> "Mother_3"
        if (regionId.includes('master_3')) {
          parentMotherIdForSave = 'Mother_3';
        } else if (regionId.includes('master_2')) {
          parentMotherIdForSave = 'Mother_2';
        } else if (regionId.includes('master_1') || regionId.includes('region_1758546413161_0')) {
          parentMotherIdForSave = 'Mother_1';
        }
        // Add more patterns as needed...
      }

      console.log(`🔍 CODE_FIX_01: SAFE EXTRACTION - parentMotherIdForSave:`, parentMotherIdForSave);

      // Verify the parent actually exists
      const parentMother = currentAppData.objects.find((obj: any) => obj.name === parentMotherIdForSave);
      console.log(`🔍 ${DIALOG_VERSION}: parentMother verified:`, !!parentMother);

      if (parentMother) {
        console.log(`🔍 ${DIALOG_VERSION}: Parent mother details:`, {
          name: parentMother.name,
          type: parentMother.type,
          childMotherIds: (parentMother as any)?.childMotherIds || []
        });
      }

      // Check for existing child mothers using multiple detection methods
      // Method 1: Check individual child properties (isOverflowChild && parentMotherId)
      const existingChildMothers = currentAppData.objects.filter((obj: any) =>
        obj.isOverflowChild && obj.parentMotherId === parentMotherIdForSave
      );

      // Method 2: Check parent's childMotherIds array (fallback method)
      const parentChildMotherIds = (parentMother as any)?.childMotherIds || [];
      const childMothersFromParent = currentAppData.objects.filter((obj: any) =>
        parentChildMotherIds.includes(obj.name)
      );

      // Method 3: Pattern-based detection for any Mother_1A, Mother_1B, etc. related to this parent
      const patternChildMothers = currentAppData.objects.filter((obj: any) =>
        obj.type && obj.type.includes('mother') &&
        obj.name && obj.name !== parentMotherIdForSave &&
        (obj.name.startsWith(parentMotherIdForSave + 'A') ||
         obj.name.startsWith(parentMotherIdForSave + 'B') ||
         obj.name.startsWith(parentMotherIdForSave + 'C') ||
         obj.name.match(new RegExp(`^${parentMotherIdForSave}[A-Z]$`)))
      );

      // Method 4: Check for overflow children of THIS SPECIFIC parent only (not aggressive cleanup)
      const allOverflowChildren = currentAppData.objects.filter((obj: any) =>
        obj.isOverflowChild === true && obj.parentMotherId === parentMotherIdForSave
      );

      // Combine all methods and remove duplicates
      const allChildMothers = [...existingChildMothers];
      [...childMothersFromParent, ...patternChildMothers, ...allOverflowChildren].forEach((child: any) => {
        if (!allChildMothers.find((existing: any) => existing.name === child.name)) {
          allChildMothers.push(child);
        }
      });

      console.log(`🔍 ${DIALOG_VERSION}: existingChildMothers (method 1):`, existingChildMothers.length);
      console.log(`🔍 ${DIALOG_VERSION}: childMothersFromParent (method 2):`, childMothersFromParent.length);
      console.log(`🔍 ${DIALOG_VERSION}: patternChildMothers (method 3):`, patternChildMothers.length);
      console.log(`🔍 ${DIALOG_VERSION}: allOverflowChildren (method 4):`, allOverflowChildren.length);
      console.log(`🔍 ${DIALOG_VERSION}: allChildMothers (combined):`, allChildMothers.length);
      console.log(`🔍 ${DIALOG_VERSION}: child mother names:`, allChildMothers.map((c: any) => c.name));

      hasExistingChildren = allChildMothers.length > 0;

      if (hasExistingChildren) {
        console.log(`🗑️ REMOVE_DEBUG: Removing ${allChildMothers.length} child mothers (no longer needed)`);
        console.log('🗑️ REMOVE_DEBUG: Child mothers to remove:', allChildMothers.map((c: any) => c.name));

        // Remove child mothers from global data using all detected child mother names
        const childMotherNamesToRemove = allChildMothers.map((c: any) => c.name);
        const updatedObjects = currentAppData.objects.filter((obj: any) =>
          !childMotherNamesToRemove.includes(obj.name)
        );

        console.log('🗑️ REMOVE_DEBUG: Objects before removal:', currentAppData.objects.length);
        console.log('🗑️ REMOVE_DEBUG: Objects after removal:', updatedObjects.length);
        console.log('🗑️ REMOVE_DEBUG: Remaining object names:', updatedObjects.map((o: any) => o.name));

        // Also clear the parent's childMotherIds array
        if (parentMother && (parentMother as any).childMotherIds) {
          console.log('🗑️ REMOVE_DEBUG: Clearing parent childMotherIds array');
          (parentMother as any).childMotherIds = [];
        }

        const newData = {
          ...currentAppData,
          objects: updatedObjects,
          totalObjects: updatedObjects.length,
          document: currentAppData.document || '',
          layoutName: currentAppData.layoutName || ''
        };

        // Update global app data
        if ((window as any).updateAppData) {
          (window as any).updateAppData(newData);
          console.log('🗑️ REMOVE_DEBUG: Global app data updated');

          // Additional cleanup - remove from region contents if it exists
          // NOTE: Removed problematic updateRegionContents() call without parameters
          // This was corrupting the regionContents Map by adding undefined keys
          console.log('🗑️ REMOVE_DEBUG: Skipping region contents update (no specific region to update)');

          // Force canvas refresh with all possible methods
          console.log('🗑️ REMOVE_DEBUG: Attempting comprehensive canvas refresh');

          // Method 1: Standard canvas refresh
          if ((window as any).refreshCanvas) {
            console.log('🗑️ REMOVE_DEBUG: Method 1 - refreshCanvas');
            (window as any).refreshCanvas();
          }

          // Method 2: Force update
          if ((window as any).forceUpdate) {
            console.log('🗑️ REMOVE_DEBUG: Method 2 - forceUpdate');
            (window as any).forceUpdate();
          }

          // Method 3: Trigger window resize
          console.log('🗑️ REMOVE_DEBUG: Method 3 - window resize event');
          window.dispatchEvent(new Event('resize'));

          // Method 4: Re-trigger app data update
          console.log('🗑️ REMOVE_DEBUG: Method 4 - re-trigger updateAppData');
          (window as any).updateAppData(newData);

          // Method 5: Force React state update
          if ((window as any).setState) {
            console.log('🗑️ REMOVE_DEBUG: Method 5 - setState');
            (window as any).setState({});
          }

          // Method 6: Delayed comprehensive refresh
          setTimeout(() => {
            console.log('🗑️ REMOVE_DEBUG: Method 6 - delayed comprehensive refresh');
            if ((window as any).refreshCanvas) {
              (window as any).refreshCanvas();
            }
            if ((window as any).updateAppData) {
              (window as any).updateAppData(newData);
            }
            // Trigger another resize
            window.dispatchEvent(new Event('resize'));
          }, 200);
        } else {
          console.log('🗑️ REMOVE_DEBUG: ERROR - updateAppData function not available!');
        }
      } else {
        console.log(`🔍 ${DIALOG_VERSION}: No child mothers found to remove`);
      }
    } else {
      console.log(`🔍 ${DIALOG_VERSION}: No currentAppData or objects - skipping child mother check`);
    }

    console.log(`✅ ${DIALOG_VERSION}: Saving content to parent` + (hasExistingChildren ? ' (child mothers removed)' : ''));
    onSave(config);
  };

  // One-click runner: executes the same 4 manual debug steps sequentially without extra clicks
  const handleRunFourSteps = async () => {
    try {
      console.log('🔗 One-Click 4-Step: Start');
      // Step 1: Calculate splits
      const overflowResult = detectOverflowAndSplit();
      const stepSplit1 = overflowResult.originalText || '';
      const stepSplit2 = overflowResult.overflowText || '';
      setSplit1Text(stepSplit1);
      setSplit2Text(stepSplit2);
      setDebugStep(1);

      // Step 2: Fill SPLIT 1 in parent and save without closing the dialog
      const parentConfig = {
        ...config,
        textContent: { ...config.textContent, generatedText: stepSplit1 }
      };
      (window as any).debugModeActive = true;
      onSave(parentConfig);
      console.log('🔗 One-Click 4-Step: Saved SPLIT 1 to parent');
      setDebugStep(2);

      // Small delay to allow parent render/state to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Duplicate mother using provided callback with both splits
      if (onCreateNewMother) {
        onCreateNewMother(stepSplit1, stepSplit2);
        console.log('🔗 One-Click 4-Step: Requested child creation with SPLIT 2');
      } else {
        console.warn('⚠️ One-Click 4-Step: onCreateNewMother unavailable');
      }
      setDebugStep(3);

      // Step 4: Finalize - child replace happens in parent flow
      await new Promise(resolve => setTimeout(resolve, 300));
      setDebugStep(4);
      (window as any).debugModeActive = false;
      console.log('✅ One-Click 4-Step: Completed');
    } catch (err) {
      console.error('❌ One-Click 4-Step failed:', err);
      (window as any).debugModeActive = false;
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  // Legacy functions removed - now using automatic overflow handling

  const handleLanguageToggle = (languageCode: string) => {
    setConfig(prev => {
      const currentLanguages = prev.selectedLanguages || [];
      return {
        ...prev,
        selectedLanguages: currentLanguages.includes(languageCode)
          ? currentLanguages.filter(code => code !== languageCode)
          : [...currentLanguages, languageCode]
      };
    });
  };

  const handleSelectAllLanguages = () => {
    setConfig(prev => ({
      ...prev,
      selectedLanguages: availableLanguages.map(lang => lang.code)
    }));
  };

  const handleDeselectAllLanguages = () => {
    setConfig(prev => ({
      ...prev,
      selectedLanguages: []
    }));
  };

  return (
    <>
    <MovableDialog
      isOpen={isOpen}
      title="Composition Translation Settings"
      icon="🌐"
      width="1000px"
      storageKey="comp-trans-dialog"
      onClose={handleCancel}
    >
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
        Region: {regionId} ({regionWidth}×{regionHeight}mm)
      </div>

        {/* Row 1: 3 Columns - Padding | Alignment | Typography */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Column 1: Padding Section */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              📏 Padding (mm)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Left:
                </label>
                <input
                  type="number"
                  value={config.padding.left}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    padding: { ...prev.padding, left: parseFloat(e.target.value) || 0 }
                  }))}
                  style={{
                    width: '100%',
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Top:
                </label>
                <input
                  type="number"
                  value={config.padding.top}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    padding: { ...prev.padding, top: parseFloat(e.target.value) || 0 }
                  }))}
                  style={{
                    width: '100%',
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Right:
                </label>
                <input
                  type="number"
                  value={config.padding.right}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    padding: { ...prev.padding, right: parseFloat(e.target.value) || 0 }
                  }))}
                  style={{
                    width: '100%',
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                  Bottom:
                </label>
                <input
                  type="number"
                  value={config.padding.bottom}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    padding: { ...prev.padding, bottom: parseFloat(e.target.value) || 0 }
                  }))}
                  style={{
                    width: '100%',
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Alignment Section */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              📐 Alignment
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Left Side - Horizontal Alignment */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '500' }}>
                  Horizontal:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <input
                      type="radio"
                      name="horizontal"
                      value="left"
                      checked={config.alignment.horizontal === 'left'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                      }))}
                      style={{ margin: 0 }}
                    />
                    Left
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <input
                      type="radio"
                      name="horizontal"
                      value="center"
                      checked={config.alignment.horizontal === 'center'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                      }))}
                      style={{ margin: 0 }}
                    />
                    Center
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <input
                      type="radio"
                      name="horizontal"
                      value="right"
                      checked={config.alignment.horizontal === 'right'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, horizontal: e.target.value as 'left' | 'center' | 'right' }
                      }))}
                      style={{ margin: 0 }}
                    />
                    Right
                  </label>
                </div>
              </div>

              {/* Right Side - Vertical Alignment */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '500' }}>
                  Vertical:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <input
                      type="radio"
                      name="vertical"
                      value="top"
                      checked={config.alignment.vertical === 'top'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                      }))}
                      style={{ margin: 0 }}
                    />
                    Top
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <input
                      type="radio"
                      name="vertical"
                      value="center"
                      checked={config.alignment.vertical === 'center'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                      }))}
                      style={{ margin: 0 }}
                    />
                    Center
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <input
                      type="radio"
                      name="vertical"
                      value="bottom"
                      checked={config.alignment.vertical === 'bottom'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        alignment: { ...prev.alignment, vertical: e.target.value as 'top' | 'center' | 'bottom' }
                      }))}
                      style={{ margin: 0 }}
                    />
                    Bottom
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Typography Section */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              ✏️ Typography
            </h3>
          
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                Font Family:
              </label>
              <select
                value={config.typography.fontFamily}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontFamily: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '500' }}>
                Font Size:
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  value={config.typography.fontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    typography: { ...prev.typography, fontSize: parseFloat(e.target.value) || 10 }
                  }))}
                  style={{
                    flex: 1,
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  step="0.1"
                  min="1"
                />
                <select
                  value={config.typography.fontSizeUnit}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    typography: { ...prev.typography, fontSizeUnit: e.target.value }
                  }))}
                  style={{
                    padding: '4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px',
                    minWidth: '45px'
                  }}
                >
                  <option value="px">px</option>
                  <option value="pt">pt</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Language Selection from Composition Table */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🌐 Translation Languages ({(config.selectedLanguages || []).length} selected)
          </h3>

          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSelectAllLanguages}
              style={{
                padding: '6px 12px',
                border: '1px solid #007bff',
                borderRadius: '4px',
                backgroundColor: '#007bff',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAllLanguages}
              style={{
                padding: '6px 12px',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                backgroundColor: '#dc3545',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Deselect All
            </button>
          </div>

          {/* Multi-select Language Checkboxes - 18 Languages in Grid */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#fafafa',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {availableLanguages.map(language => (
                <label
                  key={language.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: (config.selectedLanguages || []).includes(language.code) ? '#e3f2fd' : 'white',
                    borderColor: (config.selectedLanguages || []).includes(language.code) ? '#2196f3' : '#ddd',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(config.selectedLanguages || []).includes(language.code)}
                    onChange={() => handleLanguageToggle(language.code)}
                    style={{ margin: 0, transform: 'scale(0.9)' }}
                  />
                  <span style={{ fontWeight: '600', marginRight: '4px' }}>{language.code}</span>
                  <span>{language.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selected Languages Display */}
          {(config.selectedLanguages || []).length > 0 && (
            <div style={{
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#666' }}>
                Selected Languages:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(config.selectedLanguages || []).map(langCode => {
                  const language = availableLanguages.find(l => l.code === langCode);
                  return language ? (
                    <span
                      key={langCode}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {language.code} {language.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Material Composition Section */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>Material Composition: ({getTotalPercentage()}%)</span>
                {getTotalPercentage() !== 100 && (
                  <span style={{
                    fontSize: '11px',
                    color: '#dc3545',
                    fontWeight: '500',
                    backgroundColor: '#f8d7da',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    border: '1px solid #f5c6cb'
                  }}>
                    Total must equal 100% (currently {getTotalPercentage()}%)
                  </span>
                )}
              </div>
              <button
                onClick={addMaterialComposition}
                disabled={!canAddMore()}
                style={{
                  padding: '4px 8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '1px solid #007bff',
                  borderRadius: '4px',
                  backgroundColor: canAddMore() ? '#007bff' : '#ccc',
                  color: canAddMore() ? 'white' : '#666',
                  cursor: canAddMore() ? 'pointer' : 'not-allowed'
                }}
              >
                +
              </button>
            </div>

            {/* Duplicate Materials Warning */}
            {hasDuplicateMaterials() && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>🚫</span>
                <span style={{
                  fontSize: '12px',
                  color: '#721c24',
                  fontWeight: '500'
                }}>
                  Cannot use the same material multiple times. Please choose different materials.
                </span>
              </div>
            )}

            {/* Duplicate Composition Warning */}
            {!hasDuplicateMaterials() && isCompositionAlreadyUsed() && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span style={{
                  fontSize: '12px',
                  color: '#856404',
                  fontWeight: '500'
                }}>
                  These materials are already used in another region. Please choose different materials.
                </span>
              </div>
            )}

            {/* Dynamic Material Composition Rows */}
            {config.materialCompositions.map((composition, index) => (
              <div key={composition.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr auto',
                gap: '12px',
                marginBottom: index < config.materialCompositions.length - 1 ? '12px' : '0',
                alignItems: 'end'
              }}>
                {/* Percentage Input */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    Percentage (%):
                  </label>
                  <input
                    type="number"
                    value={composition.percentage}
                    onChange={(e) => updateMaterialComposition(composition.id, 'percentage', e.target.value)}
                    disabled={areInputsDisabled()}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: areInputsDisabled() ? '#f5f5f5' : 'white'
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>

                {/* Material Dropdown */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    Material Element:
                  </label>
                  <select
                    value={composition.material}
                    onChange={(e) => updateMaterialComposition(composition.id, 'material', e.target.value)}
                    disabled={areInputsDisabled()}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: areInputsDisabled() ? '#f5f5f5' : 'white'
                    }}
                  >
                    <option value="">Select material...</option>
                    {/* Show current material if already selected */}
                    {composition.material && !getAvailableMaterials().includes(composition.material) && (
                      <option key={composition.material} value={composition.material}>
                        {composition.material} (selected)
                      </option>
                    )}
                    {/* Show available materials */}
                    {getAvailableMaterials().map(material => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove Button */}
                <div>
                  {config.materialCompositions.length > 1 && (
                    <button
                      onClick={() => removeMaterialComposition(composition.id)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '12px',
                        border: '1px solid #dc3545',
                        borderRadius: '4px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Line Break Settings Section */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#333'
              }}>
                Line Break Settings:
              </div>
              <button
                type="button"
                onClick={() => {
                  // Order Variable functionality for multiple line settings - placeholder for now
                  console.log('Order Variable clicked for Line Break Settings');
                }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #007bff',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔄 Order Variable
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {/* Line Break Symbol */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  Line Break Symbol:
                </label>
                <select
                  value={config.lineBreakSettings?.lineBreakSymbol || '\n'}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    lineBreakSettings: {
                      ...(prev.lineBreakSettings || {}),
                      lineBreakSymbol: e.target.value
                    }
                  }))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  {lineBreakSymbols.map(symbol => (
                    <option key={symbol.value} value={symbol.value}>
                      {symbol.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Spacing */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  Line Spacing:
                </label>
                <input
                  type="number"
                  value={config.lineBreakSettings?.lineSpacing || 1.2}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    lineBreakSettings: {
                      ...(prev.lineBreakSettings || {}),
                      lineSpacing: parseFloat(e.target.value) || 1.0
                    }
                  }))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  min="0.5"
                  max="3.0"
                  step="0.1"
                />
              </div>

              {/* Line Width */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  Line Width (%):
                </label>
                <input
                  type="number"
                  value={config.lineBreakSettings?.lineWidth || 100}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    lineBreakSettings: {
                      ...(prev.lineBreakSettings || {}),
                      lineWidth: parseInt(e.target.value) || 100
                    }
                  }))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  min="10"
                  max="100"
                  step="5"
                />
              </div>
            </div>
          </div>

          {/* Text Content Section */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#333'
              }}>
                Text Content:
              </div>
              <button
                type="button"
                onClick={() => {
                  // Order Variable functionality - placeholder for now
                  console.log('Order Variable clicked');
                }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #007bff',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔄 Order Variable
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px' }}>
              {/* Separator Input */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  Separator:
                </label>
                <input
                  type="text"
                  value={config.textContent.separator}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    textContent: {
                      ...prev.textContent,
                      separator: e.target.value
                    }
                  }))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  placeholder="e.g., ' - '"
                />
              </div>

              {/* Generated Text Display */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    Text Value:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const generatedText = generateTextContent();
                      setConfig(prev => ({
                        ...prev,
                        textContent: {
                          ...prev.textContent,
                          generatedText,
                          originalText: generatedText
                        }
                      }));
                      setIsTextManuallyEdited(false);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    📝 Generate from Materials
                  </button>
                </div>
                <textarea
                  value={config.textContent.originalText || config.textContent.generatedText}
                  onChange={(e) => {
                    console.log(`🔧 ${DIALOG_VERSION}: User inputted text:`, e.target.value);
                    console.log(`🔧 ${DIALOG_VERSION}: Text length:`, e.target.value.length);

                    // 🔧 FIX: Check if user typed a simple placeholder value
                    const inputValue = e.target.value.trim();
                    const isSimplePlaceholder = inputValue.length < 10 && /^[\d\s%]*$/.test(inputValue);

                    // Only set manual edit flag if it's NOT a simple placeholder
                    // This allows auto-generation to trigger when user types "1", "100%", etc.
                    if (!isSimplePlaceholder) {
                      setIsTextManuallyEdited(true);
                    } else {
                      console.log(`🔧 FIX: Detected simple placeholder "${inputValue}" - allowing auto-generation`);
                      setIsTextManuallyEdited(false);
                    }

                    setConfig(prev => ({
                      ...prev,
                      textContent: {
                        ...prev.textContent,
                        generatedText: e.target.value,
                        originalText: e.target.value // Store as original text too
                      }
                    }));
                  }}
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                  placeholder="Enter your custom text here, or use material compositions to auto-generate..."
                />
              </div>
            </div>
          </div>



          {/* Preview Section */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#333'
            }}>
              Preview:
            </div>

            <div style={{
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              minHeight: '100px',
              fontFamily: config.typography.fontFamily,
              fontSize: `${config.typography.fontSize}${config.typography.fontSizeUnit}`,
              lineHeight: config.lineBreakSettings?.lineSpacing || 1.2,
              whiteSpace: 'pre-wrap',
              overflow: 'auto'
            }}>
              {generateWrappedPreview() || 'Preview will appear here based on your material compositions and settings...'}
            </div>

            {/* Debug Info Row */}
            {debugStep > 0 && (split1Text || split2Text) && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#e8f4f8',
                borderRadius: '4px',
                border: '2px solid #0066cc'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#0066cc' }}>
                  🔧 DEBUG: Calculated Splits
                </div>
                {split1Text && (
                  <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                    <strong>SPLIT 1 ({split1Text.length} chars):</strong> {split1Text.substring(0, 80)}...
                  </div>
                )}
                {split2Text && (
                  <div style={{ fontSize: '11px' }}>
                    <strong>SPLIT 2 ({split2Text.length} chars):</strong> {split2Text.substring(0, 80)}...
                  </div>
                )}
                <div style={{ marginTop: '6px', fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                  {debugStep === 1 && '⚠️ Step 2 will close dialog. Reopen to continue.'}
                  {debugStep === 2 && '✅ Dialog stayed open! Continue with Step 3.'}
                  {debugStep === 3 && '✅ Final step - check results on canvas.'}
                  {debugStep === 4 && '🎉 All steps completed! Check both mothers on canvas.'}
                </div>
                <div>
                  <button
                    onClick={() => {
                      setDebugStep(0);
                      setSplit1Text('');
                      setSplit2Text('');
                      (window as any).debugModeActive = false;
                      console.log('🔧 [DEBUG] Reset debug state');
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #0066cc',
                      borderRadius: '3px',
                      backgroundColor: 'white',
                      color: '#0066cc',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Reset Debug
                  </button>
                </div>
              </div>
            )}

            {/* Overflow Handling Row */}
            <div style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: hasOverflow ? '#fff3cd' : '#f8f9fa',
              borderRadius: '4px',
              border: hasOverflow ? '2px solid #ffc107' : '1px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '8px',
                color: hasOverflow ? '#28a745' : '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {hasOverflow ? <span>🌊</span> : <span>✅</span>}
                Overflow: {hasOverflow ? 'TEXT TOO LONG - Will automatically create new mother' : 'No overflow detected'}
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: hasOverflow ? '#e8f5e8' : '#f8f9fa',
                borderRadius: '6px',
                border: hasOverflow ? '2px solid #28a745' : '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: hasOverflow ? '#155724' : '#6c757d'
                }}>
                  <span style={{ fontSize: '16px' }}>
                    {hasOverflow ? '🌊' : '✅'}
                  </span>
                  <span>
                    {hasOverflow
                      ? 'Automatic Overflow Handling Enabled - New mothers will be created seamlessly'
                      : 'Automatic Overflow Protection Active - Ready to create new mothers if needed'
                    }
                  </span>
                </div>
                {hasOverflow && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: '#6c757d',
                    fontStyle: 'italic'
                  }}>
                    💡 When you save, overflow text will automatically flow to a new duplicated mother with identical properties
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {/* Save validation message */}
          {!canSave() && (
            <div style={{
              fontSize: '12px',
              color: '#dc3545',
              fontStyle: 'italic'
            }}>
              {getTotalPercentage() !== 100
                ? `Total must equal 100% (currently ${getTotalPercentage()}%)`
                : hasDuplicateMaterials()
                  ? 'Cannot use the same material multiple times'
                  : isCompositionAlreadyUsed()
                    ? 'These materials are already used in another region'
                    : 'Cannot save'
              }
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            {/* Save button - Save text and auto-remove child mothers if no overflow */}
            <button
              onClick={handleSave}
              disabled={!canSave()}
              style={{
                padding: '10px 20px',
                border: '2px solid #28a745',
                borderRadius: '6px',
                backgroundColor: canSave() ? '#28a745' : '#ccc',
                color: canSave() ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '600',
                cursor: canSave() ? 'pointer' : 'not-allowed',
                marginRight: '8px'
              }}
              title="Save: Save text content and automatically remove child mothers if no overflow"
            >
              Save
            </button>

            {/* Generate button - Renamed from FF, removes and regenerates all child mothers */}
            <button
              onClick={handleFF}
              disabled={!canSave()}
              style={{
                padding: '12px 24px',
                border: '3px solid #ff6600',
                borderRadius: '8px',
                backgroundColor: canSave() ? '#ff6600' : '#ccc',
                color: canSave() ? 'white' : '#666',
                fontSize: '18px',
                fontWeight: '800',
                cursor: canSave() ? 'pointer' : 'not-allowed',
                boxShadow: canSave() ? '0 3px 6px rgba(255, 102, 0, 0.4)' : 'none',
                textShadow: canSave() ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
              }}
              title="Generate: Execute text splitting and create/regenerate child mothers with overflow content"
            >
              Generate
            </button>

            {/* 2in1 button - Universal handler for both overflow and non-overflow scenarios */}
            <button
              onClick={handle2in1}
              disabled={!canSave()}
              style={{
                padding: '12px 24px',
                border: '3px solid #9c27b0',
                borderRadius: '8px',
                backgroundColor: canSave() ? '#9c27b0' : '#ccc',
                color: canSave() ? 'white' : '#666',
                fontSize: '18px',
                fontWeight: '800',
                cursor: canSave() ? 'pointer' : 'not-allowed',
                boxShadow: canSave() ? '0 3px 6px rgba(156, 39, 176, 0.4)' : 'none',
                textShadow: canSave() ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
              }}
              title="2in1: Universal handler - Uses N-split logic for all cases (N≥1). Always cleans and regenerates."
            >
              2in1
            </button>

            {/* Debug Log Buttons */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { clearNSplitLogs(); }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Clear N-Split debug logs"
              >
                Clear Logs
              </button>

              <button
                onClick={() => { exportNSplitLogs(); }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title="Export N-Split debug logs to console and clipboard"
              >
                Export Logs
              </button>
            </div>
          </div>
        </div>
    </MovableDialog>
  </>
  );
};

export default NewCompTransDialog;
