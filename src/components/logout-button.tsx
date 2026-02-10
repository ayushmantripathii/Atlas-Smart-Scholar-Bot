"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  /** Render as a full button vs a compact menu item */
  variant?: "button" | "menu-item";
  className?: string;
}

export function LogoutButton({
  variant = "button",
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      // Even if signOut errors, clear cookies by navigating away
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (variant === "menu-item") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground text-destructive hover:bg-destructive/10",
          className
        )}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="mr-2 h-4 w-4" />
        )}
        {loading ? "Signing out..." : "Log out"}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "text-destructive hover:text-destructive hover:bg-destructive/10",
        className
      )}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {loading ? "Signing out..." : "Log out"}
    </Button>
  );
}
