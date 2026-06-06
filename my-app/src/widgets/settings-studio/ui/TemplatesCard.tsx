import { useState } from "react";
import { CheckCircle2, Circle, FileText, Plus, Trash2 } from "lucide-react";
import type { RetrospectiveType } from "@/entities/entry/model/types";
import type { RetroTemplate } from "@/entities/template";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import { useTranslation, type TranslateFn, type TranslationKey } from "@/shared/lib/i18n";
import { SettingsCardHeader } from "./SettingsCardHeader";
import { TemplateEditorPanel } from "./TemplateEditorPanel";

const RETRO_TYPES: RetrospectiveType[] = ["daily", "weekly", "monthly", "yearly"];

const TYPE_LABEL_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "retro.filter.daily",
  weekly: "retro.filter.weekly",
  monthly: "retro.filter.monthly",
  yearly: "retro.filter.yearly",
};

const DEFAULT_NAME_KEY: Record<RetrospectiveType, TranslationKey> = {
  daily: "settings.templates.defaultName.daily",
  weekly: "settings.templates.defaultName.weekly",
  monthly: "settings.templates.defaultName.monthly",
  yearly: "settings.templates.defaultName.yearly",
};

/** 기본 템플릿은 i18n 키로, 사용자 템플릿은 저장된 이름으로 표시. */
function templateDisplayName(tpl: RetroTemplate, t: TranslateFn): string {
  if (tpl.isDefault) return t(DEFAULT_NAME_KEY[tpl.retroType]);
  return tpl.name;
}

export function TemplatesCard() {
  const {
    state,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    resetTemplate,
    setActiveTemplate,
  } = useArchiveApp();
  const { t } = useTranslation();

  const [activeType, setActiveType] = useState<RetrospectiveType>("daily");
  const [selectedId, setSelectedId] = useState<string | null>(
    () => state.templates.find((tpl) => tpl.retroType === "daily")?.id ?? null,
  );

  const templatesForType = state.templates.filter(
    (tpl) => tpl.retroType === activeType,
  );
  const inUseId = state.activeTemplateIds[activeType];
  const selected =
    selectedId != null
      ? (state.templates.find((tpl) => tpl.id === selectedId) ?? null)
      : null;

  const handleTabChange = (type: RetrospectiveType) => {
    setActiveType(type);
    setSelectedId(
      state.templates.find((tpl) => tpl.retroType === type)?.id ?? null,
    );
  };

  const handleAdd = () => {
    const typeLabel = t(TYPE_LABEL_KEY[activeType]);
    const name = t("settings.templates.newName", { type: typeLabel });
    const tpl = addTemplate(activeType, name, "");
    setSelectedId(tpl.id);
  };

  const handleDelete = (id: string) => {
    if (selectedId === id) {
      const remaining = templatesForType.find((tpl) => tpl.id !== id);
      setSelectedId(remaining?.id ?? null);
    }
    deleteTemplate(id);
  };

  return (
    <section className="settings-card template-card-full">
      <SettingsCardHeader
        icon={<FileText size={20} />}
        iconVariant="primary"
        eyebrow={t("settings.section.templates")}
        title={t("settings.templates.title")}
      />
      <p className="settings-card-description">
        {t("settings.templates.description")}
      </p>

      {/* Type tabs — segmented control */}
      <div className="seg template-type-seg" role="tablist">
        {RETRO_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            className="seg-btn"
            aria-pressed={activeType === type}
            aria-selected={activeType === type}
            onClick={() => handleTabChange(type)}
          >
            {t(TYPE_LABEL_KEY[type])}
          </button>
        ))}
      </div>

      <div className="template-card-body">
        {/* Left: template list */}
        <div className="template-list-panel">
          <p className="template-list-caption">
            {t("settings.templates.activeHint")}
          </p>

          {templatesForType.map((tpl) => {
            const isInUse = tpl.id === inUseId;
            return (
              <div
                key={tpl.id}
                className="template-list-row"
                data-active={selectedId === tpl.id}
                data-inuse={isInUse}
              >
                <button
                  type="button"
                  className="template-radio"
                  aria-label={t("settings.templates.use")}
                  aria-pressed={isInUse}
                  onClick={() => setActiveTemplate(activeType, tpl.id)}
                  title={t("settings.templates.use")}
                >
                  {isInUse ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <Circle size={17} />
                  )}
                </button>

                <button
                  type="button"
                  className="template-list-name-btn"
                  onClick={() => setSelectedId(tpl.id)}
                >
                  <span className="template-list-name">{templateDisplayName(tpl, t)}</span>
                </button>

                {isInUse && (
                  <span className="pill pill-blue pill-sm">
                    {t("settings.templates.inUse")}
                  </span>
                )}
                {!tpl.isDefault && (
                  <button
                    type="button"
                    className="template-delete-btn"
                    aria-label={t("common.delete")}
                    onClick={() => handleDelete(tpl.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}

          <button type="button" className="template-add-btn" onClick={handleAdd}>
            <Plus size={14} />
            {t("settings.templates.add")}
          </button>
        </div>

        {/* Right: editor */}
        <div className="template-editor-panel">
          {selected ? (
            <TemplateEditorPanel
              key={selected.id}
              template={selected}
              displayName={templateDisplayName(selected, t)}
              onUpdate={(patch) => updateTemplate(selected.id, patch)}
              onReset={() => resetTemplate(selected.retroType)}
            />
          ) : (
            <p className="template-editor-empty">
              {t("settings.templates.selectHint")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
