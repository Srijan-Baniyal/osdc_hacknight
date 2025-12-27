import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/Dashboard/DashboardSidebar";
import { Navbar } from "@/components/Dashboard/DashboardNavbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatDashboardProvider } from "@/context/ChatContext";

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
    <SidebarProvider>
      <ChatDashboardProvider>
        <DashboardSidebar />
        <SidebarInset>
          <Navbar />
          <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
        </SidebarInset>
      </ChatDashboardProvider>
    </SidebarProvider>
  );
}
