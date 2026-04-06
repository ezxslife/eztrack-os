import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incidents — EZTrack",
  description: "Manage and track security incidents",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
