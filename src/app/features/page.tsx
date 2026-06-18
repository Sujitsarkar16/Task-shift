"use client";

import { motion } from "framer-motion";
import { ArrowRight, Command, ListTodo, Users, Search, Timer, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function FeaturesPage() {
  const features = [
    {
      id: "01",
      title: "Omnipresent Command Palette",
      desc: "Everything is a shortcut. Create tasks, assign teammates, and update statuses without ever touching your mouse or breaking your flow state.",
      icon: <Command className="w-8 h-8" />,
      visual: (
        <div className="relative w-full aspect-square bg-[#fdfdfc] border-2 border-purple rounded-3xl shadow-[8px_8px_0px_0px_var(--color-purple)] flex flex-col justify-center p-8 md:p-12 overflow-hidden group">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-purple/10 absolute top-8 right-8 font-mono"
          >
            ⌘K
          </motion.div>
          <div className="relative z-10 w-full max-w-md mx-auto">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white border-2 border-foreground w-full shadow-[8px_8px_0px_0px_rgba(53,45,51,0.1)] rounded-2xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-3 border-b-2 border-foreground/10 gap-3">
                <Search className="w-5 h-5 text-foreground/40" />
                <span className="font-mono text-sm opacity-50 flex-1">Assign to @alex...</span>
                <span className="text-[10px] bg-foreground/5 px-2 py-1 rounded font-mono font-bold">ESC</span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <div className="px-3 py-2 bg-purple-soft/50 rounded-xl flex items-center justify-between border-2 border-purple">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple text-white flex items-center justify-center text-xs font-bold">A</div>
                    <span className="text-sm font-bold">Alex Chen</span>
                  </div>
                  <span className="text-xs font-mono text-purple font-bold">↵</span>
                </div>
                <div className="px-3 py-2 rounded-xl flex items-center gap-3 hover:bg-foreground/5">
                  <div className="w-6 h-6 rounded-full bg-foreground/20 text-foreground flex items-center justify-center text-xs font-bold">S</div>
                  <span className="text-sm font-medium text-foreground/70">Sarah Smith</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: "02",
      title: "The Singular View",
      desc: "No multiple tabs, no hidden boards. A single, unified view of what matters right now. If it's not on your list today, it doesn't exist.",
      icon: <ListTodo className="w-8 h-8" />,
      visual: (
        <div className="relative w-full aspect-square bg-white border-2 border-foreground rounded-3xl shadow-[8px_8px_0px_0px_rgba(53,45,51,0.1)] p-8 flex flex-col gap-4 overflow-hidden">
          <div className="w-full flex items-center justify-between mb-4 border-b-2 border-foreground/10 pb-4">
            <div className="flex gap-4">
              <span className="font-bold text-lg border-b-2 border-purple pb-1">Today</span>
              <span className="font-bold text-lg text-foreground/40">Later</span>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/10"><Users className="w-4 h-4" /></div>
            </div>
          </div>
          
          <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="w-full p-4 border-2 border-foreground rounded-xl flex items-center justify-between hover:border-purple transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-foreground/30"></div>
              <span className="font-medium line-through">Deploy landing page</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 bg-light-red/20 text-light-red rounded">URGENT</span>
          </motion.div>
          
          <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-full p-4 border-2 border-purple bg-purple-soft/20 rounded-xl flex items-center gap-3 shadow-[4px_4px_0px_0px_var(--color-purple)]">
            <div className="w-5 h-5 rounded-full border-2 border-purple bg-purple/20 flex items-center justify-center"><div className="w-2.5 h-2.5 bg-purple rounded-full"></div></div>
            <span className="font-bold">Write Q3 update email</span>
          </motion.div>
          
          <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-full p-4 border-2 border-foreground/10 rounded-xl flex items-center gap-3 opacity-60">
            <div className="w-5 h-5 rounded-full border-2 border-foreground/30"></div>
            <span className="font-medium text-foreground/70">Review PR #412</span>
          </motion.div>
        </div>
      )
    },
    {
      id: "03",
      title: "Real-time Multiplayer",
      desc: "Built on CRDTs, every action is synced globally in milliseconds. See your team's cursors, selections, and edits as they happen.",
      icon: <Terminal className="w-8 h-8" />,
      visual: (
        <div className="relative w-full aspect-square bg-[#fdfdfc] border-2 border-foreground rounded-3xl shadow-[8px_8px_0px_0px_rgba(53,45,51,0.1)] p-8 flex items-center justify-center overflow-hidden bg-[radial-gradient(var(--color-foreground)_1px,transparent_1px)] [background-size:20px_20px] opacity-90">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
          <motion.div 
            animate={{ 
              x: [0, 50, -20, 0],
              y: [0, -30, 40, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center gap-2"
          >
             <div className="absolute -top-3 -left-3 pointer-events-none">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.65376 21.3L5.12658 2.50293L20.8037 12.0125L13.1611 13.9064L16.2773 20.8041L12.4439 22.5348L9.2062 15.6515L5.65376 21.3Z" fill="var(--color-purple)" stroke="white" strokeWidth="2"/>
              </svg>
              <div className="bg-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-5 left-4 whitespace-nowrap shadow-sm">
                Alex
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-2 border-purple rounded-2xl shadow-lg">
              <span className="font-bold">Updating specification...</span>
            </div>
          </motion.div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col items-center overflow-hidden">
      <section className="w-full max-w-7xl px-6 py-24 md:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
            The anti-feature set.
          </h1>
          <p className="text-xl text-foreground/70 leading-relaxed">
            Most tools add features to justify their subscription. We remove them to justify your attention. Here's exactly what we offer, and nothing more.
          </p>
        </motion.div>

        <div className="flex flex-col gap-32">
          {features.map((feature, index) => (
            <div key={feature.id} className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`order-2 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}
              >
                {feature.visual}
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className={`order-1 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'} flex flex-col items-start`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg">
                    {feature.icon}
                  </div>
                  <span className="text-sm font-mono font-bold tracking-widest text-foreground/50 uppercase border-b-2 border-foreground/10 pb-1">
                    {feature.id} / Feature
                  </span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight mb-6">{feature.title}</h2>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full bg-purple-soft/30 py-24 border-t-2 border-foreground/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white border-2 border-foreground rounded-3xl p-12 shadow-[8px_8px_0px_0px_var(--color-purple)]"
          >
            <Timer className="w-12 h-12 mx-auto mb-6 text-purple" />
            <h3 className="text-3xl font-bold mb-4">Stop reading features. Start building.</h3>
            <p className="text-lg text-foreground/70 mb-8 max-w-xl mx-auto">
              You've seen enough to know if this is for you. We offer a 14-day trial, no credit card required.
            </p>
            <Button size="lg" className="text-lg px-8 gap-2 group">
              Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
