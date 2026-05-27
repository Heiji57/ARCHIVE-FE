import type { AppSettings } from "@/app/model/settings";
import { AutoSummaryCard } from "./AutoSummaryCard";
import { GithubCard } from "./GithubCard";
import { LanguageCard } from "./LanguageCard";
import { NotificationsCard } from "./NotificationsCard";

export function SettingsStudio() {
  return (
    <div className="page settings-page">
      <GithubCard />
      <LanguageCard />
      <AutoSummaryCard />
      <NotificationsCard />
    </div>
  );
}

export type { AppSettings };
