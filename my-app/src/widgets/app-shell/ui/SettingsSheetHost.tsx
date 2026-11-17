import { useEffect, useRef } from "react";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingsSheet } from "@/widgets/settings-sheet";
import { useSettingsSheet } from "../model/settingsSheet";
import { useShell } from "../model/shellSlots";

/**
 * 설정 시트 창 틀(시안 settings.css sx-dlg): 가운데 dialog, Esc 와 바깥 누르기로 닫기.
 * 내용(섹션 목록, 찾기, 섹션)은 widgets/settings-sheet 의 SettingsSheet.
 */
export function SettingsSheetHost() {
  const { t } = useTranslation();
  const sheet = useSettingsSheet();
  const { navigate } = useShell();
  const ref = useRef<HTMLDialogElement>(null);
  const { section } = sheet;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (section && !d.open) d.showModal();
    if (!section && d.open) d.close();
  }, [section]);
  return (
    <dialog
      ref={ref}
      className="ss-dlg"
      aria-label={t("shell.settings.title")}
      onCancel={(e) => {
        e.preventDefault();
        sheet.close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) sheet.close();
      }}
    >
      {section ? (
        <SettingsSheet
          section={section}
          onSection={sheet.open}
          onClose={sheet.close}
          onGoAi={() => {
            sheet.close();
            navigate("ai");
          }}
        />
      ) : null}
    </dialog>
  );
}
