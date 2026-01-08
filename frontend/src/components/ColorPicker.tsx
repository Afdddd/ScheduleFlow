import React, { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

/**
 * ColorPicker 컴포넌트
 * 
 * 기능:
 * 1. color input으로 직접 색상 선택
 * 2. 미리 정의된 팔레트에서 색상 선택
 * 3. Tailwind CSS 색상 팔레트 기반
 */
const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [showPalette, setShowPalette] = useState<boolean>(false);

  // Tailwind CSS 색상 팔레트 (프로젝트 시각화에 적합한 색상들)
  const colorPalette = [
    { name: '파란색', value: '#3b82f6' }, // blue-500
    { name: '초록색', value: '#10b981' }, // emerald-500
    { name: '보라색', value: '#8b5cf6' }, // violet-500
    { name: '주황색', value: '#f59e0b' }, // amber-500
    { name: '빨간색', value: '#ef4444' }, // red-500
    { name: '핑크색', value: '#ec4899' }, // pink-500
    { name: '청록색', value: '#14b8a6' }, // teal-500
    { name: '인디고', value: '#6366f1' }, // indigo-500
    { name: '노란색', value: '#eab308' }, // yellow-500
    { name: '회색', value: '#6b7280' }, // gray-500
    { name: '라임색', value: '#84cc16' }, // lime-500
    { name: '시안색', value: '#06b6d4' }, // cyan-500
  ];

  const handlePaletteColorClick = (color: string) => {
    onChange(color);
    setShowPalette(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          title="색상 선택"
        />
        <button
          type="button"
          onClick={() => setShowPalette(!showPalette)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          팔레트
        </button>
        {value && (
          <span className="text-sm text-gray-600">{value.toUpperCase()}</span>
        )}
      </div>

      {showPalette && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPalette(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 min-w-[280px]">
            <div className="grid grid-cols-4 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handlePaletteColorClick(color.value)}
                  className={`
                    w-12 h-12 rounded-lg border-2 transition-all
                    ${
                      value === color.value
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              팔레트에서 색상을 선택하세요
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColorPicker;

