"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function getSessionFromRequest(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  return session;
}
