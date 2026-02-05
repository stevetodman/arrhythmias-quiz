import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arrhythmia Quiz - Park's Pediatric Cardiology",
  description:
    "Interactive quiz for learning pediatric cardiac arrhythmias based on Park's Pediatric Cardiology. Test your knowledge on sinus rhythms, atrial arrhythmias, ventricular arrhythmias, and channelopathies.",
  keywords: [
    "arrhythmia",
    "pediatric cardiology",
    "ECG",
    "medical education",
    "quiz",
    "Park's",
  ],
  authors: [{ name: "MedX LMS" }],
  openGraph: {
    title: "Arrhythmia Quiz - Park's Pediatric Cardiology",
    description:
      "Master pediatric cardiac arrhythmias with interactive quizzes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
          {children}
        </div>
      </body>
    </html>
  );
}
