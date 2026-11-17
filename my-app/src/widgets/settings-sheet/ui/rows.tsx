import type { ReactNode } from "react";
import type { SettingsSection } from "@/shared/config/settingsSections";
import { DeleteRow, EmailRow, LogoutRow, NameRow } from "./SectionAccount";
import { ConfirmRow, HistoryRow, MemoRow, PetRow, SchedRow, StyleRow, ToolsRow } from "./SectionAi";
import { DevicesBlock, ExportBlock, TrashRow } from "./SectionData";
import { LangRow, RegionRow, StartTabRow, TimeFmtRow } from "./SectionGeneral";
import { GDelRow, GPushRow, PushRow, ReposRow, ServiceCards } from "./SectionLink";
import { BrowserRow, DndRow, KeepRow, KindsRow, MailRow } from "./SectionNotify";
import { AutoSummaryBlock, DayEndBlock, FolderRow, SpellRow, TemplatesJumpRow } from "./SectionRetro";
import { CalendarsList, TagsList, TodoDefaultsBlock, TodoRangeRow, WeekStartRow, WorkHoursBlock } from "./SectionWork";

export interface RowCtx {
  go: (s: SettingsSection) => void;
  onGoAi?: () => void;
}

/** 찾기 결과에서 줄 하나를 그린다(섹션 화면과 같은 컴포넌트, 접힌 줄은 펼쳐서). */
export function renderRow(id: string, ctx: RowCtx): ReactNode {
  const f = { force: true };
  switch (id) {
    case "name": return <NameRow />;
    case "email": return <EmailRow />;
    case "logout": return <LogoutRow />;
    case "delete": return <DeleteRow {...f} />;
    case "lang": return <LangRow />;
    case "region": return <RegionRow />;
    case "startTab": return <StartTabRow {...f} />;
    case "timeFmt": return <TimeFmtRow {...f} />;
    case "workHours": return <WorkHoursBlock />;
    case "todoDefaults": return <TodoDefaultsBlock />;
    case "weekStart": return <WeekStartRow />;
    case "todoRange": return <TodoRangeRow />;
    case "calendars": return <div className="sx-card sxw-ct"><CalendarsList /></div>;
    case "tags": return <div className="sx-card sxw-ct"><TagsList /></div>;
    case "templates": return <TemplatesJumpRow onGo={() => ctx.go("retro")} />;
    case "autoSummary": return <AutoSummaryBlock />;
    case "dayEnd": return <DayEndBlock />;
    case "folder": return <FolderRow />;
    case "spell": return <SpellRow />;
    case "pet": return <PetRow />;
    case "tools": return <ToolsRow />;
    case "confirm": return <ConfirmRow {...f} />;
    case "style": return <StyleRow {...f} />;
    case "memo": return <MemoRow {...f} />;
    case "sched": return <SchedRow {...f} onGoAi={ctx.onGoAi} />;
    case "history": return <HistoryRow {...f} />;
    case "github": return <ServiceCards only="gh" />;
    case "gcal": return <ServiceCards only="gcal" />;
    case "repos": return <ReposRow {...f} />;
    case "push": return <PushRow {...f} />;
    case "gPush": return <GPushRow {...f} />;
    case "gDel": return <GDelRow {...f} />;
    case "kinds": return <KindsRow />;
    case "keep": return <KeepRow />;
    case "browser": return <BrowserRow {...f} />;
    case "dnd": return <DndRow {...f} />;
    case "mail": return <MailRow {...f} />;
    case "devices": return <DevicesBlock />;
    case "export": return <ExportBlock />;
    case "trash": return <TrashRow {...f} />;
    default: return null;
  }
}

/** 카드 안에 들어가는 줄(show, more)인지. 블록과 연동 카드는 카드 밖에 그린다. */
export const IN_CARD = new Set(["name", "email", "logout", "delete", "lang", "region", "startTab", "timeFmt", "weekStart", "todoRange", "templates", "folder", "spell", "pet", "tools", "confirm", "style", "memo", "sched", "history", "repos", "push", "gPush", "gDel", "kinds", "keep", "browser", "dnd", "mail", "trash"]);
