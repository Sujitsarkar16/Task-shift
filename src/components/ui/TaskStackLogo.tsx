/**
 * TaskStack logo mark — three stacked rectangles (a "stack" of tasks)
 * with a checkmark on the top layer. Rendered in SVG, works at any size.
 *
 * Usage:
 *   <TaskStackLogo size={32} />   → icon only
 *   <TaskStackLogoFull />         → icon + wordmark side by side
 */

interface LogoProps {
  size?: number;
  className?: string;
}

export function TaskStackLogo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TaskStack logo"
      role="img"
    >
      <defs>
        <linearGradient id="ts-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="url(#ts-grad)" />

      {/* Bottom layer — lightest */}
      <rect x="8" y="26" width="24" height="5" rx="2.5" fill="white" opacity="0.35" />

      {/* Middle layer */}
      <rect x="8" y="19" width="24" height="5" rx="2.5" fill="white" opacity="0.6" />

      {/* Top layer — full white */}
      <rect x="8" y="12" width="24" height="5" rx="2.5" fill="white" />

      {/* Checkmark on top layer */}
      <path
        d="M15 14.5l2.8 2.8 5.2-5.2"
        stroke="#7c5cfc"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TaskStackLogoFull({ size = 32, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <TaskStackLogo size={size} />
      <span
        style={{ fontSize: size * 0.65, lineHeight: 1 }}
        className="font-extrabold tracking-tight bg-gradient-to-r from-purple to-violet-400 bg-clip-text text-transparent"
      >
        TaskStack
      </span>
    </span>
  );
}
