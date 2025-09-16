import React from 'react';

interface TextSplitPreviewDialogProps {
  isOpen: boolean;
  originalText: string;
  overflowText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const TextSplitPreviewDialog: React.FC<TextSplitPreviewDialogProps> = ({
  isOpen,
  originalText,
  overflowText,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          📄 Text Overflow - Split Preview
        </h2>

        <p style={{
          margin: '0 0 20px 0',
          color: '#666',
          fontSize: '14px'
        }}>
          The text is too long for the current region. It will be split into 2 parts:
        </p>

        {/* Split 1 - Original Text */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#2563eb'
          }}>
            📍 SPLIT 1 (Stays in Current Mother):
          </h3>
          <div style={{
            border: '2px solid #2563eb',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: '#eff6ff',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {originalText || 'No text in original region'}
          </div>
        </div>

        {/* Split 2 - Overflow Text */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#dc2626'
          }}>
            🆕 SPLIT 2 (Goes to New Mother):
          </h3>
          <div style={{
            border: '2px solid #dc2626',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {overflowText || 'No overflow text'}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            ❌ Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            ✅ Continue & Create New Mother
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextSplitPreviewDialog;
