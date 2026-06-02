import { lazy, Suspense } from "react";
import { RotateCcw, Save } from "lucide-react";
import type { RetroTemplate } from "@/entities/template";
import { EditorErrorBoundary } from "@/shared/ui/rich-editor";
import { useTranslation } from "@/shared/lib/i18n";

// TipTap 에디터는 lazy — 템플릿 카드 열 때만 로드
const RichEditor = lazy(() => import("@/shared/ui/rich-editor/ui/RichEditor"));

export interface TemplateEditorPanelProps {
  template: RetroTemplate;
  onUpdate: (patch: Partial<Pick<RetroTemplate, "name" | "content">>) => void;
  onReset: () => void;
}

export function TemplateEditorPanel({
  template,
  onUpdate,
  onReset,
}: TemplateEditorPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="template-editor-inner">
      <div className="template-editor-header">
        {template.isDefault ? (
          <p className="template-editor-name-static">{template.name}</p>
        ) : (
          <input
            className="template-name-input"
            value={template.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t("settings.templates.namePlaceholder")}
          />
        )}
        <div className="template-editor-actions">
          <span className="template-autosave-hint">
            <Save size={11} />
            {t("retro.editor.autoSaved")}
          </span>
          {template.isDefault && (
            <button
              type="button"
              className="btn btn-utility"
              onClick={onReset}
              title={t("settings.templates.reset")}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              <RotateCcw size={12} />
              {t("settings.templates.reset")}
            </button>
          )}
        </div>
      </div>

      <EditorErrorBoundary
        fallback={(error) => (
          <div
            style={{
              padding: 14,
              fontSize: 13,
              color: "var(--color-warn, #ff9f0a)",
              background: "var(--color-tile-3)",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--font-mono, monospace)",
              whiteSpace: "pre-wrap",
            }}
          >
            <strong>에디터를 불러오지 못했습니다.</strong>
            {"\n"}
            {error.message}
          </div>
        )}
      >
        <Suspense
          fallback={
            <div
              style={{
                minHeight: 200,
                padding: 12,
                fontSize: 13,
                color: "var(--color-body-muted)",
              }}
            >
              에디터 로딩 중...
            </div>
          }
        >
          <RichEditor
            key={template.id}
            value={template.content}
            placeholder={t("settings.templates.contentPlaceholder")}
            onChange={(md) => onUpdate({ content: md })}
          />
        </Suspense>
      </EditorErrorBoundary>
    </div>
  );
}
