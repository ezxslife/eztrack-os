import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visitor Management — EZTrack",
  description: "Track and manage event visitors and credentials",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
