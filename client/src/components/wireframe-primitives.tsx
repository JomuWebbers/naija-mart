

// ─── Shared primitives used across every wireframe screen ────────────────────

export function Wire({ h = 'h-44', label = '' }: { h?: string; label?: string }) {
  return (
    <div className={`${h} bg-neutral-100 border border-neutral-200 flex items-end p-2 shrink-0`}>
      {label && (
        <span className="text-[8px] tracking-[0.2em] uppercase font-semibold text-neutral-300">
          {label}
        </span>
      )}
    </div>
  )
}

export function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-neutral-400">
      {children}
    </span>
  )
}

export function Divider({ thick = false }: { thick?: boolean }) {
  return <div className={`w-full ${thick ? 'border-t-2 border-black' : 'border-t border-black/15'}`} />
}

export function PageShell({ title, breadcrumb, children }: { title: string; breadcrumb: string; children: React.ReactNode }) {
  return (
    <div className="px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-screen-2xl mx-auto">
        {breadcrumb && <MicroLabel>{breadcrumb}</MicroLabel>}
        {title && (
          <h1 className="font-black uppercase leading-none mt-2 mb-8" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', letterSpacing: '-0.03em' }}>
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  )
}


