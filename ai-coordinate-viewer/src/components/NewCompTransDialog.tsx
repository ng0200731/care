import React, { useState, useEffect } from 'react';
import MovableDialog from './MovableDialog';

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
  const [config, setConfig] = useState<NewCompTransConfig>({
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
      generatedText: ''
    },
    lineBreakSettings: {
      lineBreakSymbol: '\n',
      lineSpacing: 1.2,
      lineWidth: 100
    }
    // overflowOption removed - automatic handling enabled
  });

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

  // Canvas-based overflow detection and text splitting (similar to NewMultiLineDialog)
  const detectOverflowAndSplit = () => {
    // Use manually entered text if available, otherwise fall back to generated text
    const text = config.textContent.generatedText || generateTextContent();
    if (!text || !regionWidth || !regionHeight) return { hasOverflow: false, originalText: text, overflowText: '' };

    // Calculate available space in pixels
    const regionWidthPx = regionWidth * 3.779527559; // Convert mm to px (96 DPI)
    const regionHeightPx = regionHeight * 3.779527559;
    const paddingLeftPx = config.padding.left * 3.779527559;
    const paddingRightPx = config.padding.right * 3.779527559;
    const paddingTopPx = config.padding.top * 3.779527559;
    const paddingBottomPx = config.padding.bottom * 3.779527559;

    const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
    const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

    // Convert font size to pixels (CONSISTENT with canvas rendering)
    let fontSizePx = config.typography.fontSize;
    if (config.typography.fontSizeUnit === 'mm') {
      fontSizePx = config.typography.fontSize * 3.779527559;
    } else if (config.typography.fontSizeUnit === 'pt') {
      fontSizePx = (config.typography.fontSize * 4/3);
    }
    
    // Apply zoom scaling for consistency with canvas rendering
    // Note: zoom = 1.0 for standard view, this ensures math consistency
    const zoom = 1.0; // Use standard zoom for consistent mathematical calculations
    const scaledFontSize = Math.max(6, fontSizePx * zoom);

    // Text width estimation using canvas measurement
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2; // Fallback

      context.font = `${scaledFontSize}px ${config.typography.fontFamily}`;
      const textWidthPx = context.measureText(text).width;
      return textWidthPx / 3.779527559; // Convert to mm
    };

    const availableWidthMm = availableWidthPx / 3.779527559;
    const fontSizeMm = fontSizePx / 3.779527559;

    // Word wrapping logic
    const wrapTextToLines = (text: string): string[] => {
      const manualLines = text.split(config.lineBreakSettings.lineBreakSymbol);
      const wrappedLines: string[] = [];

      manualLines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          wrappedLines.push(''); // Preserve empty lines
          return;
        }

        const words = trimmedLine.split(' ');
        let currentLine = '';

        words.forEach((word, index) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = estimateTextWidth(testLine);

          if (testWidth <= availableWidthMm) {
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

    const lines = wrapTextToLines(text);

    // Check for height overflow (using scaled font size for consistency)
    const scaledFontSizeMm = scaledFontSize / 3.779527559;
    const lineHeightMm = scaledFontSizeMm * config.lineBreakSettings.lineSpacing;
    const totalTextHeightMm = lines.length * lineHeightMm;
    const availableHeightMm = availableHeightPx / 3.779527559;
    const hasOverflow = totalTextHeightMm > availableHeightMm;

    if (hasOverflow) {
      const maxVisibleLines = Math.floor(availableHeightMm / lineHeightMm);
      const originalLines = lines.slice(0, maxVisibleLines);
      const overflowLines = lines.slice(maxVisibleLines);

      return {
        hasOverflow: true,
        originalText: originalLines.join(config.lineBreakSettings.lineBreakSymbol),
        overflowText: overflowLines.join(config.lineBreakSettings.lineBreakSymbol),
        overflowLines: overflowLines // Store the actual wrapped lines
      };
    }

    return {
      hasOverflow: false,
      originalText: text,
      overflowText: '',
      overflowLines: []
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

  // Initialize config from editing content or defaults
  const getInitialConfig = (): NewCompTransConfig => {
    if (editingContent && editingContent.newCompTransConfig) {
      // Ensure selectedLanguages exists in existing config
      return {
        ...editingContent.newCompTransConfig,
        selectedLanguages: editingContent.newCompTransConfig.selectedLanguages || ['EN'],
        materialCompositions: editingContent.newCompTransConfig.materialCompositions || [
          { id: '1', percentage: 100, material: 'COTTON' }
        ],
        textContent: editingContent.newCompTransConfig.textContent || {
          separator: ' - ',
          generatedText: ''
        },
        lineBreakSettings: editingContent.newCompTransConfig.lineBreakSettings || {
          lineBreakSymbol: '\n',
          lineSpacing: 1.2,
          lineWidth: 100
        }
        // overflowOption removed - automatic handling
      };
    }

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
        generatedText: ''
      },
      lineBreakSettings: {
        lineBreakSymbol: '\n',
        lineSpacing: 1.2,
        lineWidth: 100
      }
      // overflowOption removed - automatic handling
    };
  };

  useEffect(() => {
    if (isOpen) {
      const initialConfig = getInitialConfig();
      setConfig(initialConfig);
      // overflowOption removed - automatic handling enabled

      // Debug: Check if callback is available
      console.log('🔍 [v2.9.128] NewCompTransDialog opened with callback:', {
        hasOnCreateNewMother: !!onCreateNewMother,
        callbackType: typeof onCreateNewMother
      });
    }
  }, [isOpen, editingContent]);

  // Overflow option sync removed - automatic handling enabled

  // Auto-generate text content when compositions or languages change (only if not manually edited)
  useEffect(() => {
    // Only auto-generate if the user hasn't manually edited the text
    if (!isTextManuallyEdited) {
      const generatedText = generateTextContent();
      setConfig(prev => ({
        ...prev,
        textContent: {
          ...prev.textContent,
          generatedText
        }
      }));

      // Debug: Log the current config when text is generated
      console.log('🔍 DEBUG: Auto-generated text (not manually edited):', {
        lineBreakSettings: config.lineBreakSettings,
        textContent: config.textContent,
        generatedText: generatedText
      });
    } else {
      console.log('🔍 DEBUG: Skipping auto-generation - text was manually edited');
    }
  }, [config.materialCompositions, config.selectedLanguages, config.textContent.separator, isTextManuallyEdited]);

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

          if (testWidth <= availableWidthMm) {
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
  const handle31 = async () => {
    try {
      console.log('🚀 3-1: Creating child mother structure...');

      // Check if we have split texts from previous steps
      if (!split1Text || !split2Text) {
        console.error('❌ 3-1: No split texts available. Please run Step 1 & 2 first.');
        return;
      }

      console.log('🔧 3-1: Creating child mother structure (configuration, size, width, padding, font family, font size, line spacing) with empty region 1');
      
      // Step 3-1: Create child mother structure only
      if (createChildMother) {
        const childMotherId = createChildMother('Mother_1'); // Assuming parent is Mother_1
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
  const handle33 = async () => {
    try {
      console.log('🚀 3-3: Loading SPLIT 2 into child mother CT comp trans...');

      // Check if we have split texts
      if (!split1Text || !split2Text) {
        console.error('❌ 3-3: No split texts available.');
        return;
      }

      // Get the child mother ID from previous step
      const childMotherId = (window as any).lastCreatedChildId;
      if (!childMotherId) {
        console.error('❌ 3-3: No child mother ID found. Please run steps 3-1 and 3-2 first.');
        return;
      }

      console.log(`📝 3-3: SPLIT 2 to load (${split2Text.length} chars):`, split2Text.substring(0, 50) + '...');
      console.log('🔧 3-3: Loading SPLIT 2 into child mother:', childMotherId);

      // Step 3-3: Load SPLIT 2 into the child mother's CT comp trans
      if (onCreateNewMother) {
        onCreateNewMother(childMotherId, split2Text); // Load actual SPLIT 2 content
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

  // NEW: Button "3v2" - Simple combination of 3-1, 3-2, and 3-3 with verification
  const handle3v2 = async () => {
    try {
      console.log('🚀 3v2: Starting simple 3-1 + 3-2 + 3-3 combination...');

      // Check if we have split texts from previous steps
      if (!split1Text || !split2Text) {
        console.error('❌ 3v2: No split texts available. Please run Step 1 & 2 first.');
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
      await handle31();
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
      await handle33();
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🎉 3v2: All steps completed!');

      // Close the dialog
      onCancel();

    } catch (error) {
      console.error('❌ 3v2: Error during execution:', error);
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

  const handleSave = async () => {
    // Always check for overflow to provide user feedback
    const overflowResult = detectOverflowAndSplit();

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
      console.log('🔍 [v2.9.128] Debug onCreateNewMother before call:', {
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

    // No overflow detected - proceed with normal save
    console.log('✅ No overflow detected - saving content normally');
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
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#333'
            }}>
              Line Break Settings:
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
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#333'
            }}>
              Text Content:
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
                          generatedText
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
                  value={config.textContent.generatedText}
                  onChange={(e) => {
                    setIsTextManuallyEdited(true);
                    setConfig(prev => ({
                      ...prev,
                      textContent: {
                        ...prev.textContent,
                        generatedText: e.target.value
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
            
            {/* DEBUG: Step-by-step button */}
            {(hasOverflow || debugStep > 0) && debugStep < 4 && (
              <button
                onClick={handleStepDebug}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #ff6b35',
                  borderRadius: '4px',
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🔧 Step {debugStep + 1}/4: {
                  debugStep === 0 ? 'Calculate Splits' :
                  debugStep === 1 ? 'Fill Parent (SPLIT 1)' :
                  debugStep === 2 ? 'Duplicate Mother' :
                  debugStep === 3 ? 'Replace Child (SPLIT 2)' :
                  'Debug Complete'
                }
              </button>
            )}

            {/* NEW: Button "12" - Combine Step 1 & Step 2 */}
            {hasOverflow && debugStep === 0 && (
              <button
                onClick={handle12}
                disabled={!canSave()}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #007bff',
                  borderRadius: '4px',
                  backgroundColor: canSave() ? '#007bff' : '#ccc',
                  color: canSave() ? 'white' : '#666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: canSave() ? 'pointer' : 'not-allowed'
                }}
                title="Execute Step 1 & 2: Calculate Splits + Fill Parent"
              >
                12
              </button>
            )}

            {/* NEW: Button "34" - Combine Step 3 & Step 4 */}
            {(debugStep === 2 || debugStep === 3) && (split1Text && split2Text) && (
              <button
                onClick={handle34}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #28a745',
                  borderRadius: '4px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Execute Step 3 & 4: Duplicate Mother + Replace Child"
              >
                34
              </button>
            )}

            {/* NEW: Button "3-1" - Create New Mother with Parent Configuration */}
            {debugStep === 2 && (split1Text && split2Text) && (
              <button
                onClick={handle31}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #fd7e14',
                  borderRadius: '4px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Step 3-1: Create New Mother with Parent Configuration"
              >
                3-1
              </button>
            )}

            {/* NEW: Button "3-2" - Place New CT Comp Trans in Region 1 */}
            {debugStep === 2 && (split1Text && split2Text) && (
              <button
                onClick={handle32}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #20c997',
                  borderRadius: '4px',
                  backgroundColor: '#20c997',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Step 3-2: Place New CT Comp Trans in Region 1"
              >
                3-2
              </button>
            )}

            {/* NEW: Button "3-3" - Load SPLIT 2 into New Mother New CT Comp Trans */}
            {debugStep === 2 && (split1Text && split2Text) && (
              <button
                onClick={handle33}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #6f42c1',
                  borderRadius: '4px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Step 3-3: Load SPLIT 2 into New Mother New CT Comp Trans"
              >
                3-3
              </button>
            )}

            {/* NEW: Button "3v2" - Combine 3-1, 3-2, and 3-3 into one action */}
            {(debugStep === 2 || (split1Text && split2Text)) && (
              <button
                onClick={handle3v2}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e83e8c',
                  borderRadius: '4px',
                  backgroundColor: '#e83e8c',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(232, 62, 140, 0.3)'
                }}
                title="Step 3v2: Execute 3-1 + 3-2 + 3-3 Combined (Create Mother + Add CT + Load SPLIT 2)"
              >
                3v2
              </button>
            )}


            {/* NEW: Button "1234" - Combine all 4 steps */}
            {hasOverflow && (
              <button
                onClick={handle1234}
                disabled={!canSave()}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #6f42c1',
                  borderRadius: '6px',
                  backgroundColor: canSave() ? '#6f42c1' : '#ccc',
                  color: canSave() ? 'white' : '#666',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: canSave() ? 'pointer' : 'not-allowed',
                  boxShadow: canSave() ? '0 2px 4px rgba(111, 66, 193, 0.3)' : 'none'
                }}
                title="Execute all 4 steps: Calculate Splits → Fill Parent → Duplicate Mother → Replace Child"
              >
                1234
              </button>
            )}

            {/* NEW: Create button - Execute all 4 manual steps + Save in one click */}
            <button
              onClick={handleCreate}
              disabled={!canSave()}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: canSave() ? '#28a745' : '#ccc',
                color: canSave() ? 'white' : '#666',
                fontSize: '16px',
                fontWeight: '600',
                cursor: canSave() ? 'pointer' : 'not-allowed',
                boxShadow: canSave() ? '0 2px 4px rgba(40, 167, 69, 0.3)' : 'none'
              }}
              title={hasOverflow ? 'Create composition translation with automatic overflow handling' : 'Create composition translation'}
            >
              {hasOverflow ? '🚀 Create' : 'Create'}
            </button>
          </div>
        </div>
    </MovableDialog>
  </>
  );
};

export default NewCompTransDialog;
