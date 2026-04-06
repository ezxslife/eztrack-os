import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports — EZTrack",
  description: "Generate and view operational reports",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
