import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicles — EZTrack",
  description: "Track and manage vehicles on event grounds",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
