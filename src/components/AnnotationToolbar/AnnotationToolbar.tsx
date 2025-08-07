import React from 'react';
import './AnnotationToolbar.scss';

export type ToolType = 'cursor' | 'brush' | 'rectangle';
export type ColorType = '#FFFF00' | '#00FF00' | '#FF0000' | '#0000FF' | '#FF00FF';

interface AnnotationToolbarProps {
  selectedTool: ToolType;
  selectedColor: ColorType;
  onToolChange: (tool: ToolType) => void;
  onColorChange: (color: ColorType) => void;
}

const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  selectedTool,
  selectedColor,
  onToolChange,
  onColorChange,
}) => {
  const tools: { type: ToolType; icon: string; label: string }[] = [
    { type: 'cursor', icon: '↖', label: 'Cursor' },
    { type: 'brush', icon: '🖌', label: 'Brush/Highlight' },
    { type: 'rectangle', icon: '⬜', label: 'Rectangle' },
  ];

  const colors: ColorType[] = [
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#FF0000', // Red
    '#0000FF', // Blue
    '#FF00FF', // Magenta
  ];

  const getColorName = (color: ColorType): string => {
    const colorMap: Record<ColorType, string> = {
      '#FFFF00': 'Yellow',
      '#00FF00': 'Green',
      '#FF0000': 'Red',
      '#0000FF': 'Blue',
      '#FF00FF': 'Magenta',
    };
    return colorMap[color];
  };

  return (
    <div className="annotation-toolbar">
      <div className="toolbar-section">
        <h4>Tools</h4>
        <div className="tool-buttons">
          {tools.map((tool) => (
            <button
              key={tool.type}
              className={`tool-button ${selectedTool === tool.type ? 'active' : ''}`}
              onClick={() => onToolChange(tool.type)}
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h4>Colors</h4>
        <div className="color-palette">
          {colors.map((color) => (
            <button
              key={color}
              className={`color-button ${selectedColor === color ? 'active' : ''}`}
              onClick={() => onColorChange(color)}
              style={{ backgroundColor: color }}
              title={getColorName(color)}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-info">
        <div className="current-selection">
          <strong>Active:</strong> {tools.find(t => t.type === selectedTool)?.label} - {getColorName(selectedColor)}
        </div>
      </div>
    </div>
  );
};

export default AnnotationToolbar;
