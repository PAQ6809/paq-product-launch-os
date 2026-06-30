import { UserMenu } from "@/components/auth/UserMenu";
import { getCurrentUserProfile, hasDeveloperAccess } from "@/lib/auth/roles";

export async function UserMenuServer() {
  const profile = await getCurrentUserProfile();
  const showDeveloperConsole = hasDeveloperAccess(profile?.role);
  const roleLabel = profile?.role === "admin" ? "Admin" : profile?.role === "developer" ? "Developer" : undefined;

  return <UserMenu roleLabel={roleLabel} showDeveloperConsole={showDeveloperConsole} />;
}
