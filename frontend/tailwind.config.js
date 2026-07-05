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
      },
    },
  },
  plugins: [],
}
