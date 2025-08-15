import React from 'react';

export interface ContentType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const contentTypes: ContentType[] = [
  {
    id: 'line-text',
    name: 'Line Text',
    icon: '📝',
    description: 'Single line text content'
  },
  {
    id: 'pure-english-paragraph',
    name: 'Pure English Paragraph',
    icon: '📄',
    description: 'English paragraph with advanced formatting'
  },
  {
    id: 'translation-paragraph',
    name: 'Translation Paragraph',
    icon: '🌐',
    description: 'Multi-language paragraph text'
  },
  {
    id: 'washing-symbol',
    name: 'Washing Symbol',
    icon: '🧺',
    description: 'Care instruction symbols'
  },
  {
    id: 'image',
    name: 'Image',
    icon: '🖼️',
    description: 'Image content'
  },
  {
    id: 'coo',
    name: 'COO',
    icon: '🏷️',
    description: 'Country of Origin'
  }
];

interface ContentMenuProps {
  isVisible: boolean;
  regionContents?: Map<string, any[]>;
  onEditContent?: (content: any, regionId: string) => void;
  onDeleteContent?: (content: any, regionId: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ContentMenu: React.FC<ContentMenuProps> = ({
  isVisible,
  regionContents = new Map(),
  onEditContent,
  onDeleteContent,
  onMouseEnter,
  onMouseLeave
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, contentType: ContentType) => {
    console.log('🚀 DRAG START:', contentType.name, 'ID:', contentType.id);
    e.dataTransfer.setData('application/json', JSON.stringify(contentType));
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset visual feedback
    e.currentTarget.style.opacity = '1';
  };

  // Collect all placed content items and determine which content types have been placed
  const placedContentItems: Array<{content: any, regionId: string}> = [];
  const placedContentTypes = new Set<string>();

  regionContents.forEach((contents, regionId) => {
    contents.forEach((content: any) => {
      placedContentItems.push({ content, regionId });
      placedContentTypes.add(content.type);
    });
  });



  if (!isVisible) return null;

  return (
    <div
      style={{
        width: '300px',
        height: '100vh',
        backgroundColor: '#f8f9fa',
        borderLeft: '1px solid #e2e8f0',
        padding: '20px',
        paddingLeft: '50px', // Extra left padding to accommodate offset content
        boxSizing: 'border-box',
        position: 'fixed',
        right: isVisible ? 0 : '-300px', // Slide animation
        top: 0,
        zIndex: 1000,
        overflowY: 'auto',
        overflowX: 'visible', // Allow horizontal overflow for offset content
        transition: 'right 0.3s ease-in-out' // Smooth slide animation
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div style={{
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📋 CONTENT TYPES
        </h3>
        <p style={{
          margin: '5px 0 0 0',
          fontSize: '12px',
          color: '#718096'
        }}>
          Drag items to regions on canvas
        </p>
      </div>

      {/* Content Type Items */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {contentTypes.map((contentType) => (
          <div
            key={contentType.id}
            style={{
              position: 'relative'
            }}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, contentType)}
              onDragEnd={handleDragEnd}
              style={{
                padding: '15px',
                backgroundColor: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'grab',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3182ce';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(49, 130, 206, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>{contentType.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2d3748'
                  }}>
                    {contentType.name}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#718096',
                lineHeight: '1.4'
              }}>
                {contentType.description}
              </div>
            </div>
          </div>
          )
        )}
      </div>



      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e6fffa',
        border: '1px solid #38b2ac',
        borderRadius: '6px'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#234e52',
          fontWeight: '600',
          marginBottom: '5px'
        }}>
          💡 How to use:
        </div>
        <div style={{
          fontSize: '11px',
          color: '#234e52',
          lineHeight: '1.4'
        }}>
          1. Drag any content type from this panel<br/>
          2. Drop it on a region in the canvas<br/>
          3. Fill in the properties dialog<br/>
          4. Click Save to add content
        </div>
      </div>
    </div>
  );
};

export default ContentMenu;
