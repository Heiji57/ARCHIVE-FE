import { useMemo, useState } from "react";
import { Folder as FolderIcon } from "lucide-react";
import type { JournalEntry } from "@/entities/entry/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { ICON_STROKE, SparkIcon } from "@/shared/ui/icons";
import { KIND_KEY, monthName, periodText, retroTitle } from "../model/format";
import { retroPeriod } from "../model/retroList";
import { useRetroStudio } from "../model/retroStudio";
import { useEntryState } from "../model/entryState";
import { DateInk } from "./RetroCard";
import { RetroNone } from "./RetroGallery";
import { RetroRail } from "./RetroRail";
import { MarkdownView } from "./MarkdownView";

/** 좌우로 넘기기 보기(시안 vRail): 오래된 것부터, 처음엔 가장 최근 회고가 가운데. */
export function RetroRailView() {
  const { t, locale } = useTranslation();
  const s = useRetroStudio();
  const list = s.list.railAll;
  const [picked, setPicked] = useState<string | null>(null);
  const currentId = (s.railJump && list.some((e) => e.id === s.railJump) ? s.railJump : null) ?? picked ?? list[list.length - 1]?.id ?? null;

  // 달이 바뀌는 점 아래 이름(겹치지 않게 띄움). 올해가 아니면 연도를 붙인다.
  const marks = useMemo(() => {
    const out: Array<{ index: number; label: string }> = [];
    let lastM = "";
    let lastP = -99;
    let gap = 7;
    list.forEach((e, i) => {
      const m = retroPeriod(e.retroType, e.dateKey).end.slice(0, 7);
      const pc = ((i + 0.5) / (list.length + 1)) * 100;
      if (m !== lastM && pc - lastP > gap) {
        const other = m.slice(0, 4) !== s.today.slice(0, 4);
        out.push({ index: i, label: `${other ? `${new Intl.DateTimeFormat(locale, { year: "numeric" }).format(new Date(+m.slice(0, 4), 0, 1, 12))} ` : ""}${monthName(locale, +m.slice(5, 7))}` });
        lastP = pc;
        gap = other ? 14 : 7;
      }
      lastM = m;
    });
    return out;
  }, [list, locale, s.today]);

  if (!list.length) return <RetroNone />;
  return (
    <RetroRail
      items={list.map((e) => ({
        id: e.id,
        label: `${periodText(locale, e)} ${retroTitle(t, locale, e)}`,
        className: `k-${e.retroType}`,
        render: () => <RailSlide entry={e} />,
      }))}
      currentId={currentId}
      onGo={setPicked}
      marks={marks}
      trackLabel={t("retro.rail.track")}
      prevLabel={t("retro.rail.prev")}
      nextLabel={t("retro.rail.next")}
      posText={(item, i, n) => {
        const e = list.find((x) => x.id === item.id);
        return t("retro.rail.pos", { label: e ? periodText(locale, e) : "", i: i + 1, n });
      }}
    />
  );
}

function RailSlide({ entry }: { entry: JournalEntry }) {
  const { t, locale } = useTranslation();
  const s = useRetroStudio();
  const { pending, empty } = useEntryState(entry);
  const kind = t(KIND_KEY[entry.retroType]);
  return (
    <div className="crl-c">
      <header className="crl-h">
        <span className="crl-n">
          <DateInk entry={entry} />
        </span>
        <span className="crl-k">
          {entry.isSummary ? <SparkIcon size={12} /> : null}
          {entry.isSummary ? t("retro.kind.summary", { kind }) : kind}
        </span>
        <span className="sp" />
        {pending ? <span className="q-st">{t("retro.cd.stPending")}</span> : empty ? <span className="q-st t">{t("retro.cd.stDraft")}</span> : null}
      </header>
      <h3 className="crl-t">{retroTitle(t, locale, entry)}</h3>
      <div className="crl-b">
        {pending ? (
          <p className="rv-none-l">{t("retro.cd.pending")}</p>
        ) : empty ? (
          <p className="rv-none-l">{t("retro.rail.emptyBody")}</p>
        ) : (
          <MarkdownView markdown={entry.content} className="rv-body" />
        )}
      </div>
      <footer className="crl-f">
        <span className="crl-fd">
          <FolderIcon size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
          {s.folderName(entry.folderId)}
        </span>
        <span className="sp" />
        <button type="button" className="rv-bt" onClick={() => s.openEntry(entry.id)}>
          {t("retro.rail.open")}
        </button>
      </footer>
    </div>
  );
}
