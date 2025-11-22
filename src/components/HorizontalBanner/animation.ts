// CSS-only mode: provide no-op helpers to preserve imports
export type BannerAnimOptions = { speed?: number };

export function initHorizontalBanner() {
  return {
    tl: { play: () => {}, pause: () => {}, kill: () => {} } as any,
    kill: () => {},
  };
}

export function refreshBannerScrollTriggers() {}
