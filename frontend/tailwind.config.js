/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // 추후 다크모드 대비(목업에 라이트/다크 있음). 지금은 미사용.
  theme: {
    extend: {
      colors: {
        /*
         * 브랜드 대표색. 실제 값은 index.css의 CSS 변수(--primary-*)에 있다.
         * → 대표색 교체는 index.css 한 곳만 수정. 여기 구조는 고정.
         * bg-primary-500, text-primary-600, border-primary-200 처럼 일반 색상과 동일하게 사용.
         */
        primary: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--primary-500) / <alpha-value>)',
        },
        /*
         * 회색 팔레트를 index.css의 쿨그레이 토큰(--neutral-*)으로 덮어쓴다.
         * → 기존 gray-* 클래스(844곳)가 자동으로 코발트와 어울리는 쿨톤으로 재톤.
         * 톤 교체는 index.css 한 곳만. (구조는 고정)
         */
        gray: {
          50: 'rgb(var(--neutral-50) / <alpha-value>)',
          100: 'rgb(var(--neutral-100) / <alpha-value>)',
          200: 'rgb(var(--neutral-200) / <alpha-value>)',
          300: 'rgb(var(--neutral-300) / <alpha-value>)',
          400: 'rgb(var(--neutral-400) / <alpha-value>)',
          500: 'rgb(var(--neutral-500) / <alpha-value>)',
          600: 'rgb(var(--neutral-600) / <alpha-value>)',
          700: 'rgb(var(--neutral-700) / <alpha-value>)',
          800: 'rgb(var(--neutral-800) / <alpha-value>)',
          900: 'rgb(var(--neutral-900) / <alpha-value>)',
        },
      },
      /*
       * 그림자 — 순검정 대신 쿨네이비(#101828) 베이스 + 낮은 불투명도.
       * Astryx/클린 SaaS 특유의 은은하고 선명한(crisp) 그림자 톤.
       * shadow-sm 이 앱 카드 대부분에 쓰이므로 이 값이 전체 인상을 좌우한다.
       */
      boxShadow: {
        sm: '0 1px 2px 0 rgb(16 24 40 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(16 24 40 / 0.10), 0 1px 2px -1px rgb(16 24 40 / 0.06)',
        md: '0 4px 8px -2px rgb(16 24 40 / 0.10), 0 2px 4px -2px rgb(16 24 40 / 0.06)',
        lg: '0 12px 16px -4px rgb(16 24 40 / 0.08), 0 4px 6px -2px rgb(16 24 40 / 0.03)',
        xl: '0 20px 24px -4px rgb(16 24 40 / 0.08), 0 8px 8px -4px rgb(16 24 40 / 0.03)',
      },
    },
  },
  plugins: [],
}
