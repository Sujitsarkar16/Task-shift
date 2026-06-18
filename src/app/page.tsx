import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* HERO SECTION */}
      <section className="w-full max-w-7xl px-6 py-24 md:py-32 lg:py-40 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col items-start max-w-2xl">
          <span className="inline-block py-1 px-3 mb-6 bg-purple/10 text-purple text-sm font-bold tracking-wide border border-purple/20">
            Taskshift v2.0 is live
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
            Focus on what matters. Ignore the rest.
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 mb-10 leading-relaxed max-w-lg">
            A radically simplified task management tool designed for high-performance teams who value execution over complex workflows.
          </p>
          <Button size="lg" className="text-lg px-12">
            Apply for a Strategy Call
          </Button>
        </div>
        
        {/* Abstract Product Visual (Soft Brutalism) */}
        <div className="relative w-full aspect-square md:aspect-video lg:aspect-square bg-[#F0EEF5] border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center overflow-hidden">
          <div className="absolute top-4 left-4 right-4 h-8 border-b-2 border-foreground/10 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-light-red"></div>
            <div className="w-3 h-3 rounded-full bg-foreground/20"></div>
            <div className="w-3 h-3 rounded-full bg-foreground/20"></div>
          </div>
          <div className="w-3/4 space-y-6 mt-8">
            <div className="h-12 bg-white border-2 border-foreground w-full shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]"></div>
            <div className="h-12 bg-white border-2 border-foreground w-5/6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]"></div>
            <div className="h-12 bg-purple border-2 border-foreground w-4/6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]"></div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="w-full border-y border-foreground/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-sm font-medium tracking-widest text-foreground/50 uppercase mb-8">Trusted by engineering teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale">
            {/* Using text as placeholder logos for editorial aesthetic */}
            <span className="text-xl font-bold tracking-tighter">Acme Corp</span>
            <span className="text-xl font-black font-mono">GLOBAL</span>
            <span className="text-xl font-serif italic">Stark Ind.</span>
            <span className="text-xl font-bold uppercase tracking-widest">Umbrella</span>
            <span className="text-xl font-medium tracking-tight">Massive</span>
          </div>
        </div>
      </section>

      {/* VALUE PROP SECTION */}
      <section className="w-full max-w-7xl px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            Complexity is the enemy of execution.
          </h2>
          <p className="text-lg text-foreground/70">
            We stripped away the Gantt charts, story points, and endless configuration panels. What&apos;s left is a tool that actually helps you get work done.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Lightning Fast",
              desc: "Built on an edge-native architecture. Every action completes in less than 50ms."
            },
            {
              title: "Keyboard First",
              desc: "Never touch your mouse again. Fully featured command palette for every action."
            },
            {
              title: "Zero Configuration",
              desc: "Opinionated defaults mean you start working immediately, not tweaking settings."
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 border border-foreground/10 bg-white hover:bg-[#F0EEF5] transition-colors group">
              <div className="w-12 h-12 bg-lavender text-purple flex items-center justify-center text-xl font-bold mb-6 border border-foreground group-hover:shadow-[4px_4px_0px_0px_#7c3aed] transition-all">
                0{i + 1}
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-4">{feature.title}</h3>
              <p className="text-foreground/70 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="w-full bg-foreground text-background py-32 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-purple">
            Ready to shift gears?
          </h2>
          <p className="text-xl text-background/80 mb-12 max-w-2xl">
            Stop managing work and start doing it. Join the waitlist for early access.
          </p>
          <Button variant="outline" size="lg" className="bg-transparent border-background text-background hover:bg-background hover:text-foreground text-lg px-12">
            Apply for a Strategy Call
          </Button>
        </div>
      </section>
    </div>
  );
}
