/**
 * Skeleton shimmer primitives used across all loading states.
 */

function shimmer(w: string, h: string, extra = "") {
  return `${w} ${h} rounded-lg bg-foreground/6 animate-pulse ${extra}`;
}

export function SkeletonLine({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={shimmer(w, h)} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border-2 border-foreground/10 p-5 space-y-3 ${className}`}>
      <SkeletonLine w="w-1/3" h="h-3" />
      <SkeletonLine w="w-1/2" h="h-8" />
      <SkeletonLine w="w-2/3" h="h-3" />
    </div>
  );
}

export function SkeletonTaskRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-foreground/5">
      <div className="w-5 h-5 rounded border-2 border-foreground/10 bg-foreground/5 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonLine w="w-2/3" h="h-4" />
        <SkeletonLine w="w-1/3" h="h-3" />
      </div>
      <SkeletonLine w="w-16" h="h-5" />
    </div>
  );
}

export function SkeletonHabitRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-52 space-y-1.5 shrink-0">
        <SkeletonLine w="w-3/4" h="h-4" />
        <SkeletonLine w="w-1/2" h="h-3" />
      </div>
      <div className="flex-1 flex gap-1.5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-10 flex-1 rounded-md bg-foreground/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonNoteItem() {
  return (
    <div className="p-4 rounded-lg border-2 border-foreground/10 space-y-2">
      <SkeletonLine w="w-3/4" h="h-4" />
      <SkeletonLine w="w-1/3" h="h-3" />
    </div>
  );
}

export function SkeletonSubRow() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 items-center border-b border-foreground/5">
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-foreground/5 animate-pulse shrink-0" />
        <SkeletonLine w="w-24" h="h-4" />
      </div>
      <div className="col-span-2"><SkeletonLine w="w-16" h="h-5" /></div>
      <div className="col-span-2"><SkeletonLine w="w-14" h="h-5" /></div>
      <div className="col-span-2"><SkeletonLine w="w-12" h="h-4" /></div>
      <div className="col-span-2 flex justify-end"><SkeletonLine w="w-14" h="h-4" /></div>
    </div>
  );
}

export function SkeletonStatCards({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 w-full space-y-8">
      {/* Greeting */}
      <div className="space-y-2 mb-10">
        <SkeletonLine w="w-24" h="h-4" />
        <SkeletonLine w="w-72" h="h-10" />
        <SkeletonLine w="w-48" h="h-5" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-white rounded-xl border-2 border-foreground/10 p-8 space-y-4">
          <SkeletonLine w="w-32" h="h-6" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} w="w-full" h="h-12" />)}
          </div>
        </div>
        <div className="md:col-span-4 bg-white rounded-xl border-2 border-foreground/10 p-8 space-y-4">
          <SkeletonLine w="w-24" h="h-6" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <SkeletonLine w="w-32" h="h-4" />
              <div className="w-7 h-7 rounded-md bg-foreground/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
