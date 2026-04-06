import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patron Management — EZTrack",
  description: "Track and manage event patrons and flagged individuals",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
