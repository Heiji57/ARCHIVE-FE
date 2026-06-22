import { useState } from "react";
import { Code2, User } from "lucide-react";
import { useArchiveApp } from "@/app/providers/useArchiveApp";
import type { AccountType } from "@/app/model/settings";
import { useTranslation } from "@/shared/lib/i18n";

interface Option {
  type: AccountType;
  Icon: typeof Code2;
  labelKey: "onboarding.accountType.developer" | "onboarding.accountType.user";
  descKey:
    | "onboarding.accountType.developerDesc"
    | "onboarding.accountType.userDesc";
}

const OPTIONS: Option[] = [
  {
    type: "developer",
    Icon: Code2,
    labelKey: "onboarding.accountType.developer",
    descKey: "onboarding.accountType.developerDesc",
  },
  {
    type: "user",
    Icon: User,
    labelKey: "onboarding.accountType.user",
    descKey: "onboarding.accountType.userDesc",
  },
];

export function AccountTypeForm() {
  const { t } = useTranslation();
  const { setAccountType } = useArchiveApp();
  const [selected, setSelected] = useState<AccountType | null>(null);

  return (
    <div className="auth-form">
      {OPTIONS.map(({ type, Icon, labelKey, descKey }) => (
        <button
          key={type}
          type="button"
          className={`actype-option${selected === type ? " actype-option--selected" : ""}`}
          onClick={() => setSelected(type)}
        >
          <span className="actype-option-icon">
            <Icon size={20} />
          </span>
          <span className="actype-option-body">
            <span className="actype-option-label">{t(labelKey)}</span>
            <span className="actype-option-desc">{t(descKey)}</span>
          </span>
        </button>
      ))}

      <button
        type="button"
        className="auth-submit"
        disabled={!selected}
        onClick={() => selected && setAccountType(selected)}
      >
        {t("onboarding.accountType.continue")}
      </button>

      <button
        type="button"
        className="auth-secondary"
        onClick={() => setAccountType("user")}
      >
        {t("onboarding.accountType.skip")}
      </button>
    </div>
  );
}
