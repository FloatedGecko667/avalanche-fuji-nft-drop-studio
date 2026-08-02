"use client";

import { useState } from "react";
import {
  ConnectButton,
  MediaRenderer,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { ClaimButton } from "thirdweb/react";
import {
  getActiveClaimCondition,
  getNFT,
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

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  const [status, setStatus] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  // This app mints all editions under a single token ID (0) — the
  // contract is a DropERC1155 ("Edition Drop"), where one token ID
  // represents one piece of unique content with a fixed supply.
  const tokenId = 0n;

  const { data: nft } = useReadContract(getNFT, { contract, tokenId });

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
  const remaining = maxSupply > claimed ? maxSupply - claimed : 0n;
  const soldOut = maxSupply > 0n && remaining === 0n;
  const progressPercent =
    maxSupply > 0n ? Math.min(100, Number((claimed * 100n) / maxSupply)) : 0;

  const perWalletLimit = claimCondition?.quantityLimitPerWallet ?? 0n;
  const maxQuantity = [5n, remaining, perWalletLimit]
    .filter((limit) => limit > 0n)
    .reduce((min, limit) => (limit < min ? limit : min), 5n);

  const explorerUrl = `https://testnet.snowtrace.io/address/${contract.address}`;

  return (
    <div className="card">
      <div className="row">
        <span className="badge">Avalanche Fuji</span>
        <ConnectButton client={client} chain={chain} />
      </div>

      {nft?.metadata.image && (
        <div className="media-frame">
          <MediaRenderer
            client={client}
            src={nft.metadata.image}
            alt={nft.metadata.name ?? "NFT preview"}
            width="100%"
            height="auto"
            mimeType="image/png"
          />
        </div>
      )}

      <h1 style={{ margin: "16px 0 4px" }}>
        {nft?.metadata.name ?? "Avalanche Fuji NFT Drop Studio"}
      </h1>
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
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="row">
        <span className="muted">Quantity</span>
        <input
          type="number"
          min={1}
          max={Number(maxQuantity)}
          value={quantity}
          disabled={soldOut}
          onChange={(e) =>
            setQuantity(
              Math.min(Math.max(1, Number(e.target.value)), Number(maxQuantity)),
            )
          }
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

      {status && (
        <div className={`status-banner status-${status.type}`}>
          {status.message}
        </div>
      )}

      {soldOut ? (
        <button className="mint-btn" disabled>
          Sold Out
        </button>
      ) : (
        <ClaimButton
          client={client}
          chain={chain}
          contractAddress={contract.address}
          claimParams={{ type: "ERC1155", tokenId, quantity: BigInt(quantity) }}
          className="mint-btn"
          disabled={!account}
          onTransactionConfirmed={() =>
            setStatus({
              type: "success",
              message: "Mint成功！ウォレットのNFTタブを確認してください。",
            })
          }
          onError={(err) =>
            setStatus({ type: "error", message: `Mint失敗: ${err.message}` })
          }
        >
          {account ? "Mint（Claim）する" : "先にウォレットを接続してください"}
        </ClaimButton>
      )}

      <p className="muted contract-link">
        Contract:{" "}
        <a href={explorerUrl} target="_blank" rel="noreferrer">
          {shortenAddress(contract.address)} ↗
        </a>
      </p>
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
