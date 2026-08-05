import { createThirdwebClient, getContract } from "thirdweb";
import {
  arbitrum,
  avalanche,
  avalancheFuji,
  base,
  bsc,
  ethereum,
  optimism,
  polygon,
} from "thirdweb/chains";

// Client ID は公開可能な識別子。thirdweb Dashboard (Settings > API Keys) で発行する。
// 秘密鍵やSecret Keyはフロントエンドコードに絶対に含めないこと。
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

if (!clientId) {
  console.warn(
    "[thirdweb] NEXT_PUBLIC_TEMPLATE_CLIENT_ID が未設定です。.env.local を確認してください。",
  );
}

// createThirdwebClient throws synchronously on an empty clientId, which would
// crash prerendering before env vars are configured. Keep it nullable so the
// app can render a setup message instead.
export const client = clientId
  ? createThirdwebClient({ clientId })
  : null;

// The NFT Drop contract is deployed only on Avalanche Fuji; every claim
// transaction always targets this chain.
export const chain = avalancheFuji;

// Wallets already connected to one of these networks can still connect to
// the app (ConnectButton lists them as connection options). Minting itself
// still requires switching to `chain` above, which the mint UI prompts for.
export const supportedWalletChains = [
  avalancheFuji,
  avalanche,
  ethereum,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
];

const contractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_ADDRESS;

export const nftDropContract =
  client && contractAddress
    ? getContract({
        client,
        chain,
        address: contractAddress,
      })
    : null;
