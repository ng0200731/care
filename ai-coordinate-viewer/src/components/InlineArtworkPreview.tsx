import React, { useState, useEffect, useCallback } from 'react';
import { renderToSVG, renderToImage, LayoutData, RegionContentsMap, RenderOptions } from '../services/ArtworkRenderer';

interface InlineArtworkPreviewProps {
  layoutData: LayoutData | null;
  regionContents?: RegionContentsMap;
  width?: number;
  height?: number;
  options?: RenderOptions;
  onClick?: (svgString: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const InlineArtworkPreview: React.FC<InlineArtworkPreviewProps> = ({
  layoutData,
  regionContents = {},
  width = 120,
  height = 160,
  options = {},
  onClick,
  className,
  style,
}) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(async () => {
    if (!layoutData || !layoutData.objects || layoutData.objects.length === 0) {
      setImageData(null);
      setError(null);
      return;
    }

    try {
      const dataUrl = await renderToImage(layoutData, regionContents, { ...options, onlyPreview: true });
      setImageData(dataUrl);
      setError(null);
    } catch (err) {
      console.error('Preview generation failed:', err);
      setError('Preview failed');
      setImageData(null);
    }
  }, [layoutData, regionContents, options]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const handleClick = () => {
    if (onClick && layoutData) {
      const svgString = renderToSVG(layoutData, regionContents, { ...options, onlyPreview: false });
      onClick(svgString);
    }
  };

  const placeholderStyle: React.CSSProperties = {
    width,
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontSize: '11px',
    ...style,
  };

  if (!layoutData || !layoutData.objects || layoutData.objects.length === 0) {
    return <div className={className} style={{ ...placeholderStyle, background: '#f7fafc', border: '1px dashed #cbd5e0', color: '#a0aec0' }}>No layout</div>;
  }

  if (error) {
    return <div className={className} style={{ ...placeholderStyle, background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030' }}>{error}</div>;
  }

  if (!imageData) {
    return <div className={className} style={{ ...placeholderStyle, background: '#f7fafc', border: '1px solid #e2e8f0', color: '#718096' }}>Loading...</div>;
  }

  return (
    <img
      className={className}
      src={imageData}
      alt="Layout preview"
      onClick={handleClick}
      style={{
        width,
        height,
        objectFit: 'contain',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        background: 'white',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = '#4a5568'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
    />
  );
};

export default InlineArtworkPreview;