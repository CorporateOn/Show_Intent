// app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";
import { getInitialServerData } from "@/lib/data"; // Import the new function

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

// This metadata can remain as is.
export const metadata: Metadata = {
  title: "SmartQR Menu - The Future of Dining",
  description: "A modern, QR-code based digital restaurant menu.",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

// The function is now ASYNC
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch data on the server BEFORE rendering
  const initialData = await getInitialServerData();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-brand-light`}>
        {/* Pass the server-fetched data directly to the provider */}
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