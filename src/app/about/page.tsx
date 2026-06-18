"use client";

import { motion, Variants } from "framer-motion";
import { ShieldAlert, Quote, Rocket, Target, Zap } from "lucide-react";

export default function AboutPage() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col items-center overflow-hidden">
      <section className="w-full max-w-5xl px-6 py-24 md:py-32">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-24"
        >
          <motion.div variants={item} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-light-red/20 text-light-red mb-8 border-2 border-light-red/30">
            <ShieldAlert className="w-8 h-8" />
          </motion.div>
          <motion.h1 variants={item} className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-12">
            Built for those who <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple to-light-red">execute.</span>
          </motion.h1>
          <div className="prose prose-lg max-w-none text-foreground/80">
            <motion.p variants={item} className="text-2xl leading-relaxed font-medium mb-8 border-l-4 border-purple pl-6">
              In 2024, we realized that the tools we used to manage our work had become more complex than the work itself.
            </motion.p>
            <motion.p variants={item} className="mb-6 text-xl">
              Taskshift was born out of profound frustration. We were spending more time updating statuses, shifting deadlines, and organizing backlogs than we were actually shipping product. The modern "project management" industry had convinced us that complexity equaled control. It doesn't.
            </motion.p>
            <motion.p variants={item} className="mb-6 text-xl">
              We built Taskshift as a rebellion against bloat. It's an opinionated piece of software. It forces you to make decisions today, rather than pushing them into a perpetual backlog. It demands that you focus.
            </motion.p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t-2 border-foreground/10 mt-16">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Target className="w-8 h-8 text-purple" /> Our Philosophy
            </h3>
            <ul className="space-y-8">
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold font-mono group-hover:bg-purple transition-colors">01</div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Speed is a feature</h4>
                  <p className="text-foreground/70">Slow tools break focus. Every interaction should be instantaneous.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold font-mono group-hover:bg-light-red transition-colors">02</div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Constraints breed action</h4>
                  <p className="text-foreground/70">Endless customization leads to endless procrastination.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold font-mono group-hover:bg-green-500 transition-colors">03</div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Now over later</h4>
                  <p className="text-foreground/70">If it's important, it happens today. Backlogs are where ideas go to die.</p>
                </div>
              </li>
            </ul>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-purple-soft/20 border-2 border-purple rounded-3xl p-10 shadow-[8px_8px_0px_0px_var(--color-purple)] flex flex-col justify-center h-full relative"
          >
            <Quote className="w-16 h-16 text-purple/20 absolute top-8 left-8" />
            <div className="relative z-10">
              <p className="font-bold text-2xl mb-8 leading-relaxed">
                "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-foreground overflow-hidden">
                  <div className="w-full h-full bg-foreground/10 flex items-center justify-center"><Rocket className="w-6 h-6 text-foreground/40"/></div>
                </div>
                <div>
                  <p className="font-bold text-lg">Antoine de Saint-Exupéry</p>
                  <p className="text-foreground/60 text-sm font-mono uppercase tracking-widest">Aviator & Writer</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Team Image Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full aspect-[21/9] bg-foreground rounded-3xl border-2 border-foreground/20 overflow-hidden relative flex items-center justify-center shadow-2xl"
        >
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2850&auto=format&fit=crop')] bg-cover bg-center grayscale"></div>
          <div className="absolute inset-0 bg-foreground/60"></div>
          <div className="relative z-10 text-center text-background px-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">A small team on a big mission.</h2>
            <p className="text-xl opacity-80 max-w-xl mx-auto">We're building the tool we always wished we had. Join us in the pursuit of better work.</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
