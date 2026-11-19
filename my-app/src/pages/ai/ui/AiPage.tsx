import { useTranslation } from "@/shared/lib/i18n";
import { useServerFeature } from "@/shared/lib/serverFeatures";
import { ShellPage } from "@/widgets/app-shell";
import { AiHome } from "@/widgets/ai-assistant";

/**
 * AI 탭 화면.
 * - `useServerFeature("ai")` 가 false(실제 모드)면 AI 탭은 없어야 하므로
 *   이 페이지 자체도 fallback 메시지만 보여 준다.
 * - 데모 모드(`?demo=true`)에서는 `useServerFeature("ai")` = true → AiHome 표시.
 */
export function AiPage() {
  const { t } = useTranslation();
  const aiEnabled = useServerFeature("ai");

  return (
    <ShellPage toolbar={<h1 className="sh-title">{t("shell.tab.ai")}</h1>}>
      {aiEnabled ? (
        <AiHome />
      ) : (
        <p className="sh-placeholder">{t("shell.ai.placeholder")}</p>
      )}
    </ShellPage>
  );
}
