import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Package, Users, FileText, LogOut, LayoutDashboard, AreaChart, History, PlusCircle, Pencil, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { logout } = useAuthStore();

  const routes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Create Invoice", icon: FileText, href: "/dashboard/company" },
    { label: "Items", icon: Package, href: "/dashboard/items" },
    { label: "Customers", icon: Users, href: "/dashboard/company" },
    { label: "Sales Report", icon: AreaChart, href: "/dashboard/sales-report" },
    { label: "Manage Payments", icon: Wallet, href: "/dashboard/payments" },
    { label: "History", icon: History, href: "/dashboard/history" },
    { label: "Edit Invoice", icon: Pencil, href: "/dashboard/edit-invoice" },
    { label: "Add Item", icon: PlusCircle, href: "/dashboard/add-item" },
    { label: "Junk Customers", icon: Trash2, href: "/dashboard/junk" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard/company" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Invoice Pro</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {routes.map((route) => (
          <Link
            key={route.href + route.label}
            to={route.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              location.pathname === route.href
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <route.icon className="h-5 w-5 shrink-0" />
            {route.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("hidden md:flex w-72 flex-col fixed inset-y-0 left-0 z-50", className)}>
        <SidebarContent />
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-2 border-b border-border bg-card px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">Invoice Pro</span>
      </div>
    </>
  );
}
