import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 text-stone-800">
      <h1 className="text-[15px] font-medium text-stone-400">availability</h1>
      <p className="text-[15px] leading-relaxed text-stone-600">
        Compose a share on your private page, send the link (or paste the times). It stays up to
        date with your calendar.
      </p>
      <Link
        href="/me"
        className="self-start rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700"
      >
        Go to your page →
      </Link>
    </main>
  );
}
