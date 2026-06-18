export default function AboutPage() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full max-w-5xl px-6 py-24 md:py-32">
        <div className="mb-24">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-12">
            Built for those who execute.
          </h1>
          <div className="prose prose-lg max-w-none text-foreground/80">
            <p className="text-2xl leading-relaxed font-medium mb-8">
              In 2024, we realized that the tools we used to manage our work had become more complex than the work itself.
            </p>
            <p className="mb-6">
              Taskshift was born out of profound frustration. We were spending more time updating statuses, shifting deadlines, and organizing backlogs than we were actually shipping product. The modern &quot;project management&quot; industry had convinced us that complexity equaled control. It doesn&apos;t.
            </p>
            <p className="mb-6">
              We built Taskshift as a rebellion against bloat. It&apos;s an opinionated piece of software. It forces you to make decisions today, rather than pushing them into a perpetual backlog. It demands that you focus.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-foreground/10">
          <div>
            <h3 className="text-2xl font-bold mb-4">Our Philosophy</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <span className="font-bold text-light-red">01.</span>
                <span>Speed is a feature. Slow tools break focus.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="font-bold text-light-red">02.</span>
                <span>Constraints breed creativity and action.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="font-bold text-light-red">03.</span>
                <span>If it&apos;s important, it happens now.</span>
              </li>
            </ul>
          </div>
          <div className="bg-[#F0EEF5] border border-foreground p-8">
            <p className="font-medium text-lg mb-4">&quot;Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.&quot;</p>
            <p className="text-foreground/60 text-sm">— Antoine de Saint-Exupéry</p>
          </div>
        </div>
      </section>
    </div>
  );
}
