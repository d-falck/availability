/** Shown instantly while the recipient page resolves (brain on a cold cache). */
export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-stone-400 dark:bg-stone-950 dark:text-stone-500">
      <p className="animate-pulse text-[15px] italic">finding times…</p>
    </main>
  );
}
