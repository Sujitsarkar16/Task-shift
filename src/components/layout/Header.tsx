import Link from "next/link";
import { Button } from "../ui/Button";
import { TaskStackLogoFull } from "@/components/ui/TaskStackLogo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/">
          <TaskStackLogoFull size={28} />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/features" className="hover:opacity-60 transition-opacity">Features</Link>
          <Link href="/about"    className="hover:opacity-60 transition-opacity">About</Link>
          <Link href="/pricing"  className="hover:opacity-60 transition-opacity">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hidden sm:block hover:opacity-60 transition-opacity">
            Log in
          </Link>
          <Button variant="primary" size="sm">Get Started</Button>
        </div>
      </div>
    </header>
  );
}
