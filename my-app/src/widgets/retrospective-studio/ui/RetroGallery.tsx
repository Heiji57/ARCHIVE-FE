import { useTranslation } from "@/shared/lib/i18n";
import { groupLabel } from "../model/format";
import { groupByMonth } from "../model/retroList";
import { useRetroStudio } from "../model/retroStudio";
import { RetroCard } from "./RetroCard";

/** 카드 목록: 달마다 묶은 카드와 "N개 더 보기". */
export function RetroGallery() {
  const { t, locale } = useTranslation();
  const s = useRetroStudio();
  const { list } = s;
  if (!list.shown.length) return <RetroNone />;
  return (
    <>
      {groupByMonth(list.shown).map((g) => (
        <section key={g.monthKey} className="rv-mg" aria-label={groupLabel(locale, g.monthKey)}>
          <h3>
            {groupLabel(locale, g.monthKey)}
            <small>{t("retro.count", { n: g.count })}</small>
          </h3>
          <div className="rv-cg">
            {g.entries.map((e) => (
              <RetroCard key={e.id} entry={e} folderName={s.folderName(e.folderId)} onOpen={s.openEntry} />
            ))}
          </div>
        </section>
      ))}
      {list.remaining > 0 ? (
        <div className="rv-more">
          <button type="button" className="rv-bt g" onClick={list.more}>
            {t("retro.more", { n: list.remaining })}
          </button>
        </div>
      ) : null}
    </>
  );
}

/** 거른 결과가 없을 때(시안 .q-empty). */
export function RetroNone() {
  const { t } = useTranslation();
  const s = useRetroStudio();
  if (s.list.loading) return <p className="rv-load">{t("retro.load.loading")}</p>;
  if (s.list.error)
    return (
      <div className="rv-none">
        <h3>{t("retro.load.error")}</h3>
        <button type="button" className="rv-bt" onClick={s.list.refetch}>
          {t("retro.load.retry")}
        </button>
      </div>
    );
  const searching = s.q.trim() !== "";
  return (
    <div className="rv-none">
      <h3>{t(searching ? "retro.none.searchTitle" : "retro.none.periodTitle")}</h3>
      <p>{t(searching ? "retro.none.searchDesc" : "retro.none.periodDesc")}</p>
      {searching || s.month !== "all" || s.type !== "all" || s.folder !== "all" ? (
        <button type="button" className="rv-bt" onClick={s.resetFilters}>
          {t("retro.none.reset")}
        </button>
      ) : (
        <button type="button" className="rv-bt p" onClick={() => s.openNew()}>
          {t("retro.none.writeToday")}
        </button>
      )}
    </div>
  );
}
