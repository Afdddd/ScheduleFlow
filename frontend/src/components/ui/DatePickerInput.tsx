import React from 'react';

/**
 * DatePickerInput — react-datepicker의 customInput.
 *
 * 날짜는 캘린더로만 고르므로, 입력창을 눌러도 모바일 키보드가 뜨지 않게 한다.
 * - `readOnly` 속성으로 키보드를 막는다(readOnly 입력창도 클릭·포커스는 되므로
 *   캘린더는 정상적으로 열린다. 캘린더 열림은 react-datepicker의 `readOnly` *prop*
 *   기준인데 그건 false라 열리고, 여기서 주는 건 DOM 속성이라 키보드만 막힌다).
 * - `inputMode="none"`을 함께 줘 구형 브라우저까지 커버한다.
 *
 * react-datepicker가 `readOnly={false}`를 주입하므로, 스프레드({...props}) *뒤에*
 * 다시 지정해 덮어써야 한다.
 */
const DatePickerInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} {...props} readOnly inputMode="none" />
);

DatePickerInput.displayName = 'DatePickerInput';

export default DatePickerInput;
