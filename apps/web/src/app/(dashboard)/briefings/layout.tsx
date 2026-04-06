import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Briefings — EZTrack",
  description: "Create and manage shift briefings and announcements",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
