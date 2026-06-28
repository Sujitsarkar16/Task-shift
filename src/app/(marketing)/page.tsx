"use client";

import { Button } from "@/components/ui/Button";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Zap, Keyboard, Settings, LayoutDashboard, CheckCircle2, Shield } from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="flex flex-col items-center overflow-hidden">
      {/* HERO SECTION */}
      <section className="w-full max-w-7xl px-6 py-24 md:py-32 lg:py-40 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          className="flex flex-col items-start max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span variants={itemVariants} className="inline-flex items-center gap-2 py-1.5 px-4 mb-6 bg-purple-soft/50 text-purple font-mono uppercase tracking-widest text-xs font-bold border border-purple/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple"></span>
            </span>
            TaskStack v2.0 is live
          </motion.span>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
            Stack your day. <span className="text-foreground/30">Ship your work.</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-foreground/70 mb-10 leading-relaxed max-w-lg">
            A radically simplified task management tool designed for researchers, students, IT employees, developers, and daily automation. For everyone who values execution over complex workflows.
          </motion.p>
          <motion.div variants={itemVariants} className="flex gap-4 w-full sm:w-auto">
            <Button size="lg" className="text-lg px-8 gap-2 w-full sm:w-auto group">
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 hidden sm:flex">
              Book Demo
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Animated Product Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-[#fdfdfc] border-2 border-foreground shadow-[8px_8px_0px_0px_var(--color-purple-soft)] rounded-3xl flex flex-col overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-12 border-b-2 border-foreground/10 bg-white flex items-center px-4 gap-2 z-10">
            <div className="flex gap-1.5 mr-4">
              <div className="w-3 h-3 rounded-full bg-light-red border border-foreground/20"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-foreground/20"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 border border-foreground/20"></div>
            </div>
            <div className="h-6 w-48 bg-foreground/5 rounded-md border border-foreground/10 flex items-center px-2">
              <span className="text-[10px] font-mono text-foreground/40">app.taskstack.app/board</span>
            </div>
          </div>
          
          <div className="flex-1 p-6 pt-16 flex flex-col gap-4 bg-[#faf9f8]">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="font-bold text-xl mb-1">Q3 Roadmap</h3>
                <p className="text-xs text-foreground/50 font-mono">12 active tasks</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-soft flex items-center justify-center border-2 border-purple text-purple font-bold text-xs">
                TS
              </div>
            </div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              className="bg-white p-4 rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(53,45,51,0.1)] flex items-start gap-4 hover:shadow-[4px_4px_0px_0px_var(--color-purple)] hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-foreground/30" /></div>
              <div>
                <h4 className="font-bold text-sm">Run Daily Automation Scripts</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-light-red/20 text-light-red rounded text-[10px] font-bold uppercase tracking-wider">High</span>
                  <span className="text-xs text-foreground/50 font-mono">IT-042</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-purple-soft/50 p-4 rounded-xl border-2 border-purple shadow-[4px_4px_0px_0px_var(--color-purple)] flex items-start gap-4 cursor-pointer"
            >
              <div className="mt-1"><Zap className="w-5 h-5 text-purple fill-purple/20" /></div>
              <div>
                <h4 className="font-bold text-sm">Analyze Research Data</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-purple/20 text-purple rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                  <span className="text-xs text-foreground/50 font-mono">RND-089</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
              className="bg-white p-4 rounded-xl border-2 border-foreground/20 border-dashed flex justify-center items-center h-20 opacity-50 hover:opacity-100 hover:border-foreground hover:border-solid transition-all cursor-pointer"
            >
              <span className="text-sm font-bold flex items-center gap-2"><Settings className="w-4 h-4" /> Add new task...</span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* VALUE PROP SECTION */}
      <section className="w-full max-w-7xl px-6 py-24 md:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            Complexity is the enemy of execution.
          </h2>
          <p className="text-lg text-foreground/70">
            We stripped away the Gantt charts, story points, and endless configuration panels. What&apos;s left is a tool that actually helps you get work done.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Lightning Fast",
              desc: "Built on an edge-native architecture. Every action completes in less than 50ms.",
              icon: <Zap className="w-6 h-6" />
            },
            {
              title: "Keyboard First",
              desc: "Never touch your mouse again. Fully featured command palette for every action.",
              icon: <Keyboard className="w-6 h-6" />
            },
            {
              title: "Zero Configuration",
              desc: "Opinionated defaults mean you start working immediately, not tweaking settings.",
              icon: <Settings className="w-6 h-6" />
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-8 border-2 border-foreground/10 bg-white rounded-3xl hover:border-purple hover:bg-purple-soft/10 transition-colors group cursor-default"
            >
              <div className="w-14 h-14 bg-white text-purple rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground group-hover:bg-purple group-hover:text-white group-hover:shadow-[4px_4px_0px_0px_var(--color-purple)] transition-all">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-4">{feature.title}</h3>
              <p className="text-foreground/70 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="w-full bg-foreground text-background py-32 mt-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--color-purple)_0%,transparent_70%)]"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-white">
            Ready to stack up?
          </h2>
          <p className="text-xl text-background/80 mb-12 max-w-2xl">
            Stop managing work and start doing it. Join the waitlist for early access.
          </p>
          <Button variant="outline" size="lg" className="bg-transparent border-2 border-background text-background hover:bg-background hover:text-foreground text-lg px-12 h-14 rounded-full group">
            Apply for a Strategy Call <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
