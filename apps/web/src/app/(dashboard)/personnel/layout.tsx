import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personnel — EZTrack",
  description: "Manage security personnel and staff assignments",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
