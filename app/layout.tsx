import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import Header from "@/components/Navbar/header";
import FooterProfile from "@/components/Footer/footer-profile";

import { headers } from "next/headers";
import ProgressBar from "@/components/Old/Loader";

import ErrorBoundary from "@/components/Old/ErrorBoundary";
import OfflineWrapper from "@/components/Old/Offline/OfflineWrapper";
import ContextProvider from "@/context";
import { GlobalProvider } from "@/context/global";
import { AffiliateProvider } from "@/context/affiliate";
import { RamicoinProvider } from "@/context/trackrecord";
import PageTransition from "@/components/Transition/PageTransition";
// import ICOBannerWrapper from "@/components/IcoBanner/IcoWrapper";
import { AdminProvider } from "@/context/adminContext";
import { ChessProvider } from "@/context/chesscontext";

export const metadata: Metadata = {
  metadataBase: new URL("https://ramicoin.com"),
  title: "The RamiCoin",
  description: `Redefining the asset management globally, on chain.`,
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport = {
  themeColor: "rgb(241 232 228)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: 1,
  shrinkToFit: "no",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const cookies = headers().get("cookie");

  return (
    <html
      lang="en"
      className="light overflow-x-clip"
      style={{ colorScheme: "light" }}
    >
      <body
        className={`overflow-x-hidden antialiased min-w-screen min-h-screen bg-[url(/images/texture.png)] bg-[172px_auto] bg-blend-multiply bg-neutral-01-150 text-fern-1100 pt-[env(safe-area-inset-top,0)]`}
      >
        <ErrorBoundary>
          <OfflineWrapper>
            <ContextProvider cookies={cookies}>
              <AdminProvider>
                <GlobalProvider>
                  <AffiliateProvider>
                    <ChessProvider>
                      <PageTransition>
                        <RamicoinProvider>
                          <div className="grid layout relative gap-x-4 xl:gap-x-6 2xl:gap-x-8 max-w-[1728px] mx-auto items-baseline">
                            <ThemeProvider
                              attribute="class"
                              defaultTheme="light"
                              enableSystem
                            >
                              <ProgressBar />
                              {/* <ICOBannerWrapper /> */}
                              <Header />
                              {children}
                              {/* <FooterProfile /> */}
                            </ThemeProvider>
                          </div>
                        </RamicoinProvider>
                      </PageTransition>
                    </ChessProvider>
                    <Analytics />
                  </AffiliateProvider>
                </GlobalProvider>
              </AdminProvider>
            </ContextProvider>
          </OfflineWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
