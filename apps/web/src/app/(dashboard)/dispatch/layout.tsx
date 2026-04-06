import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dispatch Board — EZTrack",
  description: "Real-time dispatch coordination and officer management",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
