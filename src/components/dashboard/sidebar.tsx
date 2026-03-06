"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  TrendingUp,
  Megaphone,
  GitCompare,
  Bot,
  BookOpen,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface UserInfo {
  username: string;
  isAdmin: boolean;
  status: {
    demoMode: boolean;
    ga4: boolean;
    meta: boolean;
    ai: boolean;
  };
}

const allNavItems = [
  { href: "/dashboard", label: "首頁", icon: Home, adminOnly: false },
  { href: "/dashboard/ga", label: "GA 分析", icon: TrendingUp, adminOnly: false },
  { href: "/dashboard/meta", label: "Meta 廣告分析", icon: Megaphone, adminOnly: false },
  { href: "/dashboard/cross", label: "交叉分析", icon: GitCompare, adminOnly: false },
  { href: "/dashboard/advisor", label: "行銷顧問", icon: Bot, adminOnly: false },
  { href: "/dashboard/guide", label: "API 串接指南", icon: BookOpen, adminOnly: true },
];

function NavContent({ user }: { user: UserInfo | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = allNavItems.filter((item) => !item.adminOnly || user?.isAdmin);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <h1 className="text-lg font-bold tracking-tight">數據分析儀表板</h1>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4 space-y-2">
        {/* Admin-only: connection status */}
        {user?.isAdmin && (
          <div className="space-y-1.5 mb-2">
            <StatusDot label="GA4" connected={user.status.ga4} />
            <StatusDot label="Meta" connected={user.status.meta} />
            <StatusDot label="AI" connected={user.status.ai} />
            {user.status.demoMode && (
              <Badge variant="secondary" className="text-xs mt-1">
                Demo 模式
              </Badge>
            )}
          </div>
        )}
        {user && (
          <p className="text-xs text-muted-foreground truncate">
            {user.username}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          登出
        </Button>
      </div>
    </div>
  );
}

function StatusDot({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex size-2 rounded-full",
          connected ? "bg-emerald-500" : "bg-gray-300"
        )}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs ml-auto", connected ? "text-emerald-600" : "text-gray-400")}>
        {connected ? "已連線" : "未設定"}
      </span>
    </div>
  );
}

export function Sidebar() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Mobile: hamburger + sheet */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <SheetTitle className="sr-only">導航選單</SheetTitle>
            <NavContent user={user} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold">數據分析儀表板</span>
      </div>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:bg-background">
        <NavContent user={user} />
      </aside>
    </>
  );
}
