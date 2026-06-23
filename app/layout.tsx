import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photo Gallery Manager",
  description: "Hệ thống quản lý ảnh chuyên nghiệp cho nhiếp ảnh gia",
  // icons: {
  //   icon: '/icon.png',
  //   shortcut: '/icon.png',
  //   apple: '/icon.png',
  // },
};
//add
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
