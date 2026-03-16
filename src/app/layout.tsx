import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoftChip Studio - Build Real Systems with Software Microchips",
  description: "Visual programming platform for building data processing systems, protocol handlers, and automation pipelines with drag-and-drop algorithmic soft chips. No hardware required.",
  keywords: ["SoftChip Studio", "visual programming", "software microchips", "data processing", "signal processing", "protocol testing", "IoT development", "DSP", "UART", "Modbus", "FFT", "PID controller", "no-code", "low-code"],
  authors: [{ name: "SoftChip Studio Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SoftChip Studio - Build Real Systems with Software Microchips",
    description: "Visual programming platform for building data processing systems with drag-and-drop algorithmic soft chips.",
    url: "https://softchip.studio",
    siteName: "SoftChip Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoftChip Studio - Build Real Systems with Software Microchips",
    description: "Visual programming platform for building data processing systems with drag-and-drop algorithmic soft chips.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
