import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

const NativeHeaderContext = createContext(false);

export function NativeHeaderProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const inherited = useContext(NativeHeaderContext);
  const value = enabled ?? inherited;

  return (
    <NativeHeaderContext.Provider value={value}>
      {children}
    </NativeHeaderContext.Provider>
  );
}

export function useHasNativeHeader() {
  return useContext(NativeHeaderContext);
}
