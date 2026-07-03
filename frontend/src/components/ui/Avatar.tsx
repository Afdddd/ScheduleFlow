import React from 'react';

interface AvatarProps {
  /** 이름 — 첫 글자를 표시 */
  name: string;
  /** 배경색 (hex). 없으면 기본 파랑. */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

/**
 * Avatar — 이름 첫 글자를 원형으로. 팀원 목록·프로필에 쓴다.
 * (사진 업로드 전까지 이니셜로 표시.)
 */
const Avatar: React.FC<AvatarProps> = ({ name, color = '#3457D5', size = 'md' }) => (
  <span
    className={`inline-flex flex-none items-center justify-center rounded-full font-bold text-white ${SIZES[size]}`}
    style={{ backgroundColor: color }}
    aria-hidden
  >
    {name.charAt(0)}
  </span>
);

export default Avatar;
