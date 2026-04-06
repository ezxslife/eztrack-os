import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alert Center — EZTrack",
  description: "View and manage system alerts and notifications",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
