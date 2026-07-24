// Stub for optional `@x402/*` peer packages that @coinbase/cdp-sdk lazily
// `import()`s only when a consumer signs an x402 payment (a feature this
// app never uses). See next.config.mjs for why this exists.
//
// `@x402/evm`'s `toClientEvmSigner` is statically imported by
// account-signers.js (unlike the other `@x402/*` subpaths, which are only
// ever dynamically `import()`ed), so it must exist here even though it is
// never actually called in this app.
export function toClientEvmSigner() {
  throw new Error("x402 payments are not supported in this app.");
}
