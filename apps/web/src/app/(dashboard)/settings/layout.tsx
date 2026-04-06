import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — EZTrack",
  description: "Configure application settings and preferences",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
