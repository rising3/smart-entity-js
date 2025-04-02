const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const {
    includeIgnoreFile,
} = require("@eslint/compat");

const path = require("node:path");
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});
const gitignorePath = path.resolve(__dirname, ".gitignore");

module.exports = defineConfig([globalIgnores([
    "**/.prettierrc",
    "**/tsconfig.json",
]), includeIgnoreFile(gitignorePath), {
    extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.commonjs,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "script",
    },

    rules: {
        quotes: ["error", "single"],
        semi: ["error", "never"],
    },
}]);