import { useEffect, useRef, useState } from "react";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/shared/lib/i18n";
import { ICON_STROKE } from "@/shared/ui/icons";
import { headingsOf, isBlankTemplate } from "../model/templateMarkdown";
import { perKey, type Period, type Tpl } from "../model/useRetroTemplates";
import { useToast } from "../model/useToast";
import { Btn, MenuItem, MoreMenu, Select, Toggle } from "./controls";
import { MdBody } from "./MdBody";
import { MdPreview } from "./MdPreview";


const STARTS: ReadonlyArray<{ id: string; label: TranslationKey; md: TranslationKey }> = [
  { id: "kpt", label: "settingsSheet.start.kpt", md: "settingsSheet.start.kptMd" },
  { id: "4l", label: "settingsSheet.start.4l", md: "settingsSheet.start.4lMd" },
  { id: "goal", label: "settingsSheet.start.goal", md: "settingsSheet.start.goalMd" },
];

export interface TemplateDraft {
  /** 고치는 템플릿(새로 만들면 null) */
  tpl: Tpl | null;
  per: Period;
}

interface Props {
  draft: TemplateDraft;
  all: Tpl[];
  onClose: () => void;
  onSave: (d: { per: Period; name: string; content: string; makeDefault: boolean }) => Promise<boolean>;
  onDelete: (tpl: Tpl) => void;
  onReset: (tpl: Tpl) => void;
}

