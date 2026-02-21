import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRC Active Case List",
  description: "California Raptor Center - Active Case Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
