import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ReferralCapture } from "@/components/referral-capture";

const siteTitle = "TeachPad | AI Lesson Plans & Worksheets for Teachers";
const siteDescription = "Create textbook-based lesson plans, worksheets, notes, presentations, quizzes, and classroom activities in seconds with TeachPad AI.";

export const metadata: Metadata = {
  metadataBase: new URL("https://teachpad.in"),
  applicationName: "TeachPad",
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://teachpad.in",
    siteName: "TeachPad",
    images: [
      {
        url: "/landing/teachpad-main-hero-centered.png",
        width: 1672,
        height: 941,
        alt: "TeachPad turns one textbook chapter into AI-generated teaching resources."
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/landing/teachpad-main-hero-centered.png"]
  },
  appleWebApp: {
    capable: true,
    title: "TeachPad",
    statusBarStyle: "default"
  },
  formatDetection: { telephone: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0165fd"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-ZC7B99HTG0" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZC7B99HTG0');
          `}
        </Script>
        <Providers>
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
