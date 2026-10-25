import nextVitals from "eslint-config-next/core-web-vitals";
export default [
  ...nextVitals,
  { ignores: [".next/**", ".test-build/**", "node_modules/**"] },
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
