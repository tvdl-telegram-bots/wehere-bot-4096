import globals from "globals";
import EslintJs from "@eslint/js";
import TypescriptEslint from "typescript-eslint";
import EslintPluginImport from "eslint-plugin-import";

/** @type {import('eslint').Linter.Config} */
export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  EslintJs.configs.recommended,
  ...TypescriptEslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: { import: EslintPluginImport },
    rules: {
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
];
