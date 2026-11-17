import { useTranslation } from "@/shared/lib/i18n";

/** 태그 거르기(시안 #chans): 전체와 태그마다 남은(끝내지 않은) 할 일 수. 하나를 고르면 캘린더와 할 일 화면이 그 태그만. */
export function TagFilter({
  tags,
  counts,
  total,
  current,
  onPick,
}: {
  tags: string[];
  counts: ReadonlyMap<string, number>;
  total: number;
  current: string | null;
  onPick(tag: string | null): void;
}) {
  const { t } = useTranslation();
  const row = (key: string | null, label: string, n: number) => (
    <button
      key={key ?? "__all"}
      type="button"
      className="cal-ch"
      aria-pressed={current === key}
      onClick={() => onPick(key)}
    >
      <span className="cal-ch-h" aria-hidden="true">
        #
      </span>
      <span className="cal-ch-l">{label}</span>
      <span className="cal-ch-n">{n}</span>
    </button>
  );
  return (
    <section aria-label={t("cal.tags.title")}>
      <h2 className="cal-sh2">{t("cal.tags.title")}</h2>
      {row(null, t("cal.tags.all"), total)}
      {tags.map((tag) => row(tag, tag, counts.get(tag) ?? 0))}
    </section>
  );
}
