import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar"; // Adjust the path as needed

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WealthFlow - Smart Budget Management",
  description: "A decentralized personal finance app for budgeting and expenses tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
          {/* Sidebar */}
          <div className="hidden md:block relative w-72">
            <Sidebar />
          </div>
          
          {/* Mobile Sidebar Placeholder - Could add responsive hamburger menu */}
          <div className="md:hidden">
            {/* Mobile menu would go here */}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-4 pl-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}