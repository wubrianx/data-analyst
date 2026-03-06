"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
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

const navItems = [
  { href: "/dashboard", label: "\u9996\u9801", icon: Home },
  { href: "/dashboard/ga", label: "GA \u5206\u6790", icon: TrendingUp },
  { href: "/dashboard/meta", label: "Meta \u5EE3\u544A\u5206\u6790", icon: Megaphone },
  { href: "/dashboard/cross", label: "\u4EA4\u53C9\u5206\u6790", icon: GitCompare },
  { href: "/dashboard/advisor", label: "\u884C\u92B7\u9867\u554F", icon: Bot },
  { href: "/dashboard/guide", label: "API \u4E32\u63A5\u6307\u5357", icon: BookOpen },
];

function NavContent() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <h1 className="text-lg font-bold tracking-tight">
          {"\u6578\u64DA\u5206\u6790\u5100\u8868\u677F"}
        </h1>
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
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
          <span className="text-xs text-muted-foreground">
            {"\u9023\u7DDA\u72C0\u614B"}
          </span>
          <Badge variant="secondary" className="ml-auto text-xs">
            Demo
          </Badge>
        </div>
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

export function Sidebar() {
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
            <SheetTitle className="sr-only">
              {"\u5C0E\u822A\u9078\u55AE"}
            </SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold">
          {"\u6578\u64DA\u5206\u6790\u5100\u8868\u677F"}
        </span>
      </div>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:bg-background">
        <NavContent />
      </aside>
    </>
  );
}
