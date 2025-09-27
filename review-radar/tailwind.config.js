module.exports = {
  purge: ['./src/**/*.{html,js}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',
        secondary: '#50E3C2',
      },
      borderRadius: {
        'xl': '1rem',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}