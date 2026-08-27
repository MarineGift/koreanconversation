import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import { getOrg } from "@/lib/org";
import TrackVisit from "@/components/TrackVisit";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrg();
  const name = org?.name ?? 'Korean Coaching';
  const tagline = org?.tagline ?? 'Premium 1:1 Korean for Professionals';
  return {
    title: `${name} — ${tagline}`,
    description: 'Master premium Korean pronunciation and expression with an expert coach from Seoul National University.',
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased overflow-x-hidden`}
      >
        {children}
        <TrackVisit />
      </body>
    </html>
  );
}