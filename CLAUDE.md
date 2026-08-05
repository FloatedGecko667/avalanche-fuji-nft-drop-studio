# CLAUDE.md — Avalanche Fuji NFT Drop Studio（旧称: Sepolia NFT Drop Studio）

このファイルは、Claude Code（または他のセッション）がこのディレクトリで作業を再開する際に、これまでの経緯・決定事項・未検証事項をゼロから再現できるようにするための引き継ぎメモです。README.mdは提出物としての体裁、このファイルは「なぜそうしたか」「何が終わっていて何が残っているか」を残す作業ログという役割分担にしています。

> **フォルダ名について**: ローカルのディレクトリ名は`sepolia-nft-drop-studio`のままです（開発初期にSepoliaを使う想定で作成し、その後Coworkの作業環境の制約でフォルダ名を変更できなかった）。中身は現在Avalanche Fuji向けに切り替え済みで、`package.json`の`name`は`avalanche-fuji-nft-drop-studio`。ディレクトリ名とpackage名が一致していない状態なので、混同しないこと。

---

## 1. プロジェクトの目的

大学(?)の課題として、Web3フレームワーク thirdweb を使ったNFT発行（Minting）サイトを作る。参照資料は thirdweb blog の `tag/nft-drop`。テストネット推奨、メインネット不使用。

**確定した用途**: 自分で用意したユニークなデジタルコンテンツを、数量限定・条件付き（Claim Conditionsのallowlist/供給数上限/配布期間）で配布する。ERC1155 Open Editionのような「同一コンテンツの無制限配布」ではなく、トークンID（コンテンツ）ごとに個別のClaim Conditionsを持たせる前提。README.md「1. 作ったものの説明」および`app/page.tsx`のサイト上コピーに反映済み。

**重要: 実際にデプロイしたコントラクトは`DropERC721`ではなく`DropERC1155`。** 詳細は下記「2. 確定した技術方針」の表と「3. 検証状況」を参照。当初`DropERC721`を想定していたが、thirdweb DashboardのUIが「NFT Drop (ERC721A)」から「NFT Collection」に統合されており、このテンプレートは実際には`DropERC1155`（Edition Drop）をデプロイする。フロントエンドは1トークンID＝1コンテンツとして扱うことで、当初のコンセプト（限定コレクティブル配布）を維持している。

提出要件（変更しないこと）:
- 作ったものの名称
- 作ったものの説明
- システム構成図
- 使用クラウドサービス・ソフトウェア一覧表
- ソースコード確認先URL（GitHub）
- 実際に動いていることがわかる画面ショット（本人が自分で操作して撮る。ポンチ絵は再提出対象）

---

## 2. 確定した技術方針とその理由（変更する場合は根拠を確認してから）

| 項目 | 決定 | 理由 |
|---|---|---|
| インフラ | Vercel（無料枠） | フロントはサーバーサイドで秘密鍵・機密情報を扱わない（非カストディアル）。バックエンドAPI/DBが不要なため、CLAUDE.mdグローバル方針の「プライベートクラウド前提の場合はDocker Compose/K8s必須」という条件が非適用と判断。バックエンドを追加する要件が生じたら、Oracle Cloud Free Tire + Docker Composeに切り替える。 |
| テストネット | **Avalanche Fuji**（Chain ID 43113）。旧: Ethereum Sepolia | 当初はSepoliaを採用したが、Ethereum FoundationがSepoliaのEOLを2026年9月30日頃と発表していることが判明。Base/Arbitrum/Optimism SepoliaはSepoliaをL1決済層とするため同じ影響を受け、Hoodiはdapp開発非推奨（公式にSepolia利用を推奨）、Polygon AmoyはSepoliaをroot chainとするチェックポイント依存構造かつ執筆時点で公式無料RPCが2026年7月17日に廃止予定と判明。これらを除外し、Ethereumのロードマップから独立した独自L1テストネットであるAvalanche Fujiに変更（EOL未発表）。詳細な比較根拠はREADME.md「9. セキュリティ上の注意」に記載。 |
| コントラクト方式 | **DropERC1155**（NFT Collection + Lazy Mint + Claim Conditions） | 当初`DropERC721`（`nft-drop`タグに整合）を想定していたが、thirdweb Dashboardの「NFT Collection」テンプレートが実際にデプロイするのはDropERC1155だったため、これに合わせてフロントエンドを書き換えた（`thirdweb/extensions/erc1155`使用、tokenIdごとにClaim Conditions/Supplyを管理）。Dashboard上でコントラクトの`contractType()`を直接呼び出し`0x44726f7045524331313535`（ASCII: "DropERC1155"）であることを実機で確認済み。 |
| フロントエンド | Next.js 16.2.11 (App Router) + thirdweb SDK v5 + TypeScript | thirdweb公式テンプレートとの一致度を優先し、Viteより情報量で詰まりにくいNext.jsを選択。 |
| Next.jsバージョン | **16.2.11で固定**（`latest`タグ） | 16.3は`preview`/`canary`タグでのみ配布されており、`latest`にはまだ乗っていない（2026年7月時点）。プレビュー版のAPI変更リスクを課題の締切前に負う理由がないため据え置き。**新しいNext.jsが出ていても、`npm view next dist-tags`で`latest`昇格を確認するまでは上げないこと。** |
| TypeScript | **7.0.2**（`latest`タグ、Go移植ネイティブコンパイラ、2026年7月8日GA） | 当初 `^5.6.3` は未確認のまま決め打ちしていた不備。指摘を受けて`npm view typescript dist-tags`で確認し、6.0.3→最終的にユーザー指示で7.0.2に変更。 |

