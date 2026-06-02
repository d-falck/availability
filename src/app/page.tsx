import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 text-stone-800 dark:text-stone-200">
      <h1 className="text-[15px] italic text-stone-400 dark:text-stone-500">availability</h1>
      <p className="text-[16px] leading-relaxed text-stone-600 dark:text-stone-300">
        Compose a share on your private page, send the link (or paste the times). It stays up to
        date with your calendar.
      </p>
      <Link
        href="/me"
        className="self-start rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        Go to your page →
      </Link>
    </main>
  );
}
