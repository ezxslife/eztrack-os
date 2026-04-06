import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Management — EZTrack",
  description: "Manage and investigate security cases",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
