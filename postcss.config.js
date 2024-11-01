module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': false
      },
      browsers: ['>0.2%', 'not dead', 'not op_mini all']
    }
  }
}