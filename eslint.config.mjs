import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  // Next.js core rules (includes react, react-hooks, jsx-a11y, import, etc.)
  ...nextVitals,
  ...nextTs,

  // Turn off rules that conflict with Prettier formatting.
  prettier,

  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  // Logger boleh menulis ke console (output terarah).
  {
    files: ["src/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // Skrip operator CLI: console adalah keluaran utama untuk operator, bukan log
  // aplikasi web. Aturan no-console tetap berlaku di src/**.
  {
    files: ["scripts/**/*.{mjs,ts}", "provision-*.mts"],
    rules: {
      "no-console": "off",
    },
  },

  // Tabel admin memakai komponen bersama, bukan class data-table lama.
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/data-table/]",
          message: "Gunakan komponen <Table> dari @/components/ui/table, bukan class data-table.",
        },
        {
          selector: "TemplateElement[value.raw=/data-table/]",
          message: "Gunakan komponen <Table> dari @/components/ui/table, bukan class data-table.",
        },
      ],
    },
  },

  // Tabel mentah dilarang di halaman admin non-cetak; pakai <Table> bersama.
  // Halaman cetak dikecualikan karena memakai layout cetak khusus.
  {
    files: ["src/app/(admin)/**/*.tsx", "src/features/**/*.tsx"],
    ignores: ["**/cetak/**/*.tsx", "**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='table']",
          message: "Gunakan komponen <Table> dari @/components/ui/table, bukan <table> mentah.",
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", ".tmp/**", "next-env.d.ts"]),
]);

export default eslintConfig;
