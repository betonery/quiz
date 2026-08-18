const config = {
  "*.{js,jsx,ts,tsx,mjs,cjs}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,scss,yml,yaml}": ["prettier --write"],
};

export default config;
