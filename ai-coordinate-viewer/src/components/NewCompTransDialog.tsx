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
  overflowOption: 'keep-flowing' | 'truncate' | 'shrink';
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
  onCreateNewMother?: (originalText: string, overflowText: string) => void; // New callback for mother creation
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
  onCreateNewMother
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
    },
    overflowOption: 'truncate'
  });

  // Overflow handling state
  const [overflowOption, setOverflowOption] = useState<'keep-flowing' | 'truncate' | 'shrink'>('truncate');

  // Overflow detection state for UI feedback
  const [hasOverflow, setHasOverflow] = useState(false);

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

    console.log('🔍 Available materials:', {
      selectedMaterials,
      availableMaterials,
      totalCommonMaterials: commonMaterials.length
    });

    return availableMaterials;
  };

  // Helper function to check for duplicate materials within current composition
  const hasDuplicateMaterials = (): boolean => {
    const materials = config.materialCompositions
      .filter(comp => comp.material && comp.percentage > 0)
      .map(comp => comp.material);

    const uniqueMaterials = new Set(materials);
    const hasDuplicates = materials.length !== uniqueMaterials.size;

    console.log('🔍 Checking for duplicate materials within composition:', {
      materials,
      uniqueCount: uniqueMaterials.size,
      totalCount: materials.length,
      hasDuplicates
    });

    return hasDuplicates;
  };

  // Helper function to check if current composition already exists
  const isCompositionAlreadyUsed = (): boolean => {
    const currentMaterialSignature = generateMaterialOnlySignature(config.materialCompositions);
    if (!currentMaterialSignature) return false; // Empty composition is not considered used

    console.log('🔍 Checking composition duplicates:', {
      currentMaterialSignature,
      currentFullSignature: generateCompositionSignature(config.materialCompositions),
      currentMaterials: config.materialCompositions,
      existingCompositionsCount: existingCompositions.length,
      existingCompositionsRaw: existingCompositions,
      existingMaterialSignatures: existingCompositions.map(comp => generateMaterialOnlySignature(comp)),
      existingFullSignatures: existingCompositions.map(comp => generateCompositionSignature(comp))
    });

    // Check against existing compositions from other regions - prevent same materials regardless of percentages
    const isDuplicate = existingCompositions.some(existingComp => {
      const existingMaterialSignature = generateMaterialOnlySignature(existingComp);
      console.log('🔍 Comparing signatures:', {
        current: currentMaterialSignature,
        existing: existingMaterialSignature,
        match: existingMaterialSignature === currentMaterialSignature
      });
      return existingMaterialSignature === currentMaterialSignature;
    });

    console.log('🔍 Final duplicate result:', isDuplicate);
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

    console.log('🔍 canSave validation:', {
      isValidPercentage,
      hasNoDuplicateMaterials,
      isNotDuplicate,
      canSave: isValidPercentage && hasNoDuplicateMaterials && isNotDuplicate
    });

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

  // Canvas-based overflow detection and text splitting (DPR-aware for zoom consistency)
  const detectOverflowAndSplit = () => {
    const text = generateTextContent();
    if (!text || !regionWidth || !regionHeight) return { hasOverflow: false, originalText: text, overflowText: '' };

    // Get device pixel ratio for zoom-independent measurement
    const dpr = window.devicePixelRatio || 1;

    // Calculate available space in pixels
    const regionWidthPx = regionWidth * 3.779527559; // Convert mm to px (96 DPI)
    const regionHeightPx = regionHeight * 3.779527559;
    const paddingLeftPx = config.padding.left * 3.779527559;
    const paddingRightPx = config.padding.right * 3.779527559;
    const paddingTopPx = config.padding.top * 3.779527559;
    const paddingBottomPx = config.padding.bottom * 3.779527559;

    const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
    const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

    // Convert to logical pixels for zoom-independent calculation
    const logicalAvailableWidthPx = availableWidthPx / dpr;
    const logicalAvailableHeightPx = availableHeightPx / dpr;

    // Convert font size to logical pixels
    let logicalFontSizePx = config.typography.fontSize;
    if (config.typography.fontSizeUnit === 'mm') {
      logicalFontSizePx = config.typography.fontSize * 3.779527559;
    } else if (config.typography.fontSizeUnit === 'pt') {
      logicalFontSizePx = (config.typography.fontSize * 4/3);
    }
    logicalFontSizePx = logicalFontSizePx / dpr; // Convert to logical pixels

    // DPR-aware text width estimation for zoom-independent measurement
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2; // Fallback

      // Scale canvas for high-DPI and zoom consistency
      canvas.width = 1000 * dpr;
      canvas.height = 100 * dpr;
      context.scale(dpr, dpr);

      context.font = `${logicalFontSizePx}px ${config.typography.fontFamily}`;
      const textWidthPx = context.measureText(text).width;
      return textWidthPx / 3.779527559; // Convert to mm
    };

    const availableWidthMm = logicalAvailableWidthPx / 3.779527559;
    const fontSizeMm = logicalFontSizePx / 3.779527559;

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

    // Check for height overflow using logical pixels (zoom-independent)
    const lineHeightMm = fontSizeMm * config.lineBreakSettings.lineSpacing;
    const totalTextHeightMm = lines.length * lineHeightMm;
    const availableHeightMm = logicalAvailableHeightPx / 3.779527559;
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
        },
        overflowOption: editingContent.newCompTransConfig.overflowOption || 'truncate'
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
      },
      overflowOption: 'truncate'
    };
  };

  useEffect(() => {
    if (isOpen) {
      const initialConfig = getInitialConfig();
      setConfig(initialConfig);
      setOverflowOption(initialConfig.overflowOption);

      // Debug: Check if callback is available
      console.log('🔍 NewCompTransDialog opened with callback:', {
        hasOnCreateNewMother: !!onCreateNewMother,
        callbackType: typeof onCreateNewMother
      });
    }
  }, [isOpen, editingContent]);

  // Sync overflow option with config
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      overflowOption: overflowOption
    }));
  }, [overflowOption]);

  // Auto-generate text content when compositions or languages change
  useEffect(() => {
    const generatedText = generateTextContent();
    setConfig(prev => ({
      ...prev,
      textContent: {
        ...prev.textContent,
        generatedText
      }
    }));

    // Debug: Log the current config when text is generated
    console.log('🔍 DEBUG: Dialog config after text generation:', {
      lineBreakSettings: config.lineBreakSettings,
      textContent: config.textContent,
      generatedText: generatedText
    });
  }, [config.materialCompositions, config.selectedLanguages, config.textContent.separator]);

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
    recursionDepth: number = 0,
    preWrappedLines: string[] = []
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

    // Calculate position for new mother (20mm gap standard)
    let maxRightX = 0;
    currentData.objects.forEach((obj: any) => {
      if (obj.name?.includes('Mother_')) {
        const rightEdge = obj.x + obj.width;
        if (rightEdge > maxRightX) {
          maxRightX = rightEdge;
        }
      }
    });

    // Create new mother with inherited properties from ORIGINAL mother config
    const newMother = {
      ...sourceMother,
      name: `Mother_${newMotherNumber}`,
      type: 'mother',
      typename: 'mother',
      x: sourceMother.x + sourceMother.width + 20, // 20mm standard gap
      y: sourceMother.y, // Same Y level
      width: sourceMother.width,
      height: sourceMother.height,
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
              isPreWrapped: true, // Mark as pre-wrapped to prevent re-wrapping
              preWrappedLines: preWrappedLines, // Store the actual wrapped lines
              overflowOption: 'truncate'
            }
          };

          newRegion.contents = [overflowContent];
          console.log(`✅ Added overflow content to region: ${newRegion.id}`);

          // Update the regionContents state in App.tsx
          if ((window as any).updateRegionContents) {
            (window as any).updateRegionContents(newRegion.id, [overflowContent]);
            console.log(`✅ Updated regionContents state for region: ${newRegion.id}`);
          } else {
            console.warn('⚠️ updateRegionContents function not available');
          }
        }

        return newRegion;
      }) || []
    };

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
    const newMotherOverflowResult = await checkMotherForOverflow(newMother, textToProcess, originalMotherConfig, preWrappedLines);

    if (newMotherOverflowResult.hasOverflow) {
      console.log(`⚠️ New Mother_${newMotherNumber} also has overflow, continuing recursion...`);

      // Update the current mother to keep only the fitted text
      await updateMotherWithFittedText(newMother, newMotherOverflowResult.originalText, originalMotherConfig);

      // Recursively handle the overflow text
      await handleAutomaticOverflowSplitting(
        newMotherOverflowResult.overflowText,
        originalMotherConfig,
        `Mother_${newMotherNumber}`,
        recursionDepth + 1,
        newMotherOverflowResult.overflowLines
      );
    }
  };

  // Helper function to check if a mother has overflow
  const checkMotherForOverflow = async (
    mother: any,
    textContent: string,
    originalConfig: any,
    preWrappedLines: string[] = []
  ): Promise<{ hasOverflow: boolean; originalText: string; overflowText: string; overflowLines: string[] }> => {
    // Use the same DPR-aware overflow detection logic as the main function
    if (!regionWidth || !regionHeight) {
      return { hasOverflow: false, originalText: textContent, overflowText: '', overflowLines: [] };
    }

    // Get device pixel ratio for zoom-independent measurement
    const dpr = window.devicePixelRatio || 1;

    // Calculate available space in pixels
    const regionWidthPx = regionWidth * 3.779527559;
    const regionHeightPx = regionHeight * 3.779527559;
    const paddingLeftPx = originalConfig.padding.left * 3.779527559;
    const paddingRightPx = originalConfig.padding.right * 3.779527559;
    const paddingTopPx = originalConfig.padding.top * 3.779527559;
    const paddingBottomPx = originalConfig.padding.bottom * 3.779527559;

    const availableWidthPx = Math.max(0, regionWidthPx - paddingLeftPx - paddingRightPx);
    const availableHeightPx = Math.max(0, regionHeightPx - paddingTopPx - paddingBottomPx);

    // Convert to logical pixels for zoom-independent calculation
    const logicalAvailableWidthPx = availableWidthPx / dpr;
    const logicalAvailableHeightPx = availableHeightPx / dpr;

    // Convert font size to logical pixels
    let logicalFontSizePx = originalConfig.typography.fontSize;
    if (originalConfig.typography.fontSizeUnit === 'mm') {
      logicalFontSizePx = originalConfig.typography.fontSize * 3.779527559;
    } else if (originalConfig.typography.fontSizeUnit === 'pt') {
      logicalFontSizePx = (originalConfig.typography.fontSize * 4/3);
    }
    logicalFontSizePx = logicalFontSizePx / dpr; // Convert to logical pixels

    // DPR-aware text width estimation for zoom-independent measurement
    const estimateTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 2;

      // Scale canvas for high-DPI and zoom consistency
      canvas.width = 1000 * dpr;
      canvas.height = 100 * dpr;
      context.scale(dpr, dpr);

      context.font = `${logicalFontSizePx}px ${originalConfig.typography.fontFamily}`;
      const textWidthPx = context.measureText(text).width;
      return textWidthPx / 3.779527559;
    };

    const availableWidthMm = logicalAvailableWidthPx / 3.779527559;
    const fontSizeMm = logicalFontSizePx / 3.779527559;

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

    // 🎯 USE PRE-WRAPPED LINES if available (from Split 1&2 perfect logic), otherwise wrap
    const lines = preWrappedLines.length > 0 ? preWrappedLines : wrapTextToLines(textContent);

    if (preWrappedLines.length > 0) {
      console.log(`✅ Using pre-wrapped lines from Split 1&2 (${preWrappedLines.length} lines) - NO RE-WRAPPING!`);
    } else {
      console.log(`⚠️ No pre-wrapped lines available, falling back to re-wrapping`);
    }

    // Check for height overflow using logical pixels (zoom-independent)
    const lineHeightMm = fontSizeMm * originalConfig.lineBreakSettings.lineSpacing;
    const totalTextHeightMm = lines.length * lineHeightMm;
    const availableHeightMm = logicalAvailableHeightPx / 3.779527559;
    const hasOverflow = totalTextHeightMm > availableHeightMm;

    if (hasOverflow) {
      const maxVisibleLines = Math.floor(availableHeightMm / lineHeightMm);
      const originalLines = lines.slice(0, maxVisibleLines);
      const overflowLines = lines.slice(maxVisibleLines);

      return {
        hasOverflow: true,
        originalText: originalLines.join(originalConfig.lineBreakSettings.lineBreakSymbol),
        overflowText: overflowLines.join(originalConfig.lineBreakSettings.lineBreakSymbol),
        overflowLines: overflowLines
      };
    }

    return {
      hasOverflow: false,
      originalText: textContent,
      overflowText: '',
      overflowLines: []
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

  const handleSave = async () => {
    // Always check for overflow to provide user feedback
    const overflowResult = detectOverflowAndSplit();

    if (overflowResult.hasOverflow) {
      if (overflowOption === 'keep-flowing') {
        // Automatically handle overflow with recursive splitting - no popup needed
        console.log('🔄 Starting automatic recursive overflow handling...');

        // Save the original text to the current region first
        onSave({
          ...config,
          textContent: {
            ...config.textContent,
            generatedText: overflowResult.originalText
          }
        });

        // Start recursive overflow handling with the overflow text and pre-wrapped lines
        await handleAutomaticOverflowSplitting(
          overflowResult.overflowText,
          config, // Pass the original config to preserve all settings
          'Mother_3', // Source mother name
          0, // Initial recursion depth
          overflowResult.overflowLines // Pass the pre-wrapped lines
        );

        console.log('✅ Automatic recursive overflow handling completed');
        return;
      } else {
        // Text overflows but user hasn't selected "Keep Flowing"
        // Show a warning and suggest the Keep Flowing option
        const shouldUseKeepFlowing = window.confirm(
          `⚠️ TEXT OVERFLOW DETECTED!\n\n` +
          `Your text is too long for the current region and will be ${overflowOption === 'truncate' ? 'cut off' : 'shrunk'}.\n\n` +
          `Would you like to use "Keep Flowing" instead to automatically split the text across multiple regions?\n\n` +
          `Click OK to automatically create new mothers, or Cancel to continue with ${overflowOption}.`
        );

        if (shouldUseKeepFlowing) {
          setOverflowOption('keep-flowing');

          // Save the original text to the current region first
          onSave({
            ...config,
            textContent: {
              ...config.textContent,
              generatedText: overflowResult.originalText
            }
          });

          // Start automatic recursive overflow handling
          await handleAutomaticOverflowSplitting(
            overflowResult.overflowText,
            config,
            'Mother_3',
            0,
            overflowResult.overflowLines
          );

          console.log('✅ Automatic recursive overflow handling completed');
          return;
        }
      }
    }

    // No overflow or user chose to proceed with current option
    onSave(config);
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
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  Text Value:
                </label>
                <textarea
                  value={config.textContent.generatedText}
                  readOnly
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: '#f9f9f9',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                  placeholder="Generated text will appear here based on material compositions and selected languages..."
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
                color: hasOverflow ? '#856404' : '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {hasOverflow && <span>⚠️</span>}
                Overflow: {hasOverflow ? 'TEXT TOO LONG - Choose handling method' : 'No overflow detected'}
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {/* Keep Flowing */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  border: '2px solid',
                  borderColor: overflowOption === 'keep-flowing' ? '#007bff' : (hasOverflow ? '#28a745' : '#ddd'),
                  borderRadius: '4px',
                  backgroundColor: overflowOption === 'keep-flowing' ? '#e3f2fd' : (hasOverflow ? '#d4edda' : 'white'),
                  fontSize: '11px',
                  fontWeight: hasOverflow ? '600' : '500',
                  minWidth: '90px',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <input
                    type="radio"
                    name="overflowOption"
                    value="keep-flowing"
                    checked={overflowOption === 'keep-flowing'}
                    onChange={(e) => setOverflowOption(e.target.value as any)}
                    style={{ margin: 0, marginRight: '4px' }}
                  />
                  🌊 Keep Flowing
                  {hasOverflow && overflowOption !== 'keep-flowing' && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      !
                    </span>
                  )}
                </label>

                {/* Truncate */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  border: '2px solid',
                  borderColor: overflowOption === 'truncate' ? '#007bff' : '#ddd',
                  borderRadius: '4px',
                  backgroundColor: overflowOption === 'truncate' ? '#e3f2fd' : 'white',
                  fontSize: '11px',
                  fontWeight: '500',
                  minWidth: '90px',
                  justifyContent: 'center'
                }}>
                  <input
                    type="radio"
                    name="overflowOption"
                    value="truncate"
                    checked={overflowOption === 'truncate'}
                    onChange={(e) => setOverflowOption(e.target.value as any)}
                    style={{ margin: 0, marginRight: '4px' }}
                  />
                  ✂️ Truncate
                </label>

                {/* Shrink */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  border: '2px solid',
                  borderColor: overflowOption === 'shrink' ? '#007bff' : '#ddd',
                  borderRadius: '4px',
                  backgroundColor: overflowOption === 'shrink' ? '#e3f2fd' : 'white',
                  fontSize: '11px',
                  fontWeight: '500',
                  minWidth: '90px',
                  justifyContent: 'center'
                }}>
                  <input
                    type="radio"
                    name="overflowOption"
                    value="shrink"
                    checked={overflowOption === 'shrink'}
                    onChange={(e) => setOverflowOption(e.target.value as any)}
                    style={{ margin: 0, marginRight: '4px' }}
                  />
                  🔍 Shrink
                </label>
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
            <button
              onClick={handleSave}
              disabled={!canSave()}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: canSave() ? '#28a745' : '#ccc',
                color: canSave() ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: canSave() ? 'pointer' : 'not-allowed'
              }}
            >
              Save
            </button>
          </div>
        </div>
    </MovableDialog>
  </>
  );
};

export default NewCompTransDialog;
