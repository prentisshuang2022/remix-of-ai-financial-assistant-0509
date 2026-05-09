import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Coins,
  AlertTriangle,
  Search,
  Bell,
} from "lucide-react";
import sangongLogo from "@/assets/sangong-logo.png";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "首页", icon: LayoutDashboard, end: true },
  { to: "/expense", label: "费用报销AI助手", icon: Receipt },
  { to: "/payable", label: "应付/预付AI助手", icon: Wallet },
  { to: "/receivable", label: "应收AI助手", icon: Coins },
  { to: "/risk", label: "风险预警中心", icon: AlertTriangle },
];

const titleMap: Record<string, string> = {
  "/": "财务AI员工 · 工作台",
  "/expense": "费用报销AI助手",
  "/expense/detail": "报销单详情",
  "/payable": "应付/预付AI助手",
  "/receivable": "应收AI助手",
  "/risk": "风险预警中心",
};

export const AppShell = () => {
  const loc = useLocation();
  const title =
    titleMap[loc.pathname] ||
    (loc.pathname.startsWith("/expense/") ? "报销单详情" : "财务AI员工");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <img src={sangongLogo} alt="三工光电" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">财务AI员工</div>
            <div className="text-[10px] text-muted-foreground font-mono">三工光电</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[inset_2px_0_0_hsl(var(--sidebar-primary))]"
                    : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-secondary p-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-medium text-foreground">已接入服务</span>
            </div>
            钉钉 · OCR · ERP（部分）
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-md px-6">
          <h1 className="text-base font-semibold text-foreground tracking-tight">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="搜索单号、供应商、客户、流水..."
                className="h-9 w-72 rounded-lg border border-input bg-secondary/60 pl-9 pr-3 text-sm transition-all focus:outline-none focus:bg-card focus:ring-2 focus:ring-ring/30 focus:border-primary"
              />
            </div>
            <button className="relative rounded-lg border border-border bg-card p-2 hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                7
              </span>
            </button>
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="h-8 w-8 rounded-full bg-[image:var(--gradient-brand)] flex items-center justify-center text-xs font-medium text-primary-foreground shadow-glow">
                李
              </div>
              <div className="text-xs leading-tight">
                <div className="font-medium text-foreground">李婷婷</div>
                <div className="text-muted-foreground">财务部 · 主管</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;