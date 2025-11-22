import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type DrawerId = "menu" | "cart";

export type DrawerManagerValue = {
  active: DrawerId | null;
  open: (id: DrawerId) => void;
  close: () => void;
  toggle: (id: DrawerId) => void;
  isOpen: (id: DrawerId) => boolean;
};

const DrawerManagerContext = createContext<DrawerManagerValue | null>(null);

export const DrawerProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [active, setActive] = useState<DrawerId | null>(null);

  useEffect(() => {
    const body = document.body;
    if (!body) return;

    if (active) {
      const previousOverflow = body.style.overflow;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = previousOverflow;
      };
    }

    body.style.overflow = "";
    return () => {
      body.style.overflow = "";
    };
  }, [active]);

  const value = useMemo<DrawerManagerValue>(
    () => ({
      active,
      open: (id) => setActive(id),
      close: () => setActive(null),
      toggle: (id) => setActive((current) => (current === id ? null : id)),
      isOpen: (id) => active === id,
    }),
    [active]
  );

  return (
    <DrawerManagerContext.Provider value={value}>
      {children}
    </DrawerManagerContext.Provider>
  );
};

export function useDrawerManager() {
  const ctx = useContext(DrawerManagerContext);
  if (!ctx)
    throw new Error("useDrawerManager must be used within DrawerProvider");
  return ctx;
}
