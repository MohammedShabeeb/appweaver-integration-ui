import type { Metadata } from "next";
import { Montserrat, Space_Grotesk } from "next/font/google";
import "./globals.css";

const montserratBody = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Next UI",
  description: "Workflow builder UI with React Flow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserratBody.variable} ${spaceGrotesk.variable} ${montserrat.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
