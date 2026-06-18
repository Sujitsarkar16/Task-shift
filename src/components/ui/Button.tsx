import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      primary: "bg-foreground text-background hover:bg-foreground/90 border border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(232,230,245,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#7c3aed] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all",
      outline: "border border-foreground bg-transparent hover:bg-purple hover:text-background hover:border-purple rounded-none transition-all",
      ghost: "hover:bg-lavender hover:text-foreground rounded-none",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-8 text-base",
      lg: "h-14 px-10 text-lg",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
