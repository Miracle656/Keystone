import { NextResponse } from "next/server";

// Served as a route handler (not the static file in public/.well-known) because Apple's
// passkey/AASA fetcher expects `Content-Type: application/json` on a file with no extension —
// Next's static file server doesn't set that content type for an extensionless path.
// TEAMID must be replaced with the real Apple Developer Team ID before this is useful.
export function GET() {
  return NextResponse.json(
    {
      applinks: {},
      webcredentials: {
        apps: ["TEAMID.com.divinitylabs.keystone"],
      },
    },
    { headers: { "Content-Type": "application/json" } },
  );
}
