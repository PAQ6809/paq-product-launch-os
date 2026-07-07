import "server-only";

import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const userRoles = ["user", "developer", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DeveloperAccess =
  | {
      mode: "supabase";
      user: User;
      profile: UserProfile;
    }
  | {
      mode: "demo";
      user: null;
      profile: null;
    };

type ProfileRow = {
  id?: unknown;
  email?: unknown;
  display_name?: unknown;
  avatar_url?: unknown;
  role?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return getProfileForUser(user);
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const profile = await getCurrentUserProfile();
  return profile?.role ?? null;
}

export async function isDeveloper(): Promise<boolean> {
  return hasDeveloperAccess(await getCurrentUserRole());
}

export async function requireDeveloper(locale = "zh-TW"): Promise<DeveloperAccess> {
  await connection();

  assertProductionDevDiagnosticsEnabled();

  if (!isSupabaseConfigured()) {
    if (isProductionRuntime()) {
      notFound();
    }

    return { mode: "demo", user: null, profile: null };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${safeLocale(locale)}/login?redirectTo=${encodeURIComponent(`/${safeLocale(locale)}/dev`)}`);
  }

  const profile = await getProfileForUser(user);
  if (hasDeveloperAccess(profile.role)) {
    return { mode: "supabase", user, profile };
  }

  redirect(`/${safeLocale(locale)}/dashboard`);
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentUserRole()) === "admin";
}

export async function requireAdmin(locale = "zh-TW"): Promise<DeveloperAccess> {
  await connection();

  assertProductionDevDiagnosticsEnabled();

  if (!isSupabaseConfigured()) {
    if (isProductionRuntime()) {
      notFound();
    }

    return { mode: "demo", user: null, profile: null };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${safeLocale(locale)}/login?redirectTo=${encodeURIComponent(`/${safeLocale(locale)}/dev`)}`);
  }

  const profile = await getProfileForUser(user);
  if (profile.role === "admin") {
    return { mode: "supabase", user, profile };
  }

  redirect(`/${safeLocale(locale)}/dashboard`);
}

export function hasDeveloperAccess(role: UserRole | null | undefined) {
  return role === "developer" || role === "admin";
}

async function getProfileForUser(user: User): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return fallbackProfile(user);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,avatar_url,role,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !isRecord(data)) {
    return fallbackProfile(user);
  }

  return normalizeProfile(data, user);
}

function fallbackProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: readUserMetadataString(user, "display_name"),
    avatarUrl: readUserMetadataString(user, "avatar_url"),
    role: "user",
    createdAt: null,
    updatedAt: null
  };
}

function normalizeProfile(row: ProfileRow, user: User): UserProfile {
  return {
    id: readString(row.id) ?? user.id,
    email: readString(row.email) ?? user.email ?? null,
    displayName: readString(row.display_name),
    avatarUrl: readString(row.avatar_url),
    role: normalizeRole(row.role),
    createdAt: readString(row.created_at),
    updatedAt: readString(row.updated_at)
  };
}

function normalizeRole(value: unknown): UserRole {
  return value === "developer" || value === "admin" ? value : "user";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readUserMetadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return readString(value);
}

function safeLocale(locale: string) {
  return /^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale) ? locale : "zh-TW";
}

function assertProductionDevDiagnosticsEnabled() {
  if (
    isProductionRuntime() &&
    (process.env.ENABLE_DEV_DIAGNOSTICS !== "true" ||
      process.env.ENABLE_DEV_DIAGNOSTICS_IN_PRODUCTION !== "true")
  ) {
    notFound();
  }
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function isRecord(value: unknown): value is ProfileRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
