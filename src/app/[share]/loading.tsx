/** Shown instantly while the recipient page resolves (brain on a cold cache). */
export default function Loading() {
  return (
    <main className="min-h-screen bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-md px-6 py-16 sm:py-20">
        <ul className="animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-4 border-b border-stone-100 py-3.5 dark:border-stone-800"
            >
              <span className="h-3 w-20 shrink-0 rounded bg-stone-100 dark:bg-stone-800" />
              <span className="h-3 flex-1 rounded bg-stone-100 dark:bg-stone-800" style={{ maxWidth: `${50 + ((i * 13) % 40)}%` }} />
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[13px] italic text-stone-300 dark:text-stone-600">finding times…</p>
      </div>
    </main>
  );
}
