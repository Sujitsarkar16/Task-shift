"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

type LogoutButtonProps = {
  variant?: "default" | "sidebar" | "danger";
  className?: string;
  showIcon?: boolean;
  label?: string;
};

export function LogoutButton({
  variant = "default",
  className = "",
  showIcon = true,
  label = "Log out",
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default:
      "px-4 py-2 bg-foreground text-background rounded-lg hover:bg-purple hover:text-white",
    sidebar:
      "w-8 h-8 rounded-full hover:bg-foreground/5 text-foreground/70 hover:text-foreground",
    danger:
      "px-4 py-2 border-2 border-light-red/30 text-light-red rounded-lg hover:bg-light-red/10",
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      title={variant === "sidebar" ? label : undefined}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="w-4 h-4" />
      )}
      {variant !== "sidebar" && label}
    </button>
  );
}
