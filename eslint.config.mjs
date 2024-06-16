import globals from "globals";
import EslintJs from "@eslint/js";
import TypescriptEslint from "typescript-eslint";
import EslintPluginImport from "eslint-plugin-import";
import EslintPluginReact_Configs_Recommended from "eslint-plugin-react/configs/recommended.js";
import EslintPluginReactHooks from "eslint-plugin-react-hooks";

/** @type {import('eslint').Linter.Config} */
export default [
  EslintJs.configs.recommended,
  ...TypescriptEslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ...EslintPluginReact_Configs_Recommended,
    settings: { react: { version: "detect" } },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "import": EslintPluginImport,
      "react-hooks": EslintPluginReactHooks,
    },
    rules: {
      ...EslintPluginReactHooks.configs.recommended.rules,
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          "alphabetize": {
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
  {
    ignores: ["**/dist"],
  },
];
