import { NextResponse } from "next/server";
import { accessTokenFromRefresh } from "@/lib/google/oauth";
import { listCalendars } from "@/lib/google/calendar";
import { listAccounts, setCalendarIds } from "@/lib/google/store";
import { generate } from "@/lib/generate/run";

/** GET ?accountId= → that account's calendars + which are currently selected. */
export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId");
  const account = listAccounts().find((a) => a.id === accountId);
  if (!account) return NextResponse.json({ error: "Unknown account" }, { status: 404 });

  try {
    const accessToken = await accessTokenFromRefresh(account.refreshToken);
    const calendars = await listCalendars(accessToken);
    return NextResponse.json({ calendars, selected: account.calendarIds });
  } catch {
    return NextResponse.json({ error: "Couldn't reach Google — try reconnecting." }, { status: 502 });
  }
}

/** POST { accountId, calendarIds } → save the selection and regenerate. */
export async function POST(req: Request) {
  const { accountId, calendarIds } = (await req.json()) as {
    accountId: string;
    calendarIds: string[];
  };
  if (!listAccounts().some((a) => a.id === accountId)) {
    return NextResponse.json({ error: "Unknown account" }, { status: 404 });
  }
  setCalendarIds(accountId, Array.isArray(calendarIds) ? calendarIds : []);
  await generate();
  return NextResponse.json({ ok: true });
}
