import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seoul Stay Goshiwon",
  description: "Foreigner-friendly goshiwon website with room listings and request-to-book flow.",
  openGraph: {
    title: "Seoul Stay Goshiwon",
    description: "Short-term and monthly rooms in Seoul for foreign guests.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-sand text-ink antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
