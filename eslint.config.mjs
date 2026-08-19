import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /*
      Tek seferlik veri taşıma betikleri: düz Node CommonJS, uygulama
      paketine hiç girmiyorlar. Next/TS kuralları burada geçerli değil.
    */
    "scripts/**",
  ]),
]);

export default eslintConfig;
