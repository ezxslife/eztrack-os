import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts — EZTrack",
  description: "Manage contacts and key personnel directory",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
