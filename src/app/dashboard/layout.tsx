"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  LayoutDashboard,
  FileText,
  Brain,
  Lightbulb,
  Sparkles,
  BarChart3,
  BookOpen,
  MessageSquare,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Upload", href: "/dashboard/upload", icon: Upload },
  { title: "Summarizer", href: "/dashboard/summarizer", icon: FileText },
  { title: "Quiz Generator", href: "/dashboard/quiz", icon: Brain },
  { title: "Flashcards", href: "/dashboard/flashcards", icon: Lightbulb },
  { title: "Study Plans", href: "/dashboard/study-plans", icon: Sparkles },
  { title: "Exam Analysis", href: "/dashboard/exam-analysis", icon: BarChart3 },
  { title: "Revision Mode", href: "/dashboard/revision", icon: BookOpen },
  { title: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { title: "History", href: "/dashboard/history", icon: History },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Fetch the current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
      setLoadingUser(false);
    });

    // Listen for auth state changes (login/logout/token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /** Get first character of email for avatar fallback */
  const avatarInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  /** Determine active page title for the top bar */
  const activeTitle =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
    )?.title ?? "Dashboard";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen border-r border-border/40 bg-card/50 backdrop-blur-xl transition-all duration-300 flex flex-col",
            collapsed ? "w-[68px]" : "w-[240px]"
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border/40">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-neon-glow flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold gradient-text">Atlas</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? "bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan/10"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0")} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-border/40 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-2",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-neon-cyan/10 text-neon-cyan text-xs font-bold">
                      {loadingUser ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        avatarInitial
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex flex-col items-start text-xs overflow-hidden">
                      <span className="font-medium text-foreground truncate max-w-[140px]">
                        {loadingUser ? "Loading..." : userEmail ?? "Account"}
                      </span>
                      <span className="text-muted-foreground">Settings</span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    {userEmail && (
                      <p className="text-xs text-muted-foreground truncate">
                        {userEmail}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                  <LogoutButton variant="menu-item" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            collapsed ? "ml-[68px]" : "ml-[240px]"
          )}
        >
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center px-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-lg font-semibold">{activeTitle}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Turning curiosity into clarity
                </div>
                {userEmail && (
                  <>
                    <div className="hidden sm:block h-4 w-px bg-border" />
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-neon-cyan">
                          {avatarInitial}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {userEmail}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
