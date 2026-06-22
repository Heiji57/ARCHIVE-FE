import type { AccountType } from "@/app/model/settings";

type GatedFeature = "github";

/** Returns true if the given account type has access to the feature. */
export function can(accountType: AccountType, feature: GatedFeature): boolean {
  if (feature === "github") return accountType === "developer";
  return false;
}
