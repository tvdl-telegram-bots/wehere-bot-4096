/* eslint "@stylistic/js/quote-props": ["warn", "always"] */

import globals from "globals";
import EslintJs from "@eslint/js";
import TypescriptEslint from "typescript-eslint";
import EslintPluginImport from "eslint-plugin-import";
import EslintPluginJs from "@stylistic/eslint-plugin-js";

/** @type {import('eslint').Linter.Config} */
// prettier-ignore
export default [
  EslintJs.configs.recommended,
  ...TypescriptEslint.configs.recommended,
  {
    "languageOptions": {
      "globals": { ...globals.browser, ...globals.node },
    },
  },
  {
    "files": ["**/*.ts", "**/*.tsx"],
    "plugins": { "import": EslintPluginImport },
    "rules": {
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true,
          },
        },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "varsIgnorePattern": "^_",
          "argsIgnorePattern": "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  {
    "files": ["**/*.mjs"],
    "plugins": {
      "@stylistic/js": EslintPluginJs,
    },
  },
  {
    "ignores": ["**/dist"],
  },
];
