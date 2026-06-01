import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  applicationName: "TeachPad",
  title: "TeachPad",
  description: "Textbook-grounded lesson plans and worksheets for teachers",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
