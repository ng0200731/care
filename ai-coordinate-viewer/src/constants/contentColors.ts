// Centralized content-type color palette and helpers

export type ContentTypeId =
  | 'line-text'
  | 'pure-english-paragraph'
  | 'translation-paragraph'
  | 'washing-symbol'
  | 'image'
  | 'coo';

// Base HEX colors used for strokes/icons/labels
export const TYPE_HEX: Record<ContentTypeId, string> = {
  'line-text': '#3B82F6',
  'pure-english-paragraph': '#10B981',
  'translation-paragraph': '#F59E0B',
  'washing-symbol': '#8B5CF6',
  'image': '#EF4444',
  'coo': '#06B6D4'
};

// Convert HEX to RGBA string with the given opacity
function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getTypeHex(type: string, fallback: string = '#6B7280'): string {
  return (TYPE_HEX as any)[type] || fallback;
}

// Region background fill (normal tint)
export function getTypeFill(type: string, opacity: number = 0.15): string {
  const hex = getTypeHex(type);
  return hexToRgba(hex, opacity);
}

// Stronger tint for drag-over preview
export function getTypeDragFill(type: string, opacity: number = 0.25): string {
  const hex = getTypeHex(type);
  return hexToRgba(hex, opacity);
}

// Neutral color for empty region
export const EMPTY_REGION_FILL = 'rgba(243, 244, 246, 0.30)';

// Fallback gray for unknown content types (stroke/icons)
export const UNKNOWN_HEX = '#6B7280';

