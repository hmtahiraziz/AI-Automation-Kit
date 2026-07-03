import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[#F7F8F6]">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="app-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
