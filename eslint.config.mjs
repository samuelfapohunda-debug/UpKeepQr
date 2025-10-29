import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      // Dependencies
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "migrations/**",
      
      // Generated/bundled files
      "**/*.min.js",
      "**/*.bundle.js",
      
      // CommonJS files
      "**/*.cjs",
      "server/preload-stripe.cjs",
      "server/lib/stripe-loader.cjs",
      "server/src/lib/stripe.js",
      
      // Config files
      ".tsxrc.json",
      "tsx.config.json",
      
      // Test files
      "test-*.mjs",
      "test-*.js",
      
      // Third-party packages
      "packages/**",
      "functions/**",
      
      // Babel standalone (minified)
      "**/babel-standalone/**",
      "**/babel.min.js",
      "**/*standalone*.js",
      
      // Assets
      "src/assets/**",
      "public/assets/**",
      "public/**/*.min.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: reactPlugin,
    },
    settings: {
      react: {
        version: "detect",
        jsxRuntime: "automatic",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-console": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
