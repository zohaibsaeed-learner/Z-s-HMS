import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Sidebar from "../components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata = { title: "Z's HMS", description: "Hospital Management System" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-canvas font-sans text-ink antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1 px-10 py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}