"use client";

import { useState } from "react";
import { ConnectButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { ClaimButton } from "thirdweb/react";
import {
  getActiveClaimCondition,
  totalSupply,
} from "thirdweb/extensions/erc1155";
import { toEther, type ThirdwebClient } from "thirdweb";
import { Providers } from "./providers";
import { client, chain, nftDropContract } from "@/lib/client";

function MintCard() {
  if (!client) {
    return (
      <div className="card">
        <p className="muted">
          NEXT_PUBLIC_TEMPLATE_CLIENT_ID が未設定です。.env.local に
          thirdweb Dashboard で発行した Client ID を設定してください。
        </p>
      </div>
    );
  }

  if (!nftDropContract) {
    return (
      <div className="card">
        <p className="muted">
          NEXT_PUBLIC_NFT_DROP_CONTRACT_ADDRESS が未設定です。.env.local に
          Avalanche Fuji上でデプロイした NFT Drop コントラクトのアドレスを設定してください。
        </p>
      </div>
    );
  }

  return <MintCardWithContract client={client} contract={nftDropContract} />;
}

function MintCardWithContract({
  client,
  contract,
}: {
  client: ThirdwebClient;
  contract: NonNullable<typeof nftDropContract>;
}) {
  const account = useActiveAccount();
  const [quantity, setQuantity] = useState(1);

  // This app mints all editions under a single token ID (0) — the
  // contract is a DropERC1155 ("Edition Drop"), where one token ID
  // represents one piece of unique content with a fixed supply.
  const tokenId = 0n;

  const { data: claimCondition, isLoading: isLoadingCondition } =
    useReadContract(getActiveClaimCondition, { contract, tokenId });

  const { data: claimedSupply } = useReadContract(totalSupply, {
    contract,
    id: tokenId,
  });

  const priceWei = claimCondition?.pricePerToken ?? 0n;
  const priceNative = toEther(priceWei);
  const claimed = claimedSupply ?? 0n;
  const maxSupply = claimCondition?.maxClaimableSupply ?? 0n;

  return (
    <div className="card">
      <div className="row">
        <span className="badge">Avalanche Fuji</span>
        <ConnectButton client={client} chain={chain} />
      </div>

      <h1 style={{ margin: "16px 0 4px" }}>Avalanche Fuji NFT Drop Studio</h1>
      <p className="muted">
        オリジナルのデジタルコンテンツを数量限定・条件付きで配布するNFT
        Dropです（thirdweb / DropERC1155 Lazy Mint / Avalanche Fuji）。
      </p>

      <div className="row">
        <span className="muted">Price</span>
        <span>{isLoadingCondition ? "..." : `${priceNative} AVAX`}</span>
      </div>
      <div className="row">
        <span className="muted">Claimed</span>
        <span>
          {claimed.toString()} / {maxSupply.toString()}
        </span>
      </div>
      <div className="row">
        <span className="muted">Quantity</span>
        <input
          type="number"
          min={1}
          max={5}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          style={{
            width: 64,
            padding: 8,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "inherit",
          }}
        />
      </div>

      <ClaimButton
        client={client}
        chain={chain}
        contractAddress={contract.address}
        claimParams={{ type: "ERC1155", tokenId, quantity: BigInt(quantity) }}
        className="mint-btn"
        disabled={!account}
        onTransactionConfirmed={() => alert("Mint成功！ウォレットのNFTタブを確認してください。")}
        onError={(err) => alert(`Mint失敗: ${err.message}`)}
      >
        {account ? "Mint（Claim）する" : "先にウォレットを接続してください"}
      </ClaimButton>
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <main>
        <MintCard />
      </main>
    </Providers>
  );
}
