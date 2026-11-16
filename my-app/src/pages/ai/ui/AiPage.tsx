import { useTranslation } from "@/shared/lib/i18n";
import { ShellPage } from "@/widgets/app-shell";

/** AI 탭 자리. 내용(가운데 입력, 지난 대화 사이드바)은 Task 9 가 채운다. 오른쪽 줄과 알림은 없다. */
export function AiPage() {
  const { t } = useTranslation();
  return (
    <ShellPage toolbar={<h1 className="sh-title">{t("shell.tab.ai")}</h1>}>
      <p className="sh-placeholder">{t("shell.ai.placeholder")}</p>
    </ShellPage>
  );
}
