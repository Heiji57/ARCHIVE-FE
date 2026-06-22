import { Code2, User } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AccountType } from "@/app/model/settings";
import { useTranslation } from "@/shared/lib/i18n";
import { SettingRow } from "./SettingRow";

interface TypeOption {
  type: AccountType;
  Icon: typeof Code2;
  labelKey: "settings.accountType.developer" | "settings.accountType.user";
}

const OPTIONS: TypeOption[] = [
  { type: "developer", Icon: Code2, labelKey: "settings.accountType.developer" },
  { type: "user", Icon: User, labelKey: "settings.accountType.user" },
];

export function AccountTypeCard() {
  const { t } = useTranslation();
  const { state, setAccountType } = useArchiveApp();
  const current = state.settings.accountType;

  return (
    <SettingRow
      label={t("settings.accountType.title")}
      description={t("settings.accountType.hint")}
    >
      <div className="setting-seg">
        {OPTIONS.map(({ type, Icon, labelKey }) => (
          <button
            key={type}
            type="button"
            className="setting-seg-btn"
            data-active={current === type ? "true" : undefined}
            onClick={() => setAccountType(type)}
          >
            <Icon size={14} />
            {t(labelKey)}
          </button>
        ))}
      </div>
    </SettingRow>
  );
}
