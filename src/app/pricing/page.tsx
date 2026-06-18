"use client";

import { motion } from "framer-motion";
import { Check, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      <section className="w-full max-w-5xl px-6 py-24 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
            Simple pricing. <br className="md:hidden"/>No surprises.
          </h1>
          <p className="text-xl text-foreground/70 mb-20 max-w-2xl mx-auto">
            We don't charge per feature, per board, or per guest. One flat fee for your entire team to focus.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left items-end">
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="border-2 border-foreground/10 bg-white rounded-3xl p-8 md:p-12 hover:border-foreground/30 transition-all"
          >
            <h3 className="text-3xl font-bold mb-2">Individual</h3>
            <p className="text-foreground/60 mb-8 font-medium">For solo performers.</p>
            <div className="text-6xl font-bold mb-8 font-mono">$0<span className="text-xl text-foreground/50 font-sans font-normal">/mo</span></div>
            <ul className="space-y-5 mb-10">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center"><Check className="w-4 h-4" /></span>
                <span className="font-medium">Unlimited tasks</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center"><Check className="w-4 h-4" /></span>
                <span className="font-medium">Command palette</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center"><Check className="w-4 h-4" /></span>
                <span className="font-medium">1 workspace</span>
              </li>
              <li className="flex items-center gap-3 opacity-40">
                <span className="w-6 h-6 flex items-center justify-center"><Check className="w-4 h-4" /></span>
                <span className="font-medium line-through text-sm">Team collaboration</span>
              </li>
            </ul>
            <Button variant="outline" size="lg" className="w-full text-lg h-14 border-2">Get Started Free</Button>
          </motion.div>

          {/* Pro Tier - Highlighted */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -10 }}
            className="border-2 border-purple bg-purple-soft/30 rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_var(--color-purple)] relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 bg-light-red text-foreground border-b-2 border-l-2 border-foreground text-xs font-bold font-mono uppercase tracking-widest px-6 py-2 rounded-bl-2xl flex items-center gap-2">
              <Sparkles className="w-4 h-4"/> Most Popular
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-2">Team</h3>
              <p className="text-foreground/60 mb-8 font-medium">For high-execution squads.</p>
              <div className="text-6xl font-bold mb-8 font-mono">$6<span className="text-xl text-foreground/50 font-sans font-normal">/mo</span></div>
              <ul className="space-y-5 mb-10">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
                  <span className="font-medium">Everything in Individual</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
                  <span className="font-medium font-bold">Unlimited team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
                  <span className="font-medium">Shared workspaces</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
                  <span className="font-medium">Priority support</span>
                </li>
              </ul>
            </div>
            <Button size="lg" className="w-full text-lg h-14 bg-purple hover:bg-purple/90 text-white">Upgrade to Team</Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-24 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 justify-center mb-12">
            <Info className="w-8 h-8 text-foreground/40" />
            <h2 className="text-4xl font-bold">Frequently asked questions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
              <h4 className="text-xl font-bold mb-4">Is there a per-seat license fee?</h4>
              <p className="text-foreground/70 leading-relaxed text-lg">No. The Team plan is $6/mo regardless of whether you have 3 people or 30. We believe per-seat pricing discourages team collaboration.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
              <h4 className="text-xl font-bold mb-4">Do you offer enterprise plans?</h4>
              <p className="text-foreground/70 leading-relaxed text-lg">If you need SAML SSO, dedicated account management, or self-hosting, please reach out to our sales team for custom pricing.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
              <h4 className="text-xl font-bold mb-4">Can I cancel anytime?</h4>
              <p className="text-foreground/70 leading-relaxed text-lg">Yes, completely self-serve from your billing dashboard. No need to hop on a call or jump through hoops to cancel.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 transition-colors">
              <h4 className="text-xl font-bold mb-4">Do you have a refund policy?</h4>
              <p className="text-foreground/70 leading-relaxed text-lg">If you're not satisfied within the first 30 days of your Team subscription, email us and we'll issue a full refund. No questions asked.</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
