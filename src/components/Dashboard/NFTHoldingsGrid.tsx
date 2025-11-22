import { useMemo, useState } from "react";
import { useDashboardData } from "./DashboardDataProvider";

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const NFTHoldingsGrid = () => {
  const { nfts } = useDashboardData();
  const [selectedCollection, setSelectedCollection] = useState<string | "all">(
    "all"
  );

  const collections = useMemo(() => {
    const uniqueCollections = new Map<string, number>();
    nfts.forEach((nft) => {
      uniqueCollections.set(
        nft.collectionId,
        (uniqueCollections.get(nft.collectionId) ?? 0) + 1
      );
    });

    return Array.from(uniqueCollections.entries()).map(
      ([collectionId, count]) => ({
        collectionId,
        count,
      })
    );
  }, [nfts]);

  const filteredNfts = useMemo(() => {
    if (selectedCollection === "all") {
      return nfts;
    }

    return nfts.filter((nft) => nft.collectionId === selectedCollection);
  }, [nfts, selectedCollection]);

  if (nfts.length === 0) {
    return (
      <div className="p-6 text-sm bg-white border rounded-xl border-neutral-200 text-neutral-500">
        No NFT holdings synced yet. Connect the marketplace integration to
        populate this area.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedCollection("all")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            selectedCollection === "all"
              ? "border-black bg-black text-white"
              : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          All Collections ({nfts.length})
        </button>
        {collections.map(({ collectionId, count }) => (
          <button
            key={collectionId}
            type="button"
            onClick={() => setSelectedCollection(collectionId)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              selectedCollection === collectionId
                ? "border-black bg-black text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {collectionId} ({count})
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredNfts.map((nft) => (
          <article
            key={`${nft.collectionId}-${nft.tokenId}`}
            className="flex flex-col overflow-hidden transition bg-white border shadow-sm group rounded-xl border-neutral-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative w-full h-48 overflow-hidden bg-neutral-100">
              {nft.thumbnailUrl ? (
                <img
                  src={nft.thumbnailUrl}
                  alt={nft.tokenName}
                  className="object-cover w-full h-full transition group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-sm text-neutral-500">
                  No preview
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1 gap-3 p-4">
              <header className="flex flex-col gap-1">
                <span className="text-xs tracking-wide uppercase text-neutral-400">
                  {nft.collectionId}
                </span>
                <h3 className="text-base font-semibold text-neutral-900">
                  {nft.tokenName}
                </h3>
              </header>
              <dl className="space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <dt className="text-xs tracking-wide uppercase text-neutral-400">
                    Token ID
                  </dt>
                  <dd className="font-mono text-xs">{nft.tokenId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs tracking-wide uppercase text-neutral-400">
                    Last Synced
                  </dt>
                  <dd>{formatDate(nft.lastSyncedAt)}</dd>
                </div>
              </dl>
              {/* <div className="p-3 mt-auto text-xs rounded-lg bg-neutral-100 text-neutral-600">
                <pre className="overflow-auto break-all whitespace-pre-wrap max-h-32">
                  {JSON.stringify(nft.metadata ?? {}, null, 2)}
                </pre>
              </div> */}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NFTHoldingsGrid;
