import type { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Dashboard/DashBoardSidebar";
import { Navbar } from "@/components/Dashboard/DashboardNavbar";

export const metadata: Metadata = {
  title: "Percepta Dashboard",
  description: "Percepta - Ask anything to the links you have",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Navbar />
          <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
