import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:pl-72 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 pt-20 md:pt-6 max-w-6xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
