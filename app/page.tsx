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
  getNFTs,
  totalSupply,
} from "thirdweb/extensions/erc1155";
import { toEther, type ThirdwebClient, type NFT } from "thirdweb";
import { Providers } from "./providers";
import { client, chain, nftDropContract } from "@/lib/client";

function Gallery() {
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

  return <GalleryWithContract client={client} contract={nftDropContract} />;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenTxHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

// Guesses a MediaRenderer-friendly mime type from a metadata image's file
// extension. NFTs uploaded through the thirdweb Dashboard rarely set an
// explicit mime type, and MediaRenderer's own auto-detection has been
// unreliable in production for this app, so a best-effort extension check
// is more dependable than leaving it undefined.
function guessImageMimeType(url: string | null | undefined) {
  const extension = url?.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return undefined;
  }
}

function GalleryWithContract({
  client,
  contract,
}: {
  client: ThirdwebClient;
  contract: NonNullable<typeof nftDropContract>;
}) {
  const { data: nfts, isLoading } = useReadContract(getNFTs, {
    contract,
    start: 0,
    count: 20,
  });
  const [addressCopied, setAddressCopied] = useState(false);

  const copyContractAddress = async () => {
    try {
      await navigator.clipboard.writeText(contract.address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked by browser permissions; the
      // address is still visible and selectable manually as a fallback.
    }
  };

  return (
    <>
      <div className="row">
        <span className="badge">Avalanche Fuji</span>
        <ConnectButton client={client} chain={chain} />
      </div>

      <h1 className="page-title">Avalanche Fuji NFT Drop Studio</h1>
      <p className="muted">
        オリジナルのデジタルコンテンツを数量限定・条件付きで配布するNFT
        Dropです（thirdweb / DropERC1155 Lazy Mint / Avalanche Fuji）。
      </p>

      {isLoading && (
        <div className="card">
          <span className="skeleton skeleton-text" />
        </div>
      )}

      {!isLoading && (!nfts || nfts.length === 0) && (
        <div className="card">
          <p className="muted">
            まだLazy MintされたNFTがありません。thirdweb DashboardでNFTを追加してください。
          </p>
        </div>
      )}

      <div className="gallery-grid">
        {nfts?.map((nft) => (
          <NftMintCard
            key={nft.id.toString()}
            client={client}
            contract={contract}
            nft={nft}
          />
        ))}
      </div>

      <div className="contract-link">
        <span className="muted">Contract: </span>
        <a
          href={`https://testnet.snowtrace.io/address/${contract.address}`}
          target="_blank"
          rel="noreferrer"
        >
          {shortenAddress(contract.address)} ↗
        </a>
        <button
          type="button"
          className="copy-btn"
          onClick={copyContractAddress}
          aria-label="Copy contract address"
        >
          {addressCopied ? "Copied!" : "Copy"}
        </button>
      </div>
    </>
  );
}

function NftMintCard({
  client,
  contract,
  nft,
}: {
  client: ThirdwebClient;
  contract: NonNullable<typeof nftDropContract>;
  nft: NFT;
}) {
  const account = useActiveAccount();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<
    { type: "success" | "error"; message: string; txHash?: string } | null
  >(null);

  const tokenId = nft.id;

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

  const startTimestamp = claimCondition?.startTimestamp ?? 0n;
  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const notStartedYet = startTimestamp > 0n && nowSeconds < startTimestamp;
  const startDate = new Date(Number(startTimestamp) * 1000);

  return (
    <div className="card">
      {nft.metadata.image && (
        <div className="media-frame">
          <MediaRenderer
            client={client}
            src={nft.metadata.image}
            alt={nft.metadata.name ?? "NFT preview"}
            width="100%"
            height="auto"
            mimeType={guessImageMimeType(nft.metadata.image)}
          />
        </div>
      )}

      <h2 style={{ margin: "16px 0 4px" }}>
        {nft.metadata.name ?? `Token #${tokenId.toString()}`}
      </h2>
      {nft.metadata.description && (
        <p className="muted">{nft.metadata.description}</p>
      )}

      <div className="row">
        <span className="muted">Price</span>
        {isLoadingCondition ? (
          <span className="skeleton skeleton-text" />
        ) : (
          <span>{priceNative} AVAX</span>
        )}
      </div>
      <div className="row">
        <span className="muted">Claimed</span>
        {isLoadingCondition ? (
          <span className="skeleton skeleton-text" />
        ) : (
          <span>
            {claimed.toString()} / {maxSupply.toString()}
          </span>
        )}
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {notStartedYet && (
        <p className="muted status-pending">
          このドロップはまだ開始していません（開始予定:{" "}
          {startDate.toLocaleString("ja-JP")}）
        </p>
      )}

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
          <p style={{ margin: 0 }}>{status.message}</p>
          {status.txHash && (
            <a
              href={`https://testnet.snowtrace.io/tx/${status.txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortenTxHash(status.txHash)} ↗
            </a>
          )}
        </div>
      )}

      {soldOut ? (
        <button className="mint-btn" disabled>
          Sold Out
        </button>
      ) : notStartedYet ? (
        <button className="mint-btn" disabled>
          まだ開始していません
        </button>
      ) : (
        <ClaimButton
          client={client}
          chain={chain}
          contractAddress={contract.address}
          claimParams={{ type: "ERC1155", tokenId, quantity: BigInt(quantity) }}
          className="mint-btn"
          disabled={!account}
          onTransactionConfirmed={(receipt) =>
            setStatus({
              type: "success",
              message: "Mint成功！ウォレットのNFTタブを確認してください。",
              txHash: receipt.transactionHash,
            })
          }
          onError={(err) =>
            setStatus({ type: "error", message: `Mint失敗: ${err.message}` })
          }
        >
          {account ? "Mint（Claim）する" : "先にウォレットを接続してください"}
        </ClaimButton>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <main>
        <Gallery />
      </main>
    </Providers>
  );
}
