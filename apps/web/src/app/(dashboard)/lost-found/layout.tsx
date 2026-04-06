import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lost & Found — EZTrack",
  description: "Manage lost and found items at events",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
