import type { AppSettings } from "@/app/model/settings";
import { AutoSummaryCard } from "./AutoSummaryCard";
import { GithubCard } from "./GithubCard";
import { LanguageCard } from "./LanguageCard";
import { NotificationsCard } from "./NotificationsCard";

export function SettingsStudio() {
  return (
    <div
      className="page"
      style={{
        paddingTop: 32,
        paddingBottom: 80,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 24,
      }}
    >
      <GithubCard />
      <LanguageCard />
      <AutoSummaryCard />
      <NotificationsCard />
    </div>
  );
}

export type { AppSettings };
