import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ReadCraft",
  description: "README AI Generator with Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>
          AI README Generator – Instant Professional Project READMEs
        </title>
        <meta
          name="description"
          content="Generate high-quality, AI-powered README.md files for your GitHub projects. No coding needed."
        />
        <meta
          name="keywords"
          content="README Generator, GitHub, AI README, markdown, documentation generator, open source"
        />
        <meta name="author" content="Ashwajit Tayade" />

        {/* Open Graph for social media */}
        <meta property="og:title" content="AI README Generator" />
        <meta
          property="og:description"
          content="Instantly generate a README.md for your project with AI."
        />
        <meta property="og:image" content="/social-preview.png" />
        <meta property="og:url" content="https://read-craft-phi.vercel.app/" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI README Generator" />
        <meta
          name="twitter:description"
          content="Create beautiful README files for your GitHub projects using AI."
        />
        <meta name="twitter:image" content="/social-preview.png" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
