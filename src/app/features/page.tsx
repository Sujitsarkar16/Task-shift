export default function FeaturesPage() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full max-w-7xl px-6 py-24 md:py-32">
        <div className="max-w-3xl mb-24">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
            The anti-feature set.
          </h1>
          <p className="text-xl text-foreground/70 leading-relaxed">
            Most tools add features to justify their subscription. We remove them to justify your attention. Here&apos;s exactly what we offer, and nothing more.
          </p>
        </div>

        <div className="flex flex-col gap-32">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative w-full aspect-square bg-[#F0EEF5] border-2 border-purple shadow-[8px_8px_0px_0px_#7c3aed] flex flex-col justify-center p-12">
              <div className="text-6xl font-bold text-purple drop-shadow-[2px_2px_0px_rgba(17,17,17,1)] mb-4">⌘K</div>
              <div className="h-12 bg-white border-2 border-foreground w-full shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex items-center px-4">
                <span className="font-mono text-sm opacity-50">Create task...</span>
              </div>
            </div>
            <div className="order-1 md:order-2 flex flex-col items-start">
              <span className="text-sm font-bold tracking-widest text-foreground/50 uppercase mb-4 border-b border-foreground/10 pb-2">01 / Speed</span>
              <h2 className="text-4xl font-bold tracking-tight mb-6">Omnipresent Command Palette</h2>
              <p className="text-lg text-foreground/70 leading-relaxed">
                Everything is a shortcut. Create tasks, assign teammates, and update statuses without ever touching your mouse or breaking your flow state.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold tracking-widest text-foreground/50 uppercase mb-4 border-b border-foreground/10 pb-2">02 / Focus</span>
              <h2 className="text-4xl font-bold tracking-tight mb-6">The Singular View</h2>
              <p className="text-lg text-foreground/70 leading-relaxed">
                No multiple tabs, no hidden boards. A single, unified view of what matters right now. If it&apos;s not on your list today, it doesn&apos;t exist.
              </p>
            </div>
            <div className="relative w-full aspect-square bg-white border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] p-8 flex flex-col gap-4">
              <div className="w-1/2 h-8 bg-foreground/10"></div>
              <div className="flex-1 border-2 border-purple bg-lavender/30"></div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