/** 템플릿 작성 1번 "문서처럼": 위 막대(뒤로, ⋯, 취소, 저장), 큰 제목, 속성 한 줄, 테두리 없는 본문, 아래 안내. */
export function TemplateEditor({ draft, all, onClose, onSave, onDelete, onReset }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const tpl = draft.tpl;
  const isNew = !tpl;
  const [per, setPer] = useState<Period>(draft.per);
  const [name, setName] = useState(tpl?.name ?? "");
  const [md, setMd] = useState(tpl?.content ?? "## \n\n## \n");
  const [def, setDef] = useState(tpl?.active ?? false);
  const [zoom, setZoom] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const zoomRef = useRef<HTMLTextAreaElement>(null);
  const isDef = !!tpl?.active;
  const samePer = all.filter((x) => x.per === per);
  const canDel = !!tpl && !tpl.builtin && samePer.length > 1;
  const perName = t(perKey(per));

  useEffect(() => {
    nameRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (zoom) zoomRef.current?.focus();
  }, [zoom]);

  const save = async () => {
    if (!name.trim()) {
      toast(t("settingsSheet.ed.needName"), "warning");
      nameRef.current?.focus();
      return;
    }
    if (!md.trim() || isBlankTemplate(md)) {
      toast(t("settingsSheet.ed.needBody"), "warning");
      bodyRef.current?.focus();
      return;
    }
    setSaving(true);
    const ok = await onSave({ per, name: name.trim(), content: `${md.replace(/\s+$/, "")}\n`, makeDefault: def });
    setSaving(false);
    if (ok) {
      toast(isNew ? t("settingsSheet.ed.registered", { per: perName, name: name.trim() }) : t("settingsSheet.ed.saved", { name: name.trim() }), "success");
      onClose();
    }
  };

  const start = (label: string, body: string) => {
    setMd(body);
    toast(t("settingsSheet.ed.loaded", { name: label }));
    requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(0, 0);
    });
  };

  const perOptions = (["day", "week", "month", "year"] as const).map((p) => ({
    value: p,
    label: t(perKey(p)),
    desc: p === "day" ? t("settingsSheet.per.optDay") : t("settingsSheet.per.optAi", { per: t(perKey(p)) }),
  }));

  return (
    <div
      className="sxe1"
      onKeyDown={(e) => {
        if (e.key === "Escape" && zoom) {
          e.preventDefault();
          e.stopPropagation();
          setZoom(false);
          requestAnimationFrame(() => bodyRef.current?.focus());
        }
      }}
    >
      <header className="sxe1-bar">
        <Btn kind="q" className="sxe1-back" onClick={onClose}>
          <ChevronLeft size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          {t("settingsSheet.ed.back", { per: perName })}
        </Btn>
        <span className="sp" />
        <MoreMenu label={t("settingsSheet.ed.menu")} trigger={<MoreHorizontal size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />} menuClassName="sxe-more">
          <MenuItem title={t("settingsSheet.ed.zoom")} onClick={() => setZoom(true)} />
          {tpl?.builtin ? (
            <MenuItem
              title={t("settingsSheet.ed.reset")}
              onClick={() => {
                onReset(tpl);
                onClose();
              }}
            />
          ) : null}
          {canDel && tpl ? (
            <MenuItem
              title={t("settingsSheet.ed.delete")}
              desc={t("settingsSheet.ed.deleteHint")}
              danger
              onClick={() => {
                onDelete(tpl);
                toast(t("settingsSheet.ed.deleted", { name: tpl.name }));
                onClose();
              }}
            />
          ) : null}
        </MoreMenu>
        <Btn onClick={onClose}>{t("settingsSheet.cancel")}</Btn>
        <Btn kind="p" disabled={saving} onClick={() => void save()}>
          {isNew ? t("settingsSheet.ed.register") : t("settingsSheet.ed.save")}
        </Btn>
      </header>
      <input
        ref={nameRef}
        className="sxe1-title"
        value={name}
        maxLength={30}
        readOnly={tpl?.builtin}
        placeholder={t("settingsSheet.ed.namePh")}
        aria-label={t("settingsSheet.ed.namePh")}
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
      />
      <div className="sxe1-props">
        <span className="sxe1-p">
          <small>{t("settingsSheet.tpl.periods")}</small>
          {/* 이미 있는 템플릿은 기간을 옮기지 않는다(일간과 AI 요약 템플릿은 서버 저장소가 다르다) */}
          <Select value={per} options={perOptions} label={t("settingsSheet.tpl.periods")} alignLeft disabled={!isNew} onChange={setPer} />
        </span>
        <span className="sxe1-p">
          <small>{t("settingsSheet.ed.useDefault", { per: perName })}</small>
          <Toggle on={def} disabled={isDef} label={t("settingsSheet.ed.useDefault", { per: perName })} onChange={setDef} />
        </span>
        <span className="sxe1-p">
          <small>{t("settingsSheet.ed.items")}</small>
          <b>{t("settingsSheet.ed.itemsN", { n: headingsOf(md).length })}</b>
        </span>
      </div>
      <MdBody value={md} onChange={setMd} className="sxe1-body" textareaRef={bodyRef} />
      {isBlankTemplate(md) ? (
        <div className="sxe-chips" role="group" aria-label={t("settingsSheet.ed.startWith")}>
          <span>{t("settingsSheet.ed.startWith")}</span>
          {STARTS.map((s) => (
            <button key={s.id} type="button" onClick={() => start(t(s.label), t(s.md))}>
              {t(s.label)}
            </button>
          ))}
          {samePer
            .filter((x) => x.id !== tpl?.id)
            .slice(0, 2)
            .map((x) => (
              <button key={x.id} type="button" onClick={() => start(x.name, x.content)}>
                {t("settingsSheet.ed.copy", { name: x.name })}
              </button>
            ))}
        </div>
      ) : null}
      <p className="sxe1-foot">
        <span className="sxt-kh" id="sxt-hint">
          <kbd>/</kbd> {t("settingsSheet.ed.hint")}
        </span>
        <span>{per === "day" ? t("settingsSheet.ed.aiDay") : t("settingsSheet.ed.aiPer", { per: perName })}</span>
      </p>
      {zoom ? (
        <div className="sxt-zoom" role="dialog" aria-modal="true" aria-label={t("settingsSheet.ed.zoom")}>
          <header>
            <b>{name.trim() || t("settingsSheet.ed.untitled")}</b>
            <small>{t("settingsSheet.ed.zoomSub", { per: perName })}</small>
            <span className="sp" />
            <span className="sxt-kh">
              <kbd>/</kbd> {t("settingsSheet.ed.kbdBlocks")}
            </span>
            <Btn
              onClick={() => {
                setZoom(false);
                requestAnimationFrame(() => bodyRef.current?.focus());
              }}
            >
              {t("settingsSheet.ed.zoomOut")}
            </Btn>
          </header>
          <div className="sxt-md z">
            <MdBody value={md} onChange={setMd} plain className="sxt-zin" textareaRef={zoomRef} />
            <MdPreview md={md} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