### テストネットに関する既知の注意点（Avalanche Fuji移行後）

- Chain ID: `43113`、ネイティブ通貨: AVAX（Sepolia時代のETH表記は全箇所AVAXに置換済み。`app/page.tsx`の価格表示、`.env.example`コメント、README全体を確認済み）。
- RPC: `https://43113.rpc.thirdweb.com`（thirdweb公式）。Explorer: `https://testnet.snowtrace.io`。
- faucet: thirdweb公式faucet（`https://thirdweb.com/avalanche-fuji`、0.01 AVAX/日）、Avalanche公式Core faucet。
- `lib/client.ts`で`thirdweb/chains`から`avalancheFuji`をimportして使用（旧`sepolia`から変更済み）。exportの存在は`node_modules/thirdweb/dist/types/chains/chain-definitions/avalanche-fuji.d.ts`で実際に確認済み。
- 現時点（2026年7月）でAvalanche FujiのEOL発表は確認されていないが、これも将来変わりうる前提情報なので、長期間放置したプロジェクトを再開する際は改めてWeb検索で現状を確認すること。

### TypeScript 7系についての既知の注意点

- `tsc --noEmit` は 6.0.3 / 7.0.2 の両方でクリーンに通ることを確認済み（サンドボックス内、`/tmp`のローカルディスク上で実施）。
- ただし、Next.jsの内部型チェックや`typescript-eslint`が使う**プログラマティックAPI**（`typescript`パッケージをlibraryとしてimportする経路）の安定版は**7.1で提供予定**。2026年7月時点で7.1はnightly開発ビルド(`7.1.0-dev.*`)のみでGAしていない。
- もし`npm run build`や`npm run lint`でTypeScript API起因の想定外のエラーが出た場合、`package.json`の`typescript`を`^6.0.3`に戻すのが安定な代替。7.1が正式GAしたら7系に統一してよい。

---

## 3. 検証状況（2026年7月26日時点、実機検証済み）

ローカルPC（macOS, Node v26.5.x）とVercel本番環境の両方で実際に検証済み。

- ✅ `npm install` 完走（初回は同一ディレクトリに残っていた壊れた`package-lock.json`が原因で`Invalid Version`エラーが発生したが、`--no-package-lock`で回避し再生成して解消）。
- ✅ `tsc --noEmit -p tsconfig.json` エラーゼロ。
- ✅ `next build`（Turbopack）成功。ローカル・Vercel本番ビルドの両方で確認済み（サンドボックス特有の"Bus error"は実機では再現しなかった）。
- ✅ TypeScript 7.0.2使用中に、Next.jsの内部TypeScript検出ロジックが誤動作し`next build`が謎の`The "id" argument must be of type string`エラーで失敗する事象を確認。本ファイル44行目に記載の対処法どおり`^6.0.3`にダウングレードして解消（7.1安定版が出るまでこのままにする）。
- ✅ thirdweb依存の`@coinbase/cdp-sdk`が使わないx402決済機能向けに未公開の`@x402/*`パッケージを動的import しており、ビルドを妨げていた。`next.config.mjs`でwebpack/turbopack双方に`resolveAlias`を設定し、`lib/x402-stub.js`という空スタブに差し替えて解消（コメントで経緯を記載済み）。
- ✅ `app/page.tsx`の実コードバグ（`nftDropContract!`の非null断定）がprerenderをクラッシュさせていたのを、コンポーネント分割で解消。
- ✅ **コントラクトを実際にAvalanche Fuji上へデプロイ済み**: アドレス `0x1D7C388c8cee7A2315EEe5670203574bb393B17e`（`contractType()`実行でDropERC1155と確認済み）。テスト画像（Cliffordストレンジアトラクタの生成アート）をLazy Mint、Price 0 AVAX / Supply 1000でClaim Conditions設定済み。
- ✅ GitHubへpush済み、Vercel本番デプロイ済み、環境変数（Client ID・コントラクトアドレス）設定済み。サイトが実際に価格・Claimed数・NFT画像プレビューを正しく表示することをブラウザで確認済み。
- ✅ **実際のウォレットでのmintトランザクション実行が完了**（2026年8月5日）。詳細は下記「3.7」参照。
- ❌ `next lint` は未検証。
- ❌ README section 8への最終スクリーンショット貼り付けは未実施（撮影済みの画面をREADMEに反映する作業が残っている）。

