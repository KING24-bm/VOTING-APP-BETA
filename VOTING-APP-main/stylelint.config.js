module.exports = {
  // basic configuration for Tailwind projects
  // ignore Tailwind's custom at-rules so the linter doesn't complain
  rules: {
    // any other rules you want can go here
  },
  ignoreAtRules: [
    'tailwind',
    'apply',
    'variants',
    'responsive',
    'screen',
    'layer',
  ],
};
