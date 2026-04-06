import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics — EZTrack",
  description: "Operational analytics and performance dashboards",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
