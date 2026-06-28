import Link from "next/link";
import { TaskStackLogoFull } from "@/components/ui/TaskStackLogo";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-background py-12 md:py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1">
            <TaskStackLogoFull size={28} />
            <p className="mt-4 text-sm text-foreground/60 leading-relaxed max-w-xs">
              Stack your day, ship your work. Tasks, habits, notes and collaboration in one place.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-foreground/60">
              <li><Link href="/features"  className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="/pricing"   className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-foreground/60">
              <li><Link href="/about"   className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-foreground/60">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms"   className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 md:mt-24 pt-8 border-t border-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-foreground/40">
          <p>© {new Date().getFullYear()} TaskStack. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple/10 text-purple border border-purple/20 font-semibold rounded-full text-[11px]">
              taskstack.app
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
