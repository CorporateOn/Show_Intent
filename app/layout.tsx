import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";
import { getInitialServerData } from "@/lib/data";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "SmartQR Menu - The Future of Dining",
  description: "A modern, QR-code based digital restaurant menu.",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialData = await getInitialServerData();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-brand-light`}>
        <AppProvider initialData={initialData}>
          <div className="min-h-screen">
            <Header />
            <main>{children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}