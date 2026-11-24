import "./globals.css";
import { Roboto, JetBrains_Mono, Unbounded, Hanken_Grotesk } from "next/font/google";
import Providers from "../components/Providers";
import Sidebar from "../components/Sidebar";
import { Cursor, OfflineBanner, LoadingSplash } from "../components/ui";
import ToastStack from "../components/Toast";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const unbounded = Unbounded({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-unbounded" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

export const metadata = {
  title: "Z's HMS | Hospital Management",
  description: "Patient records and appointment scheduling.",
};

// Set the saved theme before paint, so there is no light/dark flash.
const themeScript = `try{var t=localStorage.getItem('hms-theme');if(t==='dark'||(!t&&window.matchMedia&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en"
      className={`${roboto.variable} ${jetbrains.variable} ${unbounded.variable} ${hanken.variable}`}
      suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <Providers>
          <Cursor />
          <LoadingSplash />
          <div className="flex min-h-screen flex-col lg:flex-row">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <OfflineBanner />
              <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
                <div className="mx-auto w-full max-w-[1240px]">{children}</div>
              </main>
            </div>
          </div>
          <ToastStack />
        </Providers>
      </body>
    </html>
  );
}
