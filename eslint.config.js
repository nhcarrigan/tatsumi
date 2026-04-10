import nhcarrigan from "@nhcarrigan/eslint-config";

export default [
  ...nhcarrigan,
  {
    ignores: ["dist/", "src-tauri/target/", "node_modules/", "*.config.ts", "*.config.js"],
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
