import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full max-w-5xl px-6 py-24 md:py-32 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
          Simple pricing. No surprises.
        </h1>
        <p className="text-xl text-foreground/70 mb-20 max-w-2xl mx-auto">
          We don&apos;t charge per feature, per board, or per guest. One flat fee for your entire team to focus.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* Free Tier */}
          <div className="border border-foreground/10 bg-white p-8 md:p-12">
            <h3 className="text-3xl font-bold mb-2">Individual</h3>
            <p className="text-foreground/60 mb-8">For solo performers.</p>
            <div className="text-5xl font-bold mb-8">$0<span className="text-xl text-foreground/50 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-lavender flex items-center justify-center text-xs font-bold">✓</span>
                Unlimited tasks
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-lavender flex items-center justify-center text-xs font-bold">✓</span>
                Command palette
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-lavender flex items-center justify-center text-xs font-bold">✓</span>
                1 workspace
              </li>
            </ul>
            <Button variant="outline" className="w-full">Get Started Free</Button>
          </div>

          {/* Pro Tier - Highlighted via Soft Brutalism */}
          <div className="border-2 border-purple bg-lavender/30 p-8 md:p-12 shadow-[8px_8px_0px_0px_#7c3aed] relative">
            <div className="absolute top-0 right-0 bg-light-red text-foreground border-b-2 border-l-2 border-foreground text-xs font-bold uppercase tracking-widest px-4 py-1">
              Most Popular
            </div>
            <h3 className="text-3xl font-bold mb-2">Team</h3>
            <p className="text-foreground/60 mb-8">For high-execution squads.</p>
            <div className="text-5xl font-bold mb-8">$49<span className="text-xl text-foreground/50 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-purple text-white flex items-center justify-center text-xs font-bold">✓</span>
                Everything in Individual
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-purple text-white flex items-center justify-center text-xs font-bold">✓</span>
                Unlimited team members
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-purple text-white flex items-center justify-center text-xs font-bold">✓</span>
                Shared workspaces
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-purple text-white flex items-center justify-center text-xs font-bold">✓</span>
                Priority support
              </li>
            </ul>
            <Button className="w-full">Upgrade to Team</Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-24 border-t border-foreground/10">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently asked questions</h2>
        <div className="space-y-8">
          <div>
            <h4 className="text-xl font-bold mb-2">Is there a per-seat license fee?</h4>
            <p className="text-foreground/70">No. The Team plan is $49/mo regardless of whether you have 3 people or 30. We believe per-seat pricing discourages team collaboration.</p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-2">Do you offer enterprise plans?</h4>
            <p className="text-foreground/70">If you need SAML SSO, dedicated account management, or self-hosting, please reach out to our sales team for custom pricing.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
