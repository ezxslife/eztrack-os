import { createContext, useContext, type ReactNode } from "react";

const GlassDepthContext = createContext(0);

export function useGlassDepth() {
  return useContext(GlassDepthContext);
}

export function GlassDepthLayer({ children }: { children: ReactNode }) {
  const parentDepth = useGlassDepth();

  return (
    <GlassDepthContext.Provider value={parentDepth + 1}>
      {children}
    </GlassDepthContext.Provider>
  );
}
