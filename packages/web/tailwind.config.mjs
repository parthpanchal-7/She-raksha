/** @type {import('tailwindcss').Config} */
import { sheRakshaTailwindPreset } from '@she-raksha/design-tokens';

export default {
  presets: [sheRakshaTailwindPreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

