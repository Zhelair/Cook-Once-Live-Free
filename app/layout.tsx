import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiet Pantry | Cook Once, Live Free",
  description: "A calm kitchen operating system for batch cooking, offers and leftovers.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