---

## 3.7 mintトランザクション実行 完了記録（2026年8月5日）

前回セッションでガス代不足によりブロックされていた問題は解消し、実際のmintに成功した。**次回同種の課題を再現する場合のために、成功した経路をそのまま記録する。**

**資金調達に成功した経路**（前回失敗した4案とは別の組み合わせ）:

1. thirdweb Dashboard（`thirdweb.com/avalanche-fuji`）のfaucetで24時間クールダウン明けを確認し、「Get 0.01 AVAX」を実行 → `thirdweb.com`自身のclientIdスコープの埋め込みウォレット `0x86993bCe97c2B5A98BD30FD3562884CCDF13f3ba` に0.01 AVAX着金。
2. `0x8699...f3ba`のウォレットUIから「Send Funds」でAvalanche Fujiを再度探索したところ、今回はToken選択欄に「Avalanche」（Testnet/Fuji）が表示され、**カスタムネットワーク手動追加は不要だった**（前回「見つからない」としていたのは初回にネットワーク一覧のキャッシュ未更新か操作ミスだった可能性が高い。次回詰まったら再読み込みや別画面からのやり直しをまず試すこと）。
3. 送金時、送金先アドレスを一度目は不正な形式でエラー（`Invalid receiver address`。コピペ時の文字欠けが原因の可能性）→ アドレスを`0xeDbFD4257C03af80A6Ea524724641f0851dBdC7d`と手動で正確に再入力して解消。
4. 二度目、保有全額の0.01 AVAXを送金しようとして`Insufficient Funds`エラー（送金トランザクション自体のガス代が残らないため）→ **送金額を0.008 AVAXに減らす**（0.002 AVAXをガス代用に残す）ことで送金成功。
5. サイトのウォレット`0xeDbFD4257C03af80A6Ea524724641f0851dBdC7d`に0.008 AVAX着金をSnowtraceで確認後、サイトで「Mint（Claim）する」を実行 → 成功。

**得られた教訓（次回このパターンに詰まったら参照）**:
- thirdweb系ウォレットUIで他ウォレットへ送金する際は、**保有額ちょうどではなく、ガス代分（0.001〜0.002 AVAX程度）を差し引いた額を指定する**こと。
- 送金先アドレスのコピペは失敗することがある。エラーが出たら再入力で解消することが多い。
- Fujiがネットワーク選択に出ないという前回の観測は再現しなかった。次回同じ問題に当たったら、まず画面の再読み込み・別のエントリーポイント（ウォレット詳細ページ直接アクセス等）を試してから、カスタムネットワーク追加に進む。

**実際に成功したmintトランザクション**:
- Transaction Hash: `0x5ebe702b1a964c67818fbd49949ba4e43dd58bf8175c280fc13e1f0163591e57`
- Method: `Claim`、Status: `Success`
- From: `0xeDbFD4257C03af80A6Ea524724641f0851dBdC7d`
- Token: ERC-1155 Token ID `0`、コントラクト `0x1D7C388c8cee7A2315EEe5670203574bb393B17e` から1個受領
- Value: `0 AVAX`（price通り無料）、Gas: `0.00002713 AVAX`
- Claimed数: `0/1000` → `1/1000`

