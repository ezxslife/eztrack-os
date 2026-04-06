import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work Orders — EZTrack",
  description: "Track and manage maintenance and repair work orders",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
