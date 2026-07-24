// thirdweb's ConnectButton pulls in @coinbase/cdp-sdk, which lazily
// `import()`s optional `@x402/*` peer packages only when a consumer
// actually signs an x402 payment. This app never uses that feature, and
// some of those subpaths (e.g. `@x402/evm/upto/client`) aren't even
// published yet, so the bundler must not try to statically resolve them.
const x402Specifiers = [
  "@x402/core/client",
  "@x402/evm",
  "@x402/evm/exact/client",
  "@x402/evm/upto/client",
  "@x402/svm/exact/client",
];
const x402StubAbsolute = new URL("./lib/x402-stub.js", import.meta.url).pathname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project. Without this, Next.js walks up
  // the filesystem for lockfiles and can pick a stray one from the user's
  // home directory, which breaks path alias (`@/...`) and module resolution.
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  turbopack: {
    resolveAlias: Object.fromEntries(
      x402Specifiers.map((specifier) => [specifier, "./lib/x402-stub.js"])
    ),
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...Object.fromEntries(x402Specifiers.map((specifier) => [specifier, x402StubAbsolute])),
    };
    return config;
  },
};

export default nextConfig;