**撮影済みスクリーンショット**（README section 8用、ローカルに未保存の場合は再度同じ操作で撮り直し可能）:
- ✅ ウォレット接続後、Price/Claimedが表示されている画面
- ✅ mint成功画面（トランザクションリンク表示、`onTransactionConfirmed`のUIが動作することを実機確認）
- ✅ Snowtraceでのトランザクション詳細画面（ERC-1155 Tokens Transferredが表示されmintを裏付け）
- ❌ サイトのトップ画面（ウォレット未接続時） — 未撮影の場合は次回撮ること
- ❌ ウォレットの署名確認ダイアログ — embedded walletはパスキー/自動署名フローのため、明示的な署名ダイアログ画面がなかった可能性がある。次回mintする際（Quantityを増やして再Claim等）に、署名関連のUIが出るタイミングがあれば撮影すること。

---

## 4. 自分（AI）ではできない残作業（ユーザー本人がやる必要がある）

以下は完了済み: thirdweb Client ID発行・コントラクトデプロイ・Lazy Mint・Claim Conditions設定・`.env.local`/Vercel環境変数設定・GitHubへのpush・Vercelへのデプロイ・ガス代調達・実際のmintトランザクション実行（詳細は上記「3.7」）。

残っているのは:

1. README section 8に、撮影済み screenshot を実際に貼り付ける（トップ画面・署名ダイアログ相当の画面が未撮影なら追加撮影も）
2. `next lint` の実行・確認

---

## 3.5 フロントエンドの実装済み機能（`app/page.tsx`）

複数のNFTミントサイト構築ガイド記事を参考に、以下を実装・検証済み。追加のクオリティ改善が必要になった場合はこのリストと差分を取ること。

- **複数NFT対応のギャラリー形式**: `getNFTs()`で全Lazy MintトークンIDを取得し、トークンIDごとに独立したミントカードを表示（`tokenId`ハードコード時代の制約を解消済み）。新しいNFTをDashboardで追加するだけでコード変更なしにギャラリーへ反映される。
- **NFT画像プレビュー**: `MediaRenderer`使用。本番環境で自動MIMEタイプ検出が失敗し画像が表示されない不具合があったため、`guessImageMimeType()`でファイル拡張子から明示的に`mimeType`を渡している（原因調査の詳細はgit historyのコミットメッセージ参照）。
- **進捗バー・Sold Out状態**: Claimed/Supplyを視覚的に表示し、供給上限に達すると自動で「Sold Out」ボタンに切替。
- **数量入力の安全な上限**: 残り供給数・`quantityLimitPerWallet`・固定上限5のうち最小値に自動制限。
- **クレーム開始前の状態表示**: `claimCondition.startTimestamp`が未来の場合「まだ開始していません」ボタンに切替。
- **ミント成功後のトランザクションリンク**: `onTransactionConfirmed`のreceiptから`transactionHash`を取得しSnowtraceへリンク。
- **コントラクトアドレスのコピーボタン**: `navigator.clipboard.writeText`使用、失敗時は静かにフォールバック（自動化ブラウザ環境では権限拒否でエラーになることを確認済み、実ブラウザでは問題ない）。
- **ロード中のスケルイトン表示**: Price/Claimedのロード中はシマーアニメーション付きスケルトンに変更（`isLoadingCondition`分岐）。
- **インライン通知**: `alert()`ではなくカード内のステータスバナーで成功/失敗を表示。

- **複数チェーン対応のウォレット接続**: `ConnectButton`に`chains`（`lib/client.ts`の`supportedWalletChains`: Ethereum/Polygon/Arbitrum/Optimism/Base/BSC/Avalanche/Avalanche Fuji）を渡し、他ネットワーク上のウォレットでも接続できるようにした。mint自体は常にAvalanche Fuji（`chain`）を対象にする。
- **チェーン不一致警告バナー**: `useActiveWalletChain`で現在の接続chainを取得し、Avalanche Fuji以外なら警告バナーと「切り替える」ボタン（`useSwitchActiveWalletChain`）を表示。
- **保有NFT一覧（My NFTs）**: `getOwnedNFTs`（`thirdweb/extensions/erc1155`）で接続ウォレットの保有NFTを一覧表示。**`useIndexer: false`を明示的に指定している**（重要: デフォルトの`useIndexer: true`はthirdweb Insightインデクサーを使うが、Avalanche Fujiや直後にmintしたばかりのトークンはインデックスが反映されておらず空配列が返ってくることを実機で確認したため、オンチェーンRPC直読みに固定した）。
- **FAQ / How to mintセクション**: 静的な4項目（必要なもの・faucet入手先・mint手順・mint後の確認方法）。

