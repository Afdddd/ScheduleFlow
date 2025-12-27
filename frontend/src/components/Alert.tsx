import React from 'react';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  /**
   * 알럿 타입
   * - error: 에러 메시지 (빨간색)
   * - success: 성공 메시지 (초록색)
   * - warning: 경고 메시지 (주황색)
   * - info: 정보 메시지 (파란색)
   */
  type: AlertType;
  /**
   * 표시할 메시지
   */
  message: string;
  /**
   * 닫기 버튼 표시 여부 (기본값: true)
   */
  dismissible?: boolean;
  /**
   * 닫기 버튼 클릭 시 호출되는 콜백 함수
   */
  onClose?: () => void;
  /**
   * 추가 CSS 스타일
   */
  style?: React.CSSProperties;
}

/**
 * Alert 컴포넌트
 * 
 * 사용 예시:
 * ```tsx
 * <Alert 
 *   type="error" 
 *   message="로그인에 실패했습니다." 
 *   onClose={() => setError('')}
 * />
 * ```
 * 
 * 왜 이렇게 설계했을까요?
 * 
 * 1. **타입 시스템 활용**
 *    - TypeScript의 타입 안정성 확보
 *    - 허용된 타입만 사용 가능하도록 제한
 * 
 * 2. **재사용성**
 *    - 다양한 상황(에러, 성공, 경고, 정보)에 사용 가능
 *    - 일관된 UI/UX 제공
 * 
 * 3. **접근성**
 *    - dismissible prop으로 닫기 기능 제어
 *    - onClose 콜백으로 부모 컴포넌트에서 상태 관리
 * 
 * 4. **유연성**
 *    - style prop으로 추가 스타일링 가능
 *    - 필요에 따라 확장 용이
 */
const Alert: React.FC<AlertProps> = ({
  type,
  message,
  dismissible = true,
  onClose,
  style,
}) => {
  // 타입별 색상 스키마 정의
  const colorSchemes = {
    error: {
      backgroundColor: '#fee',
      borderColor: '#fcc',
      textColor: '#c33',
    },
    success: {
      backgroundColor: '#efe',
      borderColor: '#cfc',
      textColor: '#3c3',
    },
    warning: {
      backgroundColor: '#ffa',
      borderColor: '#ff8',
      textColor: '#c90',
    },
    info: {
      backgroundColor: '#eef',
      borderColor: '#ccf',
      textColor: '#33c',
    },
  };

  const scheme = colorSchemes[type];

  const baseStyle: React.CSSProperties = {
    padding: '12px',
    backgroundColor: scheme.backgroundColor,
    border: `1px solid ${scheme.borderColor}`,
    borderRadius: '4px',
    marginBottom: '20px',
    color: scheme.textColor,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...style,
  };

  return (
    <div style={baseStyle} role="alert">
      <span>{message}</span>
      {dismissible && onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: scheme.textColor,
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0 8px',
            marginLeft: '12px',
            lineHeight: '1',
          }}
          aria-label="알럿 닫기"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;

