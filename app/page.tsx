"use client";

import { useState } from "react";
import { ConnectButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { ClaimButton } from "thirdweb/react";
import {
  getActiveClaimCondition,
  nextTokenIdToMint,
} from "thirdweb/extensions/erc721";
import { toEther } from "thirdweb";
import { Providers } from "./providers";
import { client, chain, nftDropContract } from "@/lib/client";

function MintCard() {
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

  return <MintCardWithContract contract={nftDropContract} />;
}

function MintCardWithContract({
  contract,
}: {
  contract: NonNullable<typeof nftDropContract>;
}) {
  const account = useActiveAccount();
  const [quantity, setQuantity] = useState(1);

  const { data: claimCondition, isLoading: isLoadingCondition } =
    useReadContract(getActiveClaimCondition, { contract });

  const { data: nextTokenId } = useReadContract(nextTokenIdToMint, {
    contract,
  });

  const priceWei = claimCondition?.pricePerToken ?? 0n;
  const priceNative = toEther(priceWei);
  const claimed = nextTokenId ?? 0n;
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
        Dropです（thirdweb / ERC721A Lazy Mint / Avalanche Fuji）。
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
        claimParams={{ type: "ERC721", quantity: BigInt(quantity) }}
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
