import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Log — EZTrack",
  description: "Daily operational log entries and shift records",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
