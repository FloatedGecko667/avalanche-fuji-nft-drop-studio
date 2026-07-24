import { createThirdwebClient, getContract } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";

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

export const chain = avalancheFuji;

const contractAddress = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_ADDRESS;

export const nftDropContract =
  client && contractAddress
    ? getContract({
        client,
        chain,
        address: contractAddress,
      })
    : null;