未実装のまま検討候補として残っているもの（優先度は低い、必要になれば着手）:
- SNSシェアボタン

---

## 3.6 ハマりどころ（次回同じ罠を踏まないための記録）

- **Node.jsの自動アップグレードでグローバルnpmパッケージが消える**: Homebrewの`node`が26.5.0→26.5.1のように自動更新されると、`npm i -g`でインストールした`vercel`等のCLIが「command not found」になる（Cellarのパスが変わるため）。`npm i -g vercel`で再インストールするか、`/opt/homebrew/Cellar/node/<version>/bin/vercel`のようにフルパスで叩く。
- **`.env.local`はEdit/Writeツールで直接編集できない**（セキュリティフックでブロックされる）。`vercel env add <name> <environment>`→`vercel env pull .env.local`の順で間接的に同期する。
- **ホームディレクトリの無関係な`package-lock.json`がNext.jsのworkspace root検出を狂わせる**ことがある。`next.config.mjs`の`outputFileTracingRoot`で明示的にプロジェクトルートを固定すると回避できる。
- **thirdweb Dashboardのブラウザセッションは短時間で切れる**（実測で1日程度）。再開時は再ログインが必要。ログインはGoogle/Email等のOAuthで、パスワード入力はAIが代行してはいけない領域なのでユーザー本人に依頼すること。
- **テストネットfaucetの多くは新規ウォレットでは使えない**: Core WalletやQuickNodeの公式faucetは「メインネット残高がゼロより大きいこと」や「reCAPTCHA」を要求する。thirdweb Dashboard内蔵のfaucet（プロジェクトのOverviewページ）が最も簡単だが24時間に1回のクールダウンがある。

---

## 5. ディレクトリ構成

```
sepolia-nft-drop-studio/        # ← ディレクトリ名は旧称のまま（上記の注記参照）
├── README.md              # 提出用ドキュメント本体（名称・説明・構成図・一覧表・手順・SS欄）
├── CLAUDE.md              # このファイル（作業引き継ぎ用）
├── package.json            # nameは"avalanche-fuji-nft-drop-studio"
├── tsconfig.json
├── next.config.mjs
├── .env.example           # NEXT_PUBLIC_TEMPLATE_CLIENT_ID / NEXT_PUBLIC_NFT_DROP_CONTRACT_ADDRESS
├── .gitignore             # node_modules, .env*, .next等を除外
├── next.config.mjs        # x402スタブのwebpack/turbopack resolveAlias設定を含む
├── app/
│   ├── layout.tsx          # title: "Avalanche Fuji NFT Drop Studio"
│   ├── providers.tsx      # ThirdwebProviderでラップ
│   ├── page.tsx           # NFTギャラリー（getNFTsで全トークン取得→各トークンごとにMintカード）
│   └── globals.css
├── lib/
│   ├── client.ts          # createThirdwebClient / getContract の初期化。chain = avalancheFuji
│   └── x402-stub.js       # thirdweb依存が使わないx402決済機能の空スタブ（ビルド回避用）
└── docs/
    └── architecture.mmd   # システム構成図のMermaidソース（DropERC1155表記に更新済み、README内にも埋め込み済み）
```

---

## 6. セキュリティ上、絶対に守ること

- `.env.local`・秘密鍵・Secret Keyはコード/コミットに一切含めない（`.gitignore`で除外済み、方針を変えない）。
- `NEXT_PUBLIC_`プレフィックスの変数はクライアントに公開される前提。Client IDのみこの形式で扱い、Secret Keyを`NEXT_PUBLIC_`にしない。
- 取引の署名は常にユーザーのウォレット内で完結させる。サーバーサイドで秘密鍵を扱う実装を追加しない。

---

## 7. このファイルの更新方針

技術選定を変更した場合（バージョンアップ、インフラ変更、コントラクト方式変更など）は、このファイルの該当セクションも同時に更新すること。README.mdは提出物としての完成形、CLAUDE.mdは意思決定の経緯と最新の未検証事項を追い続けるためのファイル。チェーンやテストネットを再度変更する場合は、変更対象ファイルの一覧（`lib/client.ts`のchain import、`app/page.tsx`のUI文言と価格通貨単位、`app/layout.tsx`のmetadata、`docs/architecture.mmd`、README全体、`.env.example`コメント）をこのファイルに残すこと。
