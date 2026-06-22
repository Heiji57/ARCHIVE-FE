import type { Locale } from "@/app/model/settings";

export type TranslationKey =
  // Nav
  | "nav.calendar"
  | "nav.todos"
  | "nav.retrospectives"
  | "nav.settings"
  | "nav.brand"
  // Subheader
  | "subheader.calendar.eyebrow"
  | "subheader.calendar.title"
  | "subheader.calendar.subtitle"
  | "subheader.todos.eyebrow"
  | "subheader.todos.title"
  | "subheader.todos.subtitle"
  | "subheader.retrospectives.eyebrow"
  | "subheader.retrospectives.title"
  | "subheader.retrospectives.subtitle"
  | "subheader.settings.eyebrow"
  | "subheader.settings.title"
  | "subheader.settings.subtitle"
  // Sync status
  | "sync.connected"
  | "sync.disconnected"
  | "sync.offline"
  | "sync.synced"
  | "sync.status"
  | "sync.connectInSettings"
  | "sync.ago.m"
  | "sync.ago.h"
  | "sync.ago.d"
  | "sync.ago.M"
  | "sync.ago.Y"
  // Todo board
  | "todo.quickCapture.placeholder"
  | "todo.quickCapture.hint"
  | "todo.quickCapture.enter"
  | "todo.col.notStart.label"
  | "todo.col.notStart.ko"
  | "todo.col.inProgress.label"
  | "todo.col.inProgress.ko"
  | "todo.col.done.label"
  | "todo.col.done.ko"
  | "todo.col.empty"
  | "todo.card.nextStep"
  | "todo.card.advance"
  | "todo.card.changeDate"
  | "todo.filter.all"
  | "todo.filter.today"
  | "todo.filter.thisWeek"
  | "todo.filter.pickDate"
  | "todo.filter.clear"
  | "todo.notif.added.title"
  | "demo.locked.title"
  | "demo.locked.message"
  | "demo.locked.action"
  | "todo.quick.today"
  | "todo.quick.tomorrow"
  | "todo.quick.weekend"
  | "todo.picker.quickDate"
  | "todo.picker.calendar"
  | "todo.picker.prev"
  | "todo.picker.next"
  // Calendar
  | "calendar.view.day"
  | "calendar.view.week"
  | "calendar.view.month"
  | "calendar.timeline.untimed"
  | "calendar.timeline.auto"
  | "calendar.legend.notStart"
  | "calendar.legend.inProgress"
  | "calendar.legend.done"
  | "calendar.today"
  | "calendar.taskDetail.title"
  | "calendar.taskDetail.close"
  | "calendar.empty.day"
  | "calendar.dropHint"
  // Calendar – navigation, days, card labels
  | "calendar.nav.prev"
  | "calendar.nav.today"
  | "calendar.nav.next"
  | "calendar.addCard"
  | "calendar.addCard.placeholder"
  | "calendar.moreItems"
  | "calendar.days.sun"
  | "calendar.days.mon"
  | "calendar.days.tue"
  | "calendar.days.wed"
  | "calendar.days.thu"
  | "calendar.days.fri"
  | "calendar.days.sat"
  | "calendar.days.sunday"
  | "calendar.days.monday"
  | "calendar.days.tuesday"
  | "calendar.days.wednesday"
  | "calendar.days.thursday"
  | "calendar.days.friday"
  | "calendar.days.saturday"
  | "calendar.taskDetail.status"
  | "calendar.taskDetail.titleField"
  | "calendar.taskDetail.date"
  | "calendar.taskDetail.description"
  | "calendar.taskDetail.descPlaceholder"
  | "calendar.taskDetail.aiRetro"
  | "calendar.taskDetail.aiRetroDesc"
  | "calendar.taskDetail.goToRetro"
  | "calendar.taskDetail.time"
  | "calendar.taskDetail.startTime"
  | "calendar.taskDetail.endTime"
  | "calendar.taskDetail.timeHint"
  | "calendar.taskDetail.clearTime"
  // Retrospective
  | "retro.history"
  | "retro.archive"
  | "retro.archiveDescription"
  | "retro.filter.daily"
  | "retro.filter.weekly"
  | "retro.filter.monthly"
  | "retro.filter.yearly"
  | "retro.search"
  | "retro.empty"
  | "retro.editor.titlePlaceholder"
  | "retro.editor.sub"
  | "retro.editor.completed"
  | "retro.editor.noCompleted"
  | "retro.editor.commits"
  | "retro.editor.commitsPast"
  | "retro.editor.noCommitsPast"
  | "retro.editor.learned"
  | "retro.editor.learnedPlaceholder"
  | "retro.editor.save"
  | "retro.editor.pushing"
  | "retro.editor.pushSuccess"
  | "retro.editor.pushFailed"
  | "retro.editor.noCommits"
  | "retro.editor.loadCommits"
  | "retro.editor.synced"
  | "retro.editor.pending"
  | "retro.summarize.weekly"
  | "retro.summarize.monthly"
  | "retro.summarize.yearly"
  | "retro.readiness.title"
  | "retro.readiness.monthlyMessage"
  | "retro.readiness.annualMessage"
  | "retro.readiness.writeMore"
  | "retro.readiness.generate"
  | "retro.period.weeklyTitle"
  | "retro.period.monthlyTitle"
  | "retro.period.yearlyTitle"
  | "retro.period.description"
  | "retro.period.confirm"
  | "retro.period.cancel"
  | "retro.period.weekLabel"
  | "retro.period.currentBadge"
  | "retro.overwrite.title"
  | "retro.overwrite.message"
  | "retro.overwrite.confirm"
  | "retro.overwrite.cancel"
  | "retro.pager.prev"
  | "retro.pager.next"
  | "retro.pager.page"
  | "retro.filter.year"
  | "retro.filter.month"
  | "retro.filter.week"
  | "retro.filter.allYears"
  | "retro.filter.allMonths"
  | "retro.filter.allWeeks"
  | "retro.badge.today"
  | "retro.badge.draft"
  | "retro.badge.synced"
  | "retro.github.notConnected"
  | "retro.github.connectFromSettings"
  | "retro.github.noCommitsEmailHint"
  | "retro.github.noCommitsReconnect"
  | "retro.github.emailsSettingsLink"
  | "retro.newDaily"
  | "retro.newDaily.duplicate"
  | "retro.newDaily.created"
  | "retro.editor.autoSaved"
  // Summary overlay
  | "summary.processing.title"
  | "summary.processing.message"
  | "summary.minimize"
  | "summary.completed.title"
  | "summary.completed.message"
  | "summary.kind.weekly"
  | "summary.kind.monthly"
  | "summary.kind.yearly"
  // Notification panel
  | "notif.panel.title"
  | "notif.panel.subtitle"
  | "notif.panel.empty"
  | "notif.panel.unread"
  | "notif.panel.markAllRead"
  | "notif.panel.clearRead"
  | "notif.panel.clearAll"
  | "notif.panel.close"
  | "notif.panel.retention"
  // Search
  | "search.placeholder"
  | "search.empty"
  | "search.section.todos"
  | "search.section.entries"
  | "search.close"
  // Settings
  | "settings.section.github"
  | "settings.section.region"
  | "settings.region.title"
  | "settings.region.apply"
  | "settings.region.applying"
  | "settings.region.updated"
  | "settings.region.modalTitle"
  | "settings.region.modalMessage"
  | "settings.region.modalMessageWithTz"
  | "settings.region.modalUseNew"
  | "settings.region.modalKeep"
  | "settings.region.selectRegionHint"
  | "settings.region.selectTimezone"
  | "settings.region.selectTimezoneHint"
  | "settings.region.loadingTz"
  | "settings.region.autoTz"
  | "settings.timezone.label"
  | "settings.timezone.hint"
  | "settings.timezone.updated"
  | "settings.section.language"
  | "settings.section.autoSummary"
  | "settings.section.notifications"
  | "settings.github.connected"
  | "settings.github.notConnected"
  | "settings.github.connect"
  | "settings.github.disconnect"
  | "settings.github.connectedAs"
  | "settings.github.targetRepo"
  | "settings.github.permissions"
  | "settings.github.tracked"
  | "settings.github.lastSync"
  | "settings.github.autoRetrospective"
  | "settings.github.checking"
  | "settings.github.noLinked"
  | "settings.github.addRepo"
  | "settings.github.syncAll"
  | "settings.github.unlinkAll"
  | "settings.github.available"
  | "settings.github.noAvailable"
  | "settings.github.link"
  | "settings.github.unlink"
  | "settings.github.connectAccount"
  | "settings.github.connectAccountPending"
  | "settings.github.connectAccountHint"
  | "settings.github.connecting"
  | "settings.github.connectFailed"
  | "settings.github.alreadyLinked"
  | "settings.github.connectedAsLogin"
  | "settings.section.security"
  | "settings.group.security.hint"
  | "settings.sessions.title"
  | "settings.sessions.loading"
  | "settings.sessions.empty"
  | "settings.sessions.thisDevice"
  | "settings.sessions.signOut"
  | "settings.sessions.revokeOthers"
  | "settings.sessions.unknownDevice"
  | "settings.sessions.revoked"
  | "settings.sessions.revokedOthersTitle"
  | "settings.sessions.revokedOthersBody"
  | "security.reuse.title"
  | "security.reuse.message"
  | "security.reuse.action"
  | "settings.github.commitRead"
  | "settings.github.commitReadOn"
  | "settings.github.commitReadOff"
  | "settings.github.pushTarget"
  | "settings.github.pushTargetNone"
  | "settings.github.pushTargetHint"
  | "settings.github.reconnectBanner"
  | "settings.github.reconnectBannerMsg"
  | "settings.github.reconnect"
  | "settings.language.label"
  | "settings.language.rowHint"
  | "settings.region.countryHint"
  | "settings.autoSummary.weekly"
  | "settings.autoSummary.monthly"
  | "settings.autoSummary.yearly"
  | "settings.autoSummary.description"
  | "settings.notifications.retention.label"
  | "settings.notifications.retention.unit"
  | "settings.notifications.retention.hint"
  // Settings — Templates
  | "settings.section.templates"
  | "settings.templates.title"
  | "settings.templates.description"
  | "settings.templates.default"
  | "settings.templates.add"
  | "settings.templates.selectHint"
  | "settings.templates.namePlaceholder"
  | "settings.templates.contentPlaceholder"
  | "settings.templates.reset"
  | "settings.templates.use"
  | "settings.templates.inUse"
  | "settings.templates.activeHint"
  | "settings.templates.newName"
  | "settings.templates.defaultName.daily"
  | "settings.templates.defaultName.weekly"
  | "settings.templates.defaultName.monthly"
  | "settings.templates.defaultName.yearly"
  | "settings.section.integrations"
  | "settings.section.preferences"
  | "settings.group.integrations.hint"
  | "settings.group.preferences.hint"
  | "settings.group.templates.hint"
  // Generic
  | "common.cancel"
  | "common.confirm"
  | "common.save"
  | "common.delete"
  | "common.close"
  | "common.on"
  | "common.off"
  // Auth — common
  | "auth.divider.or"
  | "auth.error.network"
  | "auth.error.unknown"
  | "auth.password.show"
  | "auth.password.hide"
  | "auth.consoleHint"
  // Auth — login
  | "auth.login.title"
  | "auth.login.subtitle"
  | "auth.login.email"
  | "auth.login.password"
  | "auth.login.rememberMe"
  | "auth.login.forgotPassword"
  | "auth.login.submit"
  | "auth.login.submitting"
  | "auth.login.noAccount"
  | "auth.login.signupLink"
  | "auth.login.error.invalidCredentials"
  | "auth.login.error.userNotFound"
  // Auth — signup
  | "auth.signup.title"
  | "auth.signup.subtitle"
  | "auth.signup.step1"
  | "auth.signup.step2"
  | "auth.signup.step3"
  | "auth.signup.email"
  | "auth.signup.emailNext"
  | "auth.signup.emailSending"
  | "auth.signup.code"
  | "auth.signup.codeVerify"
  | "auth.signup.codeResend"
  | "auth.signup.codeResendIn"
  | "auth.signup.password"
  | "auth.signup.passwordHint"
  | "auth.signup.passwordConfirm"
  | "auth.signup.passwordMismatch"
  | "auth.signup.displayName"
  | "auth.signup.displayNamePlaceholder"
  | "auth.signup.terms"
  | "auth.signup.submit"
  | "auth.signup.country"
  | "auth.signup.countryPlaceholder"
  | "auth.signup.region"
  | "auth.signup.regionPlaceholder"
  | "ui.select.search"
  | "ui.select.empty"
  | "auth.signup.error.countryRequired"
  | "auth.signup.error.regionRequired"
  | "auth.onboarding.title"
  | "auth.onboarding.subtitle"
  | "auth.onboarding.lead"
  | "auth.onboarding.submit"
  | "auth.onboarding.backToLogin"
  | "auth.onboarding.error.expired"
  | "auth.signup.submitting"
  | "auth.signup.haveAccount"
  | "auth.signup.loginLink"
  | "auth.signup.back"
  | "auth.signup.error.alreadyRegistered"
  | "auth.signup.error.invalidCode"
  | "auth.signup.error.expired"
  | "auth.signup.error.cooldown"
  | "auth.signup.error.notVerified"
  // Auth — forgot password
  | "auth.forgot.title"
  | "auth.forgot.subtitle"
  | "auth.forgot.emailSubmit"
  | "auth.forgot.codeSubmit"
  | "auth.forgot.newPasswordSubmit"
  | "auth.forgot.success"
  | "auth.forgot.linkSent"
  | "auth.forgot.error.userNotFound"
  | "auth.forgot.backToLogin"
  // Auth — reset password (토큰 링크)
  | "auth.reset.title"
  | "auth.reset.subtitle"
  | "auth.reset.newPassword"
  | "auth.reset.submit"
  | "auth.reset.success"
  | "auth.reset.goLogin"
  | "auth.reset.requestAgain"
  | "auth.reset.error.tokenInvalid"
  | "auth.reset.error.tokenExpired"
  | "auth.reset.error.notAllowed"
  // Auth — OAuth
  | "auth.oauth.github"
  | "auth.oauth.google"
  | "auth.oauth.processing"
  // Auth — header
  | "auth.header.logout"
  // Onboarding — account type selection
  | "onboarding.accountType.title"
  | "onboarding.accountType.subtitle"
  | "onboarding.accountType.developer"
  | "onboarding.accountType.developerDesc"
  | "onboarding.accountType.user"
  | "onboarding.accountType.userDesc"
  | "onboarding.accountType.continue"
  | "onboarding.accountType.skip"
  // Settings — account type
  | "settings.accountType.title"
  | "settings.accountType.hint"
  | "settings.accountType.developer"
  | "settings.accountType.user";

type Dict = Record<TranslationKey, string>;

const ko: Dict = {
  "nav.calendar": "캘린더",
  "nav.todos": "할 일",
  "nav.retrospectives": "회고",
  "nav.settings": "설정",
  "nav.brand": "A.R.C.H.I.V.E",

  "subheader.calendar.eyebrow": "워크스페이스",
  "subheader.calendar.title": "캘린더",
  "subheader.calendar.subtitle":
    "한 달 동안의 작업을 계획하고 추적하세요.",
  "subheader.todos.eyebrow": "워크스페이스",
  "subheader.todos.title": "할 일",
  "subheader.todos.subtitle":
    "보드에서 작업을 만들고 옮기세요.",
  "subheader.retrospectives.eyebrow": "워크스페이스",
  "subheader.retrospectives.title": "회고",
  "subheader.retrospectives.subtitle":
    "기록하고, 돌아보고, AI가 한 주를 요약하게 하세요.",
  "subheader.settings.eyebrow": "계정",
  "subheader.settings.title": "설정",
  "subheader.settings.subtitle":
    "연동, 환경설정, 템플릿, 세션.",

  "sync.connected": "GitHub 연결됨",
  "sync.disconnected": "연결 없음",
  "sync.offline": "오프라인",
  "sync.synced": "연결됨 · {n}",
  "sync.status": "연결 상태",
  "sync.connectInSettings": "설정에서 연결하세요",
  "sync.ago.m": "{n}분 전 연결",
  "sync.ago.h": "{n}시간 전 연결",
  "sync.ago.d": "{n}일 전 연결",
  "sync.ago.M": "{n}개월 전 연결",
  "sync.ago.Y": "{n}년 전 연결",

  "todo.quickCapture.placeholder":
    "할 일을 작성해보세요 — 예: 오늘 내로 보고서 작성하기",
  "todo.quickCapture.hint":
    "입력하는 순간 칸반에 정렬됩니다. 날짜를 비워두면 오늘로 추가합니다.",
  "todo.quickCapture.enter": "Enter",
  "todo.col.notStart.label": "Not Started",
  "todo.col.notStart.ko": "시작 전",
  "todo.col.inProgress.label": "In Progress",
  "todo.col.inProgress.ko": "진행 중",
  "todo.col.done.label": "Done",
  "todo.col.done.ko": "완료",
  "todo.col.empty": "아직 이 열에 배치된 카드가 없습니다.",
  "todo.card.nextStep": "다음 단계",
  "todo.card.advance": "상태 변경",
  "todo.card.changeDate": "날짜 수정",
  "todo.filter.all": "전체",
  "todo.filter.today": "오늘",
  "todo.filter.thisWeek": "이번 주",
  "todo.filter.pickDate": "날짜 선택",
  "todo.filter.clear": "필터 해제",
  "todo.notif.added.title": "할 일 추가됨",
  "demo.locked.title": "로그인이 필요한 작업입니다",
  "demo.locked.message": "GitHub 연동·동기화는 로그인 후 이용할 수 있어요.",
  "demo.locked.action": "로그인",
  "todo.quick.today": "오늘",
  "todo.quick.tomorrow": "내일",
  "todo.quick.weekend": "이번 주말",
  "todo.picker.quickDate": "Quick Date",
  "todo.picker.calendar": "Calendar",
  "todo.picker.prev": "이전 달",
  "todo.picker.next": "다음 달",

  "calendar.view.week": "주간",
  "calendar.view.day": "일간",
  "calendar.view.month": "월간",
  "calendar.timeline.untimed": "시간 미지정",
  "calendar.timeline.auto": "자동",
  "calendar.legend.notStart": "시작 전",
  "calendar.legend.inProgress": "진행 중",
  "calendar.legend.done": "완료",
  "calendar.today": "TODAY",
  "calendar.taskDetail.title": "작업 상세",
  "calendar.taskDetail.close": "닫기",
  "calendar.empty.day": "—",
  "calendar.dropHint": "여기로 놓기",
  "calendar.nav.prev": "← 이전",
  "calendar.nav.today": "오늘로",
  "calendar.nav.next": "다음 →",
  "calendar.addCard": "새 카드",
  "calendar.addCard.placeholder": "할 일 입력 후 Enter",
  "calendar.moreItems": "+{n}개 더 보기",
  "calendar.days.sun": "일",
  "calendar.days.mon": "월",
  "calendar.days.tue": "화",
  "calendar.days.wed": "수",
  "calendar.days.thu": "목",
  "calendar.days.fri": "금",
  "calendar.days.sat": "토",
  "calendar.days.sunday": "일요일",
  "calendar.days.monday": "월요일",
  "calendar.days.tuesday": "화요일",
  "calendar.days.wednesday": "수요일",
  "calendar.days.thursday": "목요일",
  "calendar.days.friday": "금요일",
  "calendar.days.saturday": "토요일",
  "calendar.taskDetail.status": "상태",
  "calendar.taskDetail.titleField": "제목",
  "calendar.taskDetail.date": "날짜",
  "calendar.taskDetail.description": "상세 설명",
  "calendar.taskDetail.descPlaceholder": "작업의 맥락이나 참고 링크를 적어두세요.",
  "calendar.taskDetail.aiRetro": "AI 자동 회고",
  "calendar.taskDetail.aiRetroDesc": "이 작업의 진행 흐름을 회고에 묶어두면, 일요일에 자동으로 주간 요약이 생성됩니다.",
  "calendar.taskDetail.goToRetro": "회고 에디터로 이동",
  "calendar.taskDetail.time": "시간대",
  "calendar.taskDetail.startTime": "시작",
  "calendar.taskDetail.endTime": "종료",
  "calendar.taskDetail.timeHint": "선택 사항 — 비우면 일간 뷰에서 생성 시각 기준 1시간 블록으로 표시됩니다.",
  "calendar.taskDetail.clearTime": "시간 지우기",

  "retro.history": "History",
  "retro.archive": "회고 아카이브",
  "retro.archiveDescription": "매일·매주·매월·매년의 흐름이 한 곳에 모입니다.",
  "retro.filter.daily": "일간",
  "retro.filter.weekly": "주간",
  "retro.filter.monthly": "월간",
  "retro.filter.yearly": "연간",
  "retro.search": "검색...",
  "retro.empty": "해당 유형의 회고가 없습니다.",
  "retro.editor.titlePlaceholder": "제목을 적어주세요",
  "retro.editor.sub": "오늘의 작업과 커밋, 배운 점을 한 흐름으로 묶어보세요.",
  "retro.editor.completed": "완료한 작업 · Completed",
  "retro.editor.noCompleted": "오늘 완료된 작업이 없습니다.",
  "retro.editor.commits": "오늘의 커밋 · Commits",
  "retro.editor.commitsPast": "이 날의 커밋 · Commits",
  "retro.editor.noCommitsPast": "이 날의 커밋이 없습니다",
  "retro.editor.learned": "배운 점과 아쉬운 점 · Learned",
  "retro.editor.learnedPlaceholder":
    "오늘 알게 된 것, 다음에 더 잘하고 싶은 것을 자유롭게 적어주세요.",
  "retro.editor.save": "GitHub에 Push",
  "retro.editor.pushing": "Push 중...",
  "retro.editor.pushSuccess": "GitHub에 Push 완료",
  "retro.editor.pushFailed": "Push 실패, 다시 시도해주세요",
  "retro.editor.noCommits": "오늘의 커밋이 없습니다",
  "retro.editor.loadCommits": "커밋 불러오기",
  "retro.editor.synced": "GitHub에 동기화됨",
  "retro.editor.pending": "동기화 대기 중",
  "retro.summarize.weekly": "주간 요약",
  "retro.summarize.monthly": "월간 요약",
  "retro.summarize.yearly": "연간 요약",
  "retro.readiness.title": "데이터가 부족합니다",
  "retro.readiness.monthlyMessage":
    "이번 달에 작성된 회고가 {covered}/{expected}일 입니다.\n데이터가 부족해 요약 품질이 낮을 수 있습니다.",
  "retro.readiness.annualMessage":
    "{year}년에 회고가 있는 달이 {covered}/12 입니다.\n데이터가 부족해 요약 품질이 낮을 수 있습니다.",
  "retro.readiness.writeMore": "더 작성하기",
  "retro.readiness.generate": "그대로 생성",
  "retro.period.weeklyTitle": "요약할 주를 선택하세요",
  "retro.period.monthlyTitle": "요약할 달을 선택하세요",
  "retro.period.yearlyTitle": "요약할 연도를 선택하세요",
  "retro.period.description": "선택한 기간의 회고를 AI 가 요약합니다.",
  "retro.period.confirm": "요약 생성",
  "retro.period.cancel": "취소",
  "retro.period.weekLabel": "{year}년 {week}주차",
  "retro.period.currentBadge": "진행 중",
  "retro.overwrite.title": "이미 요약된 회고록이 있습니다",
  "retro.overwrite.message":
    "이 기간에 이미 AI 요약 회고록이 있습니다.\n다시 요약해서 기존 내용을 덮어쓸까요?",
  "retro.overwrite.confirm": "다시 요약 · 덮어쓰기",
  "retro.overwrite.cancel": "취소",
  "retro.pager.prev": "이전",
  "retro.pager.next": "다음",
  "retro.pager.page": "{current} / {total}",
  "retro.filter.year": "연도",
  "retro.filter.month": "월",
  "retro.filter.week": "주",
  "retro.filter.allYears": "전체 연도",
  "retro.filter.allMonths": "전체 월",
  "retro.filter.allWeeks": "전체 주",
  "retro.badge.today": "Today",
  "retro.badge.draft": "Draft",
  "retro.badge.synced": "Synced",
  "retro.github.notConnected": "GitHub 미연결 — 커밋과 동기화 비활성화됨",
  "retro.github.connectFromSettings": "Settings에서 GitHub 계정을 연결하세요.",
  "retro.github.noCommitsEmailHint":
    "이 날 작성한 commit이 없습니다. 사용 중인 git config user.email이 GitHub 계정에 등록됐는지 확인해주세요.",
  "retro.github.noCommitsReconnect":
    "GitHub 재연결이 필요합니다. 재연결하면 로컬 commit이 더 정확히 표시됩니다.",
  "retro.github.emailsSettingsLink": "GitHub Settings → Emails 바로가기",
  "retro.newDaily": "오늘의 일일 회고 작성",
  "retro.newDaily.duplicate": "오늘의 회고록이 이미 존재합니다",
  "retro.newDaily.created": "오늘의 일일 회고가 생성되었습니다",
  "retro.editor.autoSaved": "변경사항은 자동으로 저장됩니다",

  "summary.processing.title": "AI 요약 처리 중",
  "summary.processing.message":
    "회고 자료를 분석하고 있어요. 잠시만 기다려주세요.",
  "summary.minimize": "최소화",
  "summary.completed.title": "AI 요약 완료",
  "summary.completed.message": "{kind} 요약이 회고록에 저장되었습니다.",
  "summary.kind.weekly": "주간",
  "summary.kind.monthly": "월간",
  "summary.kind.yearly": "연간",

  "notif.panel.title": "알림",
  "notif.panel.subtitle": "최근 30일간의 활동",
  "notif.panel.empty": "알림이 없습니다.",
  "notif.panel.unread": "{n}개의 새 알림",
  "notif.panel.markAllRead": "모두 읽음",
  "notif.panel.clearRead": "읽음 삭제",
  "notif.panel.clearAll": "모두 삭제",
  "notif.panel.close": "닫기",
  "notif.panel.retention": "{n}일 이상 지난 알림은 자동으로 삭제됩니다.",

  "search.placeholder": "할 일·회고록 검색...",
  "search.empty": "검색 결과가 없습니다.",
  "search.section.todos": "할 일",
  "search.section.entries": "회고록",
  "search.close": "검색 닫기",

  "settings.section.github": "GitHub",
  "settings.section.language": "언어",
  "settings.section.autoSummary": "자동 회고 요약",
  "settings.section.notifications": "알림",
  "settings.github.connected": "연결됨",
  "settings.github.notConnected": "연결되지 않음",
  "settings.github.connect": "연결",
  "settings.github.disconnect": "연결 해제",
  "settings.github.connectedAs": "계정",
  "settings.github.targetRepo": "대상 저장소",
  "settings.github.permissions": "권한",
  "settings.github.tracked": "추적 저장소",
  "settings.github.lastSync": "마지막 동기화",
  "settings.github.autoRetrospective": "자동 회고 동기화",
  "settings.github.checking": "연결 상태 확인 중…",
  "settings.github.noLinked": "연결된 저장소가 없습니다",
  "settings.github.addRepo": "저장소 추가",
  "settings.github.syncAll": "전체 동기화",
  "settings.github.unlinkAll": "전체 연결 해제",
  "settings.github.available": "연결 가능한 저장소",
  "settings.github.noAvailable": "연결 가능한 저장소가 없습니다",
  "settings.github.link": "연결",
  "settings.github.unlink": "해제",
  "settings.github.connectAccount": "GitHub 계정 연결",
  "settings.github.connectAccountPending":
    "GitHub 계정 연결 기능은 곧 제공됩니다. GitHub로 로그인하면 저장소를 연결할 수 있습니다.",
  "settings.github.connectAccountHint":
    "GitHub 계정을 연결하면 저장소를 연결하고 커밋·회고 push를 사용할 수 있습니다.",
  "settings.github.connecting": "연결 중…",
  "settings.github.connectFailed": "GitHub 연결에 실패했습니다. 다시 시도해주세요.",
  "settings.github.alreadyLinked": "이미 다른 계정에 연결된 GitHub 계정이거나, 이미 연결되어 있습니다.",
  "settings.section.security": "보안",
  "settings.group.security.hint": "로그인된 기기와 세션을 관리합니다.",
  "settings.sessions.title": "활성 세션",
  "settings.sessions.loading": "세션을 불러오는 중…",
  "settings.sessions.empty": "활성 세션이 없습니다.",
  "settings.sessions.thisDevice": "이 기기",
  "settings.sessions.signOut": "로그아웃",
  "settings.sessions.revokeOthers": "다른 모든 기기에서 로그아웃",
  "settings.sessions.unknownDevice": "알 수 없는 기기",
  "settings.sessions.revoked": "세션이 종료되었습니다",
  "settings.sessions.revokedOthersTitle": "다른 기기 로그아웃 완료",
  "settings.sessions.revokedOthersBody": "{count}개 기기에서 로그아웃했습니다.",
  "security.reuse.title": "보안 알림",
  "security.reuse.message":
    "다른 위치에서의 로그인 시도가 감지되어 모든 세션이 자동으로 종료되었습니다. 본인의 시도가 아니라면 비밀번호를 변경해 주세요.",
  "security.reuse.action": "다시 로그인",
  "settings.github.connectedAsLogin": "@{login} 으로 연결됨",
  "settings.github.commitRead": "커밋 읽기",
  "settings.github.commitReadOn": "포함",
  "settings.github.commitReadOff": "제외",
  "settings.github.pushTarget": "Push 대상 저장소",
  "settings.github.pushTargetNone": "선택 안함",
  "settings.github.pushTargetHint":
    "회고 마크다운을 push할 저장소입니다. 연결된 저장소 중 하나를 선택하세요.",
  "settings.github.reconnectBanner": "GitHub 연결 업데이트 필요",
  "settings.github.reconnectBannerMsg":
    "gitbash 등에서 작성한 commit이 정확히 표시되도록 권한 업데이트가 필요합니다.",
  "settings.github.reconnect": "GitHub 재연결",
  "settings.section.region": "지역 및 시간대",
  "settings.region.title": "국가 / 시간대",
  "settings.region.apply": "국가 변경 적용",
  "settings.region.applying": "적용 중…",
  "settings.region.updated": "국가가 변경되었습니다",
  "settings.region.modalTitle": "AI 요약 시간도 변경할까요?",
  "settings.region.modalMessage":
    "국가를 변경하면 AI 자동 요약 실행 시간대(현지 새벽 1시)를 새 국가 기준으로 바꿀 수 있습니다. 기존 시간대를 유지할 수도 있어요.",
  "settings.region.modalMessageWithTz":
    "{country}로 변경하면 시간대가 {timezone}으로 설정됩니다. AI 자동 요약 실행 시간(현지 새벽 1시)도 새 시간대로 변경할까요?",
  "settings.region.modalUseNew": "새 국가 기준으로 변경",
  "settings.region.modalKeep": "기존 시간대 유지",
  "settings.region.selectRegionHint": "지역을 선택하면 적용 버튼이 활성화됩니다.",
  "settings.region.selectTimezone": "시간대 선택",
  "settings.region.selectTimezoneHint": "이 국가는 여러 시간대가 있습니다. 시간대를 선택해 주세요.",
  "settings.region.loadingTz": "시간대 불러오는 중…",
  "settings.region.autoTz": "자동 시간대: {timezone}",
  "settings.timezone.label": "시간대 (요약 실행 기준)",
  "settings.timezone.hint":
    "AI 자동 요약은 이 시간대의 새벽 1시에 실행됩니다.",
  "settings.timezone.updated": "시간대가 변경되었습니다",
  "settings.language.label": "언어 선택",
  "settings.language.rowHint": "인터페이스 표시 언어",
  "settings.region.countryHint": "날짜·요약 기준 지역",
  "settings.autoSummary.weekly": "주간 자동 요약",
  "settings.autoSummary.monthly": "월간 자동 요약",
  "settings.autoSummary.yearly": "연간 자동 요약",
  "settings.autoSummary.description":
    "활성화하면 해당 기간이 끝나는 자정에 AI가 자동으로 회고를 요약합니다.",
  "settings.notifications.retention.label": "알림 보관 기간",
  "settings.notifications.retention.unit": "일",
  "settings.notifications.retention.hint": "오래된 알림을 자동으로 삭제합니다.",
  "settings.section.templates": "회고록 템플릿",
  "settings.templates.title": "Retro Templates",
  "settings.templates.description":
    "새 회고록을 생성할 때 자동으로 적용될 초기 구조를 편집합니다. / 로 블록을 삽입하세요.",
  "settings.templates.default": "기본",
  "settings.templates.add": "새 템플릿 추가",
  "settings.templates.selectHint": "왼쪽 목록에서 템플릿을 선택하세요.",
  "settings.templates.namePlaceholder": "템플릿 이름",
  "settings.templates.contentPlaceholder":
    "회고록에 미리 채워질 내용을 작성하세요. / 로 블록을 삽입할 수 있습니다.",
  "settings.templates.reset": "기본값으로 초기화",
  "settings.templates.use": "사용하기",
  "settings.templates.inUse": "사용 중",
  "settings.templates.activeHint":
    "’사용 중’ 템플릿이 새 회고를 만들 때 자동으로 적용됩니다.",
  "settings.templates.newName": "새 {type} 템플릿",
  "settings.templates.defaultName.daily": "기본 일간 템플릿",
  "settings.templates.defaultName.weekly": "기본 주간 템플릿",
  "settings.templates.defaultName.monthly": "기본 월간 템플릿",
  "settings.templates.defaultName.yearly": "기본 연간 템플릿",
  "settings.section.integrations": "연동",
  "settings.section.preferences": "환경설정",
  "settings.group.integrations.hint": "외부 서비스 연결을 관리합니다.",
  "settings.group.preferences.hint": "언어, 자동 요약, 알림 동작을 조정합니다.",
  "settings.group.templates.hint":
    "회고 유형별 기본 구조를 정의하고, 사용할 템플릿을 선택합니다.",

  "common.cancel": "취소",
  "common.confirm": "확인",
  "common.save": "저장",
  "common.delete": "삭제",
  "common.close": "닫기",
  "common.on": "켜짐",
  "common.off": "꺼짐",

  "auth.divider.or": "또는",
  "auth.error.network": "네트워크 연결을 확인해주세요.",
  "auth.error.unknown": "알 수 없는 오류가 발생했어요.",
  "auth.password.show": "비밀번호 표시",
  "auth.password.hide": "비밀번호 숨기기",
  "auth.consoleHint": "이메일은 발송되지 않습니다. 브라우저 개발자 도구 콘솔에서 인증 코드를 확인하세요.",

  "auth.login.title": "다시 만나서 반가워요",
  "auth.login.subtitle": "ARCHIVE 계정으로 로그인",
  "auth.login.email": "이메일",
  "auth.login.password": "비밀번호",
  "auth.login.rememberMe": "로그인 상태 유지",
  "auth.login.forgotPassword": "비밀번호를 잊으셨나요?",
  "auth.login.submit": "로그인",
  "auth.login.submitting": "로그인 중…",
  "auth.login.noAccount": "아직 계정이 없으신가요?",
  "auth.login.signupLink": "회원가입",
  "auth.login.error.invalidCredentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "auth.login.error.userNotFound": "등록되지 않은 이메일이에요.",

  "auth.signup.title": "ARCHIVE 시작하기",
  "auth.signup.subtitle": "이메일 인증 후 가입할 수 있어요",
  "auth.signup.step1": "이메일",
  "auth.signup.step2": "코드 확인",
  "auth.signup.step3": "프로필",
  "auth.signup.email": "이메일",
  "auth.signup.emailNext": "인증 코드 받기",
  "auth.signup.emailSending": "코드 발송 중…",
  "auth.signup.code": "인증 코드 (6자리)",
  "auth.signup.codeVerify": "코드 확인",
  "auth.signup.codeResend": "코드 재전송",
  "auth.signup.codeResendIn": "{n}초 후 재전송",
  "auth.signup.password": "비밀번호",
  "auth.signup.passwordHint": "최소 8자 이상",
  "auth.signup.passwordConfirm": "비밀번호 확인",
  "auth.signup.passwordMismatch": "비밀번호가 일치하지 않습니다.",
  "auth.signup.displayName": "닉네임",
  "auth.signup.displayNamePlaceholder": "다른 사용자에게 보일 이름",
  "auth.signup.terms": "이용약관 및 개인정보 처리방침에 동의합니다.",
  "auth.signup.submit": "가입 완료",
  "auth.signup.country": "국가",
  "auth.signup.countryPlaceholder": "국가를 선택하세요",
  "auth.signup.region": "지역 (주/도)",
  "auth.signup.regionPlaceholder": "지역을 선택하세요",
  "ui.select.search": "검색...",
  "ui.select.empty": "결과 없음",
  "auth.signup.error.countryRequired": "국가를 선택해주세요.",
  "auth.signup.error.regionRequired": "이 국가는 지역(주/도) 선택이 필요합니다.",
  "auth.onboarding.title": "거의 다 됐어요",
  "auth.onboarding.subtitle": "타임존 설정을 위해 국가 정보를 입력하세요",
  "auth.onboarding.lead": "기간 집계가 정확하도록 거주 국가(필요 시 지역)를 선택해주세요.",
  "auth.onboarding.submit": "가입 완료",
  "auth.onboarding.backToLogin": "로그인으로 돌아가기",
  "auth.onboarding.error.expired": "세션이 만료되었습니다. GitHub/Google로 다시 시도해주세요.",
  "auth.signup.submitting": "가입 처리 중…",
  "auth.signup.haveAccount": "이미 계정이 있으신가요?",
  "auth.signup.loginLink": "로그인",
  "auth.signup.back": "이전",
  "auth.signup.error.alreadyRegistered": "이미 가입된 이메일이에요.",
  "auth.signup.error.invalidCode": "잘못된 코드입니다.",
  "auth.signup.error.expired": "코드가 만료됐어요. 재전송 해주세요.",
  "auth.signup.error.cooldown": "잠시 후 다시 시도해주세요.",
  "auth.signup.error.notVerified": "이메일 인증을 먼저 완료해주세요.",

  "auth.forgot.title": "비밀번호 재설정",
  "auth.forgot.subtitle": "가입한 이메일로 인증 코드를 보내드려요",
  "auth.forgot.emailSubmit": "재설정 링크 받기",
  "auth.forgot.codeSubmit": "코드 확인",
  "auth.forgot.newPasswordSubmit": "비밀번호 변경",
  "auth.forgot.success": "비밀번호가 변경되었어요. 다시 로그인해주세요.",
  "auth.forgot.error.userNotFound": "등록되지 않은 이메일이에요.",
  "auth.forgot.linkSent":
    "입력하신 이메일이 가입되어 있다면 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해주세요.",
  "auth.forgot.backToLogin": "로그인으로 돌아가기",
  "auth.reset.title": "새 비밀번호 설정",
  "auth.reset.subtitle": "새로 사용할 비밀번호를 입력해주세요.",
  "auth.reset.newPassword": "새 비밀번호",
  "auth.reset.submit": "비밀번호 변경",
  "auth.reset.success":
    "비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요.",
  "auth.reset.goLogin": "로그인하러 가기",
  "auth.reset.requestAgain": "재설정 링크 다시 받기",
  "auth.reset.error.tokenInvalid":
    "유효하지 않은 링크입니다. 재설정을 다시 요청해주세요.",
  "auth.reset.error.tokenExpired":
    "링크가 만료되었습니다. 재설정을 다시 요청해주세요.",
  "auth.reset.error.notAllowed":
    "이 계정은 비밀번호 재설정을 사용할 수 없습니다.",

  "auth.oauth.github": "GitHub으로 계속하기",
  "auth.oauth.google": "Google로 계속하기",
  "auth.oauth.processing": "처리 중…",

  "auth.header.logout": "로그아웃",

  "onboarding.accountType.title": "어떻게 사용하실 예정인가요?",
  "onboarding.accountType.subtitle": "작업 방식에 맞는 경험을 제공합니다. 언제든 설정에서 변경할 수 있어요.",
  "onboarding.accountType.developer": "개발자",
  "onboarding.accountType.developerDesc": "GitHub 커밋 기록, 회고 연동 등 개발자 특화 기능을 포함합니다.",
  "onboarding.accountType.user": "일반 사용자",
  "onboarding.accountType.userDesc": "캘린더, 할 일, 회고 중심의 기본 경험입니다.",
  "onboarding.accountType.continue": "시작하기",
  "onboarding.accountType.skip": "건너뛰기 (일반 사용자로 시작)",

  "settings.accountType.title": "계정 유형",
  "settings.accountType.hint": "개발자 계정은 GitHub 연동 및 커밋 기록 기능을 제공합니다.",
  "settings.accountType.developer": "개발자",
  "settings.accountType.user": "일반 사용자",
};

const en: Dict = {
  "nav.calendar": "Calendar",
  "nav.todos": "To-Dos",
  "nav.retrospectives": "Retrospectives",
  "nav.settings": "Settings",
  "nav.brand": "A.R.C.H.I.V.E",

  "subheader.calendar.eyebrow": "Workspace",
  "subheader.calendar.title": "Calendar",
  "subheader.calendar.subtitle":
    "Plan and track your tasks across the month.",
  "subheader.todos.eyebrow": "Workspace",
  "subheader.todos.title": "Todos",
  "subheader.todos.subtitle":
    "Create and move tasks on the board.",
  "subheader.retrospectives.eyebrow": "Workspace",
  "subheader.retrospectives.title": "Retrospectives",
  "subheader.retrospectives.subtitle":
    "Write, reflect, and let AI summarize your week.",
  "subheader.settings.eyebrow": "Account",
  "subheader.settings.title": "Settings",
  "subheader.settings.subtitle":
    "Integrations, preferences, templates and sessions.",

  "sync.connected": "GitHub connected",
  "sync.disconnected": "Not connected",
  "sync.offline": "Offline",
  "sync.synced": "Connected · {n}",
  "sync.status": "Connection Status",
  "sync.connectInSettings": "Connect from Settings",
  "sync.ago.m": "Connected {n}m ago",
  "sync.ago.h": "Connected {n}h ago",
  "sync.ago.d": "Connected {n}d ago",
  "sync.ago.M": "Connected {n}mo ago",
  "sync.ago.Y": "Connected {n}y ago",

  "todo.quickCapture.placeholder":
    "Write a task — e.g. Draft the weekly report by today",
  "todo.quickCapture.hint":
    "Hit enter to send it to the board. No date? It goes to today.",
  "todo.quickCapture.enter": "Enter",
  "todo.col.notStart.label": "Not Started",
  "todo.col.notStart.ko": "Backlog",
  "todo.col.inProgress.label": "In Progress",
  "todo.col.inProgress.ko": "Active",
  "todo.col.done.label": "Done",
  "todo.col.done.ko": "Complete",
  "todo.col.empty": "Nothing here yet.",
  "todo.card.nextStep": "Next step",
  "todo.card.advance": "Advance status",
  "todo.card.changeDate": "Change date",
  "todo.filter.all": "All",
  "todo.filter.today": "Today",
  "todo.filter.thisWeek": "This week",
  "todo.filter.pickDate": "Pick date",
  "todo.filter.clear": "Clear filter",
  "todo.notif.added.title": "Task added",
  "demo.locked.title": "Sign-in required",
  "demo.locked.message": "GitHub connect & sync are available after you sign in.",
  "demo.locked.action": "Sign in",
  "todo.quick.today": "Today",
  "todo.quick.tomorrow": "Tomorrow",
  "todo.quick.weekend": "This weekend",
  "todo.picker.quickDate": "Quick Date",
  "todo.picker.calendar": "Calendar",
  "todo.picker.prev": "Previous month",
  "todo.picker.next": "Next month",

  "calendar.view.week": "Week",
  "calendar.view.day": "Day",
  "calendar.view.month": "Month",
  "calendar.timeline.untimed": "No time",
  "calendar.timeline.auto": "auto",
  "calendar.legend.notStart": "Todo",
  "calendar.legend.inProgress": "In progress",
  "calendar.legend.done": "Done",
  "calendar.today": "TODAY",
  "calendar.taskDetail.title": "Task Detail",
  "calendar.taskDetail.close": "Close",
  "calendar.empty.day": "—",
  "calendar.dropHint": "Drop here",
  "calendar.nav.prev": "Prev",
  "calendar.nav.today": "Today",
  "calendar.nav.next": "Next",
  "calendar.addCard": "New card",
  "calendar.addCard.placeholder": "Type a task and press Enter",
  "calendar.moreItems": "+{n} more",
  "calendar.days.sun": "Sun",
  "calendar.days.mon": "Mon",
  "calendar.days.tue": "Tue",
  "calendar.days.wed": "Wed",
  "calendar.days.thu": "Thu",
  "calendar.days.fri": "Fri",
  "calendar.days.sat": "Sat",
  "calendar.days.sunday": "Sunday",
  "calendar.days.monday": "Monday",
  "calendar.days.tuesday": "Tuesday",
  "calendar.days.wednesday": "Wednesday",
  "calendar.days.thursday": "Thursday",
  "calendar.days.friday": "Friday",
  "calendar.days.saturday": "Saturday",
  "calendar.taskDetail.status": "Status",
  "calendar.taskDetail.titleField": "Title",
  "calendar.taskDetail.date": "Date",
  "calendar.taskDetail.description": "Description",
  "calendar.taskDetail.descPlaceholder": "Jot down context or reference links.",
  "calendar.taskDetail.aiRetro": "AI Auto-Retrospective",
  "calendar.taskDetail.aiRetroDesc": "Link this task to a retrospective and a weekly summary will be generated automatically each Sunday.",
  "calendar.taskDetail.goToRetro": "Open retrospective editor",
  "calendar.taskDetail.time": "Time",
  "calendar.taskDetail.startTime": "Start",
  "calendar.taskDetail.endTime": "End",
  "calendar.taskDetail.timeHint": "Optional — if empty, the day view shows a 1-hour block from when it was created.",
  "calendar.taskDetail.clearTime": "Clear time",

  "retro.history": "History",
  "retro.archive": "Retrospective Archive",
  "retro.archiveDescription":
    "Daily · weekly · monthly · yearly entries in one place.",
  "retro.filter.daily": "Daily",
  "retro.filter.weekly": "Weekly",
  "retro.filter.monthly": "Monthly",
  "retro.filter.yearly": "Yearly",
  "retro.search": "Search...",
  "retro.empty": "No retrospectives in this filter.",
  "retro.editor.titlePlaceholder": "Write a title",
  "retro.editor.sub":
    "Tie today's tasks, commits, and lessons together in one thread.",
  "retro.editor.completed": "Completed work",
  "retro.editor.noCompleted": "No completed tasks today.",
  "retro.editor.commits": "Today's commits",
  "retro.editor.commitsPast": "Commits on this day",
  "retro.editor.noCommitsPast": "No commits on this day",
  "retro.editor.learned": "What I learned",
  "retro.editor.learnedPlaceholder":
    "Write freely about what you learned and what you'd improve.",
  "retro.editor.save": "Push to GitHub",
  "retro.editor.pushing": "Pushing...",
  "retro.editor.pushSuccess": "Pushed to GitHub",
  "retro.editor.pushFailed": "Push failed, please try again",
  "retro.editor.noCommits": "No commits today",
  "retro.editor.loadCommits": "Load commits",
  "retro.editor.synced": "Synced to GitHub",
  "retro.editor.pending": "Sync pending",
  "retro.summarize.weekly": "Weekly summary",
  "retro.summarize.monthly": "Monthly summary",
  "retro.summarize.yearly": "Yearly summary",
  "retro.readiness.title": "Not enough data",
  "retro.readiness.monthlyMessage":
    "Only {covered}/{expected} days have retros this month.\nThe summary quality may be low due to insufficient data.",
  "retro.readiness.annualMessage":
    "Only {covered}/12 months have retros in {year}.\nThe summary quality may be low due to insufficient data.",
  "retro.readiness.writeMore": "Write more",
  "retro.readiness.generate": "Generate anyway",
  "retro.period.weeklyTitle": "Select a week to summarize",
  "retro.period.monthlyTitle": "Select a month to summarize",
  "retro.period.yearlyTitle": "Select a year to summarize",
  "retro.period.description": "AI will summarize the retros in the selected period.",
  "retro.period.confirm": "Generate summary",
  "retro.period.cancel": "Cancel",
  "retro.period.weekLabel": "{year} Week {week}",
  "retro.period.currentBadge": "Current",
  "retro.overwrite.title": "A summary already exists",
  "retro.overwrite.message":
    "An AI summary retro already exists for this period.\nGenerate again and overwrite the existing content?",
  "retro.overwrite.confirm": "Re-summarize & overwrite",
  "retro.overwrite.cancel": "Cancel",
  "retro.pager.prev": "Prev",
  "retro.pager.next": "Next",
  "retro.pager.page": "{current} / {total}",
  "retro.filter.year": "Year",
  "retro.filter.month": "Month",
  "retro.filter.week": "Week",
  "retro.filter.allYears": "All years",
  "retro.filter.allMonths": "All months",
  "retro.filter.allWeeks": "All weeks",
  "retro.badge.today": "Today",
  "retro.badge.draft": "Draft",
  "retro.badge.synced": "Synced",
  "retro.github.notConnected": "GitHub not connected — commits & sync disabled",
  "retro.github.connectFromSettings": "Connect a GitHub account from Settings.",
  "retro.github.noCommitsEmailHint":
    "No commits found for this day. Make sure your git config user.email is registered in your GitHub account.",
  "retro.github.noCommitsReconnect":
    "GitHub reconnection required. Reconnecting will improve local commit detection accuracy.",
  "retro.github.emailsSettingsLink": "GitHub Settings → Emails",
  "retro.newDaily": "Write today's daily retrospective",
  "retro.newDaily.duplicate": "Today's retrospective already exists",
  "retro.newDaily.created": "Today's daily retrospective has been created",
  "retro.editor.autoSaved": "Changes are saved automatically",

  "summary.processing.title": "AI summary in progress",
  "summary.processing.message":
    "Analyzing your retrospective notes. Hang tight.",
  "summary.minimize": "Minimize",
  "summary.completed.title": "AI summary ready",
  "summary.completed.message": "{kind} summary saved to your retrospectives.",
  "summary.kind.weekly": "Weekly",
  "summary.kind.monthly": "Monthly",
  "summary.kind.yearly": "Yearly",

  "notif.panel.title": "Notifications",
  "notif.panel.subtitle": "Activity from the last 30 days",
  "notif.panel.empty": "No notifications.",
  "notif.panel.unread": "{n} new",
  "notif.panel.markAllRead": "Mark all read",
  "notif.panel.clearRead": "Clear read",
  "notif.panel.clearAll": "Clear all",
  "notif.panel.close": "Close",
  "notif.panel.retention":
    "Notifications older than {n} days are removed automatically.",

  "search.placeholder": "Search tasks & retrospectives...",
  "search.empty": "No matches found.",
  "search.section.todos": "Tasks",
  "search.section.entries": "Retrospectives",
  "search.close": "Close search",

  "settings.section.github": "GitHub",
  "settings.section.language": "Language",
  "settings.section.autoSummary": "Automatic retrospective summary",
  "settings.section.notifications": "Notifications",
  "settings.github.connected": "Connected",
  "settings.github.notConnected": "Not connected",
  "settings.github.connect": "Connect",
  "settings.github.disconnect": "Disconnect",
  "settings.github.connectedAs": "Account",
  "settings.github.targetRepo": "Target repository",
  "settings.github.permissions": "Permissions",
  "settings.github.tracked": "Tracked repositories",
  "settings.github.lastSync": "Last synced",
  "settings.github.autoRetrospective": "Auto retrospective sync",
  "settings.github.checking": "Checking connection…",
  "settings.github.noLinked": "No linked repositories",
  "settings.github.addRepo": "Add repository",
  "settings.github.syncAll": "Sync all",
  "settings.github.unlinkAll": "Unlink all",
  "settings.github.available": "Available repositories",
  "settings.github.noAvailable": "No repositories available",
  "settings.github.link": "Link",
  "settings.github.unlink": "Unlink",
  "settings.github.connectAccount": "Connect GitHub account",
  "settings.github.connectAccountPending":
    "GitHub account linking is coming soon. Sign in with GitHub to link repositories.",
  "settings.github.connectAccountHint":
    "Connect your GitHub account to link repositories and use commit & retrospective push.",
  "settings.github.connecting": "Connecting…",
  "settings.github.connectFailed": "Failed to connect GitHub. Please try again.",
  "settings.github.alreadyLinked": "This GitHub account is already linked to another user, or already connected.",
  "settings.section.security": "Security",
  "settings.group.security.hint": "Manage your signed-in devices and sessions.",
  "settings.sessions.title": "Active sessions",
  "settings.sessions.loading": "Loading sessions…",
  "settings.sessions.empty": "No active sessions.",
  "settings.sessions.thisDevice": "This device",
  "settings.sessions.signOut": "Sign out",
  "settings.sessions.revokeOthers": "Sign out all other devices",
  "settings.sessions.unknownDevice": "Unknown device",
  "settings.sessions.revoked": "Session ended",
  "settings.sessions.revokedOthersTitle": "Other devices signed out",
  "settings.sessions.revokedOthersBody": "Signed out from {count} device(s).",
  "security.reuse.title": "Security alert",
  "security.reuse.message":
    "A sign-in from another location was detected, so all sessions were ended automatically. If this wasn't you, please change your password.",
  "security.reuse.action": "Sign in again",
  "settings.github.connectedAsLogin": "Connected as @{login}",
  "settings.github.commitRead": "Commit read",
  "settings.github.commitReadOn": "Include",
  "settings.github.commitReadOff": "Exclude",
  "settings.github.pushTarget": "Push target repository",
  "settings.github.pushTargetNone": "None",
  "settings.github.pushTargetHint":
    "Retrospective markdown will be pushed to this repository.",
  "settings.github.reconnectBanner": "GitHub connection update required",
  "settings.github.reconnectBannerMsg":
    "A permission update is needed to accurately display commits made via git bash or local tools.",
  "settings.github.reconnect": "Reconnect GitHub",
  "settings.section.region": "Region & Timezone",
  "settings.region.title": "Country / Timezone",
  "settings.region.apply": "Apply country change",
  "settings.region.applying": "Applying…",
  "settings.region.updated": "Country updated",
  "settings.region.modalTitle": "Update summary time too?",
  "settings.region.modalMessage":
    "Changing your country can update the AI auto-summary timezone (1 AM local) to the new country. You can also keep your current timezone.",
  "settings.region.modalMessageWithTz":
    "Changing to {country} will set the timezone to {timezone}. Update the AI summary schedule (1 AM local) too?",
  "settings.region.modalUseNew": "Use new country's timezone",
  "settings.region.modalKeep": "Keep current timezone",
  "settings.region.selectRegionHint": "Select a region to enable the apply button.",
  "settings.region.selectTimezone": "Select timezone",
  "settings.region.selectTimezoneHint": "This country has multiple timezones. Please select one.",
  "settings.region.loadingTz": "Loading timezones…",
  "settings.region.autoTz": "Auto timezone: {timezone}",
  "settings.timezone.label": "Timezone (summary schedule)",
  "settings.timezone.hint":
    "AI auto-summary runs at 1 AM in this timezone.",
  "settings.timezone.updated": "Timezone updated",
  "settings.language.label": "Language",
  "settings.language.rowHint": "Interface display language",
  "settings.region.countryHint": "Region used for dates & summaries",
  "settings.autoSummary.weekly": "Weekly auto-summary",
  "settings.autoSummary.monthly": "Monthly auto-summary",
  "settings.autoSummary.yearly": "Yearly auto-summary",
  "settings.autoSummary.description":
    "When on, the AI will summarize retrospectives automatically at midnight when the period ends.",
  "settings.notifications.retention.label": "Notification retention",
  "settings.notifications.retention.unit": "days",
  "settings.notifications.retention.hint": "Old notifications are deleted automatically.",
  "settings.section.templates": "Retro Templates",
  "settings.templates.title": "Retro Templates",
  "settings.templates.description":
    "Edit the default structure applied when a new retrospective is created. Use / to insert blocks.",
  "settings.templates.default": "Default",
  "settings.templates.add": "New template",
  "settings.templates.selectHint": "Select a template from the list on the left.",
  "settings.templates.namePlaceholder": "Template name",
  "settings.templates.contentPlaceholder":
    "Write the content that will pre-fill a new retrospective. Use / to insert blocks.",
  "settings.templates.reset": "Reset to default",
  "settings.templates.use": "Use",
  "settings.templates.inUse": "In use",
  "settings.templates.activeHint":
    "The 'in use' template is applied automatically when a new retrospective is created.",
  "settings.templates.newName": "New {type} template",
  "settings.templates.defaultName.daily": "Default daily template",
  "settings.templates.defaultName.weekly": "Default weekly template",
  "settings.templates.defaultName.monthly": "Default monthly template",
  "settings.templates.defaultName.yearly": "Default yearly template",
  "settings.section.integrations": "Integrations",
  "settings.section.preferences": "Preferences",
  "settings.group.integrations.hint": "Manage connections to external services.",
  "settings.group.preferences.hint":
    "Adjust language, auto-summary, and notification behavior.",
  "settings.group.templates.hint":
    "Define the default structure per retrospective type and pick which to use.",

  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.close": "Close",
  "common.on": "On",
  "common.off": "Off",

  "auth.divider.or": "or",
  "auth.error.network": "Please check your network connection.",
  "auth.error.unknown": "Something went wrong.",
  "auth.password.show": "Show password",
  "auth.password.hide": "Hide password",
  "auth.consoleHint": "No real email is sent. Check the verification code in your browser's developer console.",

  "auth.login.title": "Welcome back",
  "auth.login.subtitle": "Sign in to your ARCHIVE account",
  "auth.login.email": "Email",
  "auth.login.password": "Password",
  "auth.login.rememberMe": "Stay signed in",
  "auth.login.forgotPassword": "Forgot password?",
  "auth.login.submit": "Sign in",
  "auth.login.submitting": "Signing in…",
  "auth.login.noAccount": "Don't have an account?",
  "auth.login.signupLink": "Sign up",
  "auth.login.error.invalidCredentials": "Incorrect email or password.",
  "auth.login.error.userNotFound": "This email isn't registered.",

  "auth.signup.title": "Start with ARCHIVE",
  "auth.signup.subtitle": "Verify your email to create an account",
  "auth.signup.step1": "Email",
  "auth.signup.step2": "Verify",
  "auth.signup.step3": "Profile",
  "auth.signup.email": "Email",
  "auth.signup.emailNext": "Send verification code",
  "auth.signup.emailSending": "Sending code…",
  "auth.signup.code": "Verification code (6 digits)",
  "auth.signup.codeVerify": "Verify code",
  "auth.signup.codeResend": "Resend code",
  "auth.signup.codeResendIn": "Resend in {n}s",
  "auth.signup.password": "Password",
  "auth.signup.passwordHint": "At least 8 characters",
  "auth.signup.passwordConfirm": "Confirm password",
  "auth.signup.passwordMismatch": "Passwords don't match.",
  "auth.signup.displayName": "Display name",
  "auth.signup.displayNamePlaceholder": "How others will see you",
  "auth.signup.terms": "I agree to the Terms of Service and Privacy Policy.",
  "auth.signup.submit": "Create account",
  "auth.signup.country": "Country",
  "auth.signup.countryPlaceholder": "Select a country",
  "auth.signup.region": "Region (state/province)",
  "auth.signup.regionPlaceholder": "Select a region",
  "ui.select.search": "Search...",
  "ui.select.empty": "No results",
  "auth.signup.error.countryRequired": "Please select your country.",
  "auth.signup.error.regionRequired": "This country requires a region (state/province).",
  "auth.onboarding.title": "Almost there",
  "auth.onboarding.subtitle": "Enter your country to set your timezone",
  "auth.onboarding.lead": "Pick your country (and region if asked) so periods are calculated accurately.",
  "auth.onboarding.submit": "Complete sign-up",
  "auth.onboarding.backToLogin": "Back to login",
  "auth.onboarding.error.expired": "Your session expired. Please try GitHub/Google again.",
  "auth.signup.submitting": "Creating account…",
  "auth.signup.haveAccount": "Already have an account?",
  "auth.signup.loginLink": "Sign in",
  "auth.signup.back": "Back",
  "auth.signup.error.alreadyRegistered": "This email is already registered.",
  "auth.signup.error.invalidCode": "Invalid code.",
  "auth.signup.error.expired": "Code expired. Please resend.",
  "auth.signup.error.cooldown": "Please wait a moment and try again.",
  "auth.signup.error.notVerified": "Please verify your email first.",

  "auth.forgot.title": "Reset password",
  "auth.forgot.subtitle": "We'll send a verification code to your email",
  "auth.forgot.emailSubmit": "Send reset code",
  "auth.forgot.codeSubmit": "Verify code",
  "auth.forgot.newPasswordSubmit": "Change password",
  "auth.forgot.success": "Password changed. Please sign in again.",
  "auth.forgot.error.userNotFound": "This email isn't registered.",
  "auth.forgot.linkSent":
    "If that email is registered, we've sent a password reset link. Please check your inbox.",
  "auth.forgot.backToLogin": "Back to sign in",
  "auth.reset.title": "Set a new password",
  "auth.reset.subtitle": "Enter the password you'd like to use.",
  "auth.reset.newPassword": "New password",
  "auth.reset.submit": "Change password",
  "auth.reset.success":
    "Your password has been changed. Please sign in with your new password.",
  "auth.reset.goLogin": "Go to sign in",
  "auth.reset.requestAgain": "Request a new reset link",
  "auth.reset.error.tokenInvalid":
    "Invalid link. Please request a password reset again.",
  "auth.reset.error.tokenExpired":
    "This link has expired. Please request a password reset again.",
  "auth.reset.error.notAllowed":
    "Password reset is not available for this account.",

  "auth.oauth.github": "Continue with GitHub",
  "auth.oauth.google": "Continue with Google",
  "auth.oauth.processing": "Processing…",

  "auth.header.logout": "Sign out",

  "onboarding.accountType.title": "How will you use ARCHIVE?",
  "onboarding.accountType.subtitle": "We'll tailor the experience to your workflow. You can change this anytime in Settings.",
  "onboarding.accountType.developer": "Developer",
  "onboarding.accountType.developerDesc": "Includes GitHub commit history, retrospective sync, and developer-focused features.",
  "onboarding.accountType.user": "Regular User",
  "onboarding.accountType.userDesc": "A focused experience centered on calendar, to-dos, and retrospectives.",
  "onboarding.accountType.continue": "Get started",
  "onboarding.accountType.skip": "Skip (start as Regular User)",

  "settings.accountType.title": "Account Type",
  "settings.accountType.hint": "Developer accounts include GitHub integration and commit history.",
  "settings.accountType.developer": "Developer",
  "settings.accountType.user": "Regular User",
};

const zh: Dict = {
  "nav.calendar": "日历",
  "nav.todos": "待办",
  "nav.retrospectives": "回顾",
  "nav.settings": "设置",
  "nav.brand": "A.R.C.H.I.V.E",

  "subheader.calendar.eyebrow": "计划画布",
  "subheader.calendar.title": "今日日历",
  "subheader.calendar.subtitle":
    "在一个视图中查看日程和任务。拖动卡片可以将其移至其他日期。",
  "subheader.todos.eyebrow": "快速记录",
  "subheader.todos.title": "编辑看板",
  "subheader.todos.subtitle":
    "输入即可加入看板。在「未开始 / 进行中 / 完成」三列中梳理流程。",
  "subheader.retrospectives.eyebrow": "写作账本",
  "subheader.retrospectives.title": "回顾",
  "subheader.retrospectives.subtitle":
    "把完成的任务和今天的提交串联起来,并自动同步到 GitHub 仓库。",
  "subheader.settings.eyebrow": "集成与模板",
  "subheader.settings.title": "设置",
  "subheader.settings.subtitle": "调整 GitHub 连接范围和自动回顾摘要。",

  "sync.connected": "GitHub 已连接",
  "sync.disconnected": "未连接",
  "sync.offline": "离线",
  "sync.synced": "已连接 · {n}",
  "sync.status": "连接状态",
  "sync.connectInSettings": "请在设置中连接",
  "sync.ago.m": "{n}分钟前连接",
  "sync.ago.h": "{n}小时前连接",
  "sync.ago.d": "{n}天前连接",
  "sync.ago.M": "{n}个月前连接",
  "sync.ago.Y": "{n}年前连接",

  "todo.quickCapture.placeholder": "写下任务 — 例如:今天内完成报告",
  "todo.quickCapture.hint":
    "输入后立即加入看板。未指定日期则默认设为今天。",
  "todo.quickCapture.enter": "回车",
  "todo.col.notStart.label": "Not Started",
  "todo.col.notStart.ko": "未开始",
  "todo.col.inProgress.label": "In Progress",
  "todo.col.inProgress.ko": "进行中",
  "todo.col.done.label": "Done",
  "todo.col.done.ko": "已完成",
  "todo.col.empty": "此列暂无卡片。",
  "todo.card.nextStep": "下一步",
  "todo.card.advance": "变更状态",
  "todo.card.changeDate": "修改日期",
  "todo.filter.all": "全部",
  "todo.filter.today": "今天",
  "todo.filter.thisWeek": "本周",
  "todo.filter.pickDate": "选择日期",
  "todo.filter.clear": "清除筛选",
  "todo.notif.added.title": "已添加任务",
  "demo.locked.title": "需要登录",
  "demo.locked.message": "GitHub 连接与同步需登录后使用。",
  "demo.locked.action": "登录",
  "todo.quick.today": "今天",
  "todo.quick.tomorrow": "明天",
  "todo.quick.weekend": "本周末",
  "todo.picker.quickDate": "快速日期",
  "todo.picker.calendar": "日历",
  "todo.picker.prev": "上一月",
  "todo.picker.next": "下一月",

  "calendar.view.day": "日",
  "calendar.view.week": "周",
  "calendar.view.month": "月",
  "calendar.timeline.untimed": "未设时间",
  "calendar.timeline.auto": "自动",
  "calendar.legend.notStart": "未开始",
  "calendar.legend.inProgress": "进行中",
  "calendar.legend.done": "已完成",
  "calendar.today": "TODAY",
  "calendar.taskDetail.title": "任务详情",
  "calendar.taskDetail.close": "关闭",
  "calendar.empty.day": "—",
  "calendar.dropHint": "放至此处",
  "calendar.nav.prev": "← 上一",
  "calendar.nav.today": "今天",
  "calendar.nav.next": "下一 →",
  "calendar.addCard": "新卡片",
  "calendar.addCard.placeholder": "输入任务后按 Enter",
  "calendar.moreItems": "+{n} 条",
  "calendar.days.sun": "日",
  "calendar.days.mon": "一",
  "calendar.days.tue": "二",
  "calendar.days.wed": "三",
  "calendar.days.thu": "四",
  "calendar.days.fri": "五",
  "calendar.days.sat": "六",
  "calendar.days.sunday": "星期日",
  "calendar.days.monday": "星期一",
  "calendar.days.tuesday": "星期二",
  "calendar.days.wednesday": "星期三",
  "calendar.days.thursday": "星期四",
  "calendar.days.friday": "星期五",
  "calendar.days.saturday": "星期六",
  "calendar.taskDetail.status": "状态",
  "calendar.taskDetail.titleField": "标题",
  "calendar.taskDetail.date": "日期",
  "calendar.taskDetail.description": "说明",
  "calendar.taskDetail.descPlaceholder": "记录背景信息或参考链接。",
  "calendar.taskDetail.aiRetro": "AI 自动回顾",
  "calendar.taskDetail.aiRetroDesc": "将此任务纳入回顾流程，每周日自动生成周摘要。",
  "calendar.taskDetail.goToRetro": "前往回顾编辑器",
  "calendar.taskDetail.time": "时间段",
  "calendar.taskDetail.startTime": "开始",
  "calendar.taskDetail.endTime": "结束",
  "calendar.taskDetail.timeHint": "可选 — 留空时，日视图将按创建时间显示为 1 小时区块。",
  "calendar.taskDetail.clearTime": "清除时间",

  "retro.history": "历史",
  "retro.archive": "回顾归档",
  "retro.archiveDescription": "每日 · 每周 · 每月 · 每年的记录汇聚于此。",
  "retro.filter.daily": "每日",
  "retro.filter.weekly": "每周",
  "retro.filter.monthly": "每月",
  "retro.filter.yearly": "每年",
  "retro.search": "搜索...",
  "retro.empty": "此类别下暂无回顾。",
  "retro.editor.titlePlaceholder": "请输入标题",
  "retro.editor.sub": "把今天的任务、提交和心得串联到一条主线里。",
  "retro.editor.completed": "已完成的工作",
  "retro.editor.noCompleted": "今天没有已完成的任务。",
  "retro.editor.commits": "今天的提交",
  "retro.editor.commitsPast": "当天的提交",
  "retro.editor.noCommitsPast": "当天没有提交",
  "retro.editor.learned": "学到的与改进点",
  "retro.editor.learnedPlaceholder":
    "随意记录今天学到的事情和下次想做得更好的部分。",
  "retro.editor.save": "Push 到 GitHub",
  "retro.editor.pushing": "Push 中...",
  "retro.editor.pushSuccess": "已 Push 到 GitHub",
  "retro.editor.pushFailed": "Push 失败，请重试",
  "retro.editor.noCommits": "今天没有提交",
  "retro.editor.loadCommits": "加载提交",
  "retro.editor.synced": "已同步到 GitHub",
  "retro.editor.pending": "等待同步",
  "retro.summarize.weekly": "周摘要",
  "retro.summarize.monthly": "月摘要",
  "retro.summarize.yearly": "年摘要",
  "retro.readiness.title": "数据不足",
  "retro.readiness.monthlyMessage":
    "本月仅有 {covered}/{expected} 天写了回顾。\n数据不足可能导致摘要质量较低。",
  "retro.readiness.annualMessage":
    "{year}年仅有 {covered}/12 个月有回顾。\n数据不足可能导致摘要质量较低。",
  "retro.readiness.writeMore": "继续写",
  "retro.readiness.generate": "仍然生成",
  "retro.period.weeklyTitle": "选择要摘要的周",
  "retro.period.monthlyTitle": "选择要摘要的月",
  "retro.period.yearlyTitle": "选择要摘要的年",
  "retro.period.description": "AI 将摘要所选时间段的回顾。",
  "retro.period.confirm": "生成摘要",
  "retro.period.cancel": "取消",
  "retro.period.weekLabel": "{year}年 第{week}周",
  "retro.period.currentBadge": "进行中",
  "retro.overwrite.title": "已存在摘要回顾",
  "retro.overwrite.message":
    "该时间段已存在 AI 摘要回顾。\n是否重新生成并覆盖现有内容？",
  "retro.overwrite.confirm": "重新摘要并覆盖",
  "retro.overwrite.cancel": "取消",
  "retro.pager.prev": "上一页",
  "retro.pager.next": "下一页",
  "retro.pager.page": "{current} / {total}",
  "retro.filter.year": "年",
  "retro.filter.month": "月",
  "retro.filter.week": "周",
  "retro.filter.allYears": "全部年份",
  "retro.filter.allMonths": "全部月份",
  "retro.filter.allWeeks": "全部周",
  "retro.badge.today": "Today",
  "retro.badge.draft": "草稿",
  "retro.badge.synced": "已同步",
  "retro.github.notConnected": "GitHub 未连接 — 提交与同步已停用",
  "retro.github.connectFromSettings": "请在设置中连接 GitHub 账户。",
  "retro.github.noCommitsEmailHint":
    "当天没有找到提交记录。请确认您的 git config user.email 已在 GitHub 账户中注册。",
  "retro.github.noCommitsReconnect":
    "需要重新连接 GitHub。重新连接后可更准确地显示本地提交记录。",
  "retro.github.emailsSettingsLink": "GitHub Settings → Emails",
  "retro.newDaily": "写今日每日回顾",
  "retro.newDaily.duplicate": "今天的回顾已经存在",
  "retro.newDaily.created": "今天的每日回顾已创建",
  "retro.editor.autoSaved": "更改将自动保存",

  "summary.processing.title": "AI 摘要处理中",
  "summary.processing.message": "正在分析回顾内容,请稍候。",
  "summary.minimize": "最小化",
  "summary.completed.title": "AI 摘要完成",
  "summary.completed.message": "{kind} 摘要已保存到回顾。",
  "summary.kind.weekly": "周",
  "summary.kind.monthly": "月",
  "summary.kind.yearly": "年",

  "notif.panel.title": "通知",
  "notif.panel.subtitle": "最近 30 天的活动",
  "notif.panel.empty": "暂无通知。",
  "notif.panel.unread": "{n} 条新通知",
  "notif.panel.markAllRead": "全部标为已读",
  "notif.panel.clearRead": "清除已读",
  "notif.panel.clearAll": "全部清除",
  "notif.panel.close": "关闭",
  "notif.panel.retention": "超过 {n} 天的通知会自动删除。",

  "search.placeholder": "搜索任务和回顾...",
  "search.empty": "无匹配结果。",
  "search.section.todos": "任务",
  "search.section.entries": "回顾",
  "search.close": "关闭搜索",

  "settings.section.github": "GitHub",
  "settings.section.language": "语言",
  "settings.section.autoSummary": "自动回顾摘要",
  "settings.section.notifications": "通知",
  "settings.github.connected": "已连接",
  "settings.github.notConnected": "未连接",
  "settings.github.connect": "连接",
  "settings.github.disconnect": "断开连接",
  "settings.github.connectedAs": "账号",
  "settings.github.targetRepo": "目标仓库",
  "settings.github.permissions": "权限",
  "settings.github.tracked": "跟踪的仓库",
  "settings.github.lastSync": "最后同步",
  "settings.github.autoRetrospective": "自动回顾同步",
  "settings.github.checking": "正在检查连接状态…",
  "settings.github.noLinked": "没有已连接的仓库",
  "settings.github.addRepo": "添加仓库",
  "settings.github.syncAll": "全部同步",
  "settings.github.unlinkAll": "全部断开",
  "settings.github.available": "可连接的仓库",
  "settings.github.noAvailable": "没有可连接的仓库",
  "settings.github.link": "连接",
  "settings.github.unlink": "断开",
  "settings.github.connectAccount": "连接 GitHub 账户",
  "settings.github.connectAccountPending":
    "GitHub 账户连接功能即将推出。使用 GitHub 登录即可连接仓库。",
  "settings.github.connectAccountHint":
    "连接 GitHub 账户后即可连接仓库并使用提交与回顾 push 功能。",
  "settings.github.connecting": "连接中…",
  "settings.github.connectFailed": "GitHub 连接失败，请重试。",
  "settings.github.alreadyLinked": "该 GitHub 账户已关联到其他用户，或已连接。",
  "settings.section.security": "安全",
  "settings.group.security.hint": "管理已登录的设备和会话。",
  "settings.sessions.title": "活动会话",
  "settings.sessions.loading": "正在加载会话…",
  "settings.sessions.empty": "没有活动会话。",
  "settings.sessions.thisDevice": "本设备",
  "settings.sessions.signOut": "退出登录",
  "settings.sessions.revokeOthers": "退出所有其他设备",
  "settings.sessions.unknownDevice": "未知设备",
  "settings.sessions.revoked": "会话已结束",
  "settings.sessions.revokedOthersTitle": "已退出其他设备",
  "settings.sessions.revokedOthersBody": "已从 {count} 台设备退出登录。",
  "security.reuse.title": "安全提醒",
  "security.reuse.message":
    "检测到来自其他位置的登录尝试，所有会话已自动结束。如非本人操作，请修改密码。",
  "security.reuse.action": "重新登录",
  "settings.github.connectedAsLogin": "已连接 @{login}",
  "settings.github.commitRead": "读取提交",
  "settings.github.commitReadOn": "包含",
  "settings.github.commitReadOff": "排除",
  "settings.github.pushTarget": "Push 目标仓库",
  "settings.github.pushTargetNone": "不选择",
  "settings.github.pushTargetHint": "将向此仓库 push 回顾 Markdown。",
  "settings.github.reconnectBanner": "需要更新 GitHub 连接",
  "settings.github.reconnectBannerMsg":
    "需要更新权限，以便准确显示通过 git bash 等本地工具提交的记录。",
  "settings.github.reconnect": "重新连接 GitHub",
  "settings.section.region": "地区与时区",
  "settings.region.title": "国家 / 时区",
  "settings.region.apply": "应用国家变更",
  "settings.region.applying": "应用中…",
  "settings.region.updated": "国家已更新",
  "settings.region.modalTitle": "同时更改摘要时间吗？",
  "settings.region.modalMessage":
    "更改国家后，可将 AI 自动摘要时区（当地凌晨 1 点）更新为新国家。也可以保留当前时区。",
  "settings.region.modalMessageWithTz":
    "切换至{country}将把时区设置为{timezone}。是否同时更新 AI 摘要时间（当地凌晨 1 点）？",
  "settings.region.modalUseNew": "使用新国家时区",
  "settings.region.modalKeep": "保留当前时区",
  "settings.region.selectRegionHint": "请先选择地区以启用应用按钮。",
  "settings.region.selectTimezone": "选择时区",
  "settings.region.selectTimezoneHint": "该国家有多个时区，请选择一个。",
  "settings.region.loadingTz": "正在加载时区…",
  "settings.region.autoTz": "自动时区：{timezone}",
  "settings.timezone.label": "时区（摘要执行基准）",
  "settings.timezone.hint": "AI 自动摘要将在该时区的凌晨 1 点执行。",
  "settings.timezone.updated": "时区已更新",
  "settings.language.label": "语言",
  "settings.language.rowHint": "界面显示语言",
  "settings.region.countryHint": "用于日期和摘要的地区",
  "settings.autoSummary.weekly": "周自动摘要",
  "settings.autoSummary.monthly": "月自动摘要",
  "settings.autoSummary.yearly": "年自动摘要",
  "settings.autoSummary.description":
    "启用后,AI 会在对应周期结束的午夜自动生成摘要。",
  "settings.notifications.retention.label": "通知保留时长",
  "settings.notifications.retention.unit": "天",
  "settings.notifications.retention.hint": "自动删除旧通知。",
  "settings.section.templates": "回顾模板",
  "settings.templates.title": "Retro Templates",
  "settings.templates.description":
    "编辑创建新回顾时自动应用的初始结构。使用 / 插入块。",
  "settings.templates.default": "默认",
  "settings.templates.add": "新建模板",
  "settings.templates.selectHint": "请从左侧列表中选择模板。",
  "settings.templates.namePlaceholder": "模板名称",
  "settings.templates.contentPlaceholder":
    "填写将预先填入新回顾中的内容。使用 / 插入块。",
  "settings.templates.reset": "恢复默认值",
  "settings.templates.use": "使用",
  "settings.templates.inUse": "使用中",
  "settings.templates.activeHint": "创建新回顾时会自动应用「使用中」的模板。",
  "settings.templates.newName": "新建{type}模板",
  "settings.templates.defaultName.daily": "默认日间模板",
  "settings.templates.defaultName.weekly": "默认周间模板",
  "settings.templates.defaultName.monthly": "默认月间模板",
  "settings.templates.defaultName.yearly": "默认年度模板",
  "settings.section.integrations": "集成",
  "settings.section.preferences": "偏好设置",
  "settings.group.integrations.hint": "管理与外部服务的连接。",
  "settings.group.preferences.hint": "调整语言、自动摘要和通知行为。",
  "settings.group.templates.hint": "定义每种回顾类型的默认结构，并选择要使用的模板。",

  "common.cancel": "取消",
  "common.confirm": "确认",
  "common.save": "保存",
  "common.delete": "删除",
  "common.close": "关闭",
  "common.on": "开",
  "common.off": "关",

  "auth.divider.or": "或",
  "auth.error.network": "请检查您的网络连接。",
  "auth.error.unknown": "发生未知错误。",
  "auth.password.show": "显示密码",
  "auth.password.hide": "隐藏密码",
  "auth.consoleHint": "不会发送真实邮件。请在浏览器开发者工具的控制台中查看验证码。",

  "auth.login.title": "欢迎回来",
  "auth.login.subtitle": "登录您的 ARCHIVE 账户",
  "auth.login.email": "邮箱",
  "auth.login.password": "密码",
  "auth.login.rememberMe": "保持登录状态",
  "auth.login.forgotPassword": "忘记密码？",
  "auth.login.submit": "登录",
  "auth.login.submitting": "正在登录…",
  "auth.login.noAccount": "还没有账户？",
  "auth.login.signupLink": "注册",
  "auth.login.error.invalidCredentials": "邮箱或密码不正确。",
  "auth.login.error.userNotFound": "该邮箱未注册。",

  "auth.signup.title": "开始使用 ARCHIVE",
  "auth.signup.subtitle": "验证邮箱后创建账户",
  "auth.signup.step1": "邮箱",
  "auth.signup.step2": "验证",
  "auth.signup.step3": "资料",
  "auth.signup.email": "邮箱",
  "auth.signup.emailNext": "发送验证码",
  "auth.signup.emailSending": "正在发送…",
  "auth.signup.code": "验证码（6位）",
  "auth.signup.codeVerify": "验证码",
  "auth.signup.codeResend": "重新发送",
  "auth.signup.codeResendIn": "{n} 秒后可重新发送",
  "auth.signup.password": "密码",
  "auth.signup.passwordHint": "至少 8 位字符",
  "auth.signup.passwordConfirm": "确认密码",
  "auth.signup.passwordMismatch": "两次密码不一致。",
  "auth.signup.displayName": "昵称",
  "auth.signup.displayNamePlaceholder": "其他用户看到的名称",
  "auth.signup.terms": "我同意服务条款和隐私政策。",
  "auth.signup.submit": "完成注册",
  "auth.signup.country": "国家",
  "auth.signup.countryPlaceholder": "选择国家",
  "auth.signup.region": "地区（州/省）",
  "auth.signup.regionPlaceholder": "选择地区",
  "ui.select.search": "搜索...",
  "ui.select.empty": "无结果",
  "auth.signup.error.countryRequired": "请选择国家。",
  "auth.signup.error.regionRequired": "该国家需要选择地区（州/省）。",
  "auth.onboarding.title": "就快完成了",
  "auth.onboarding.subtitle": "请填写国家信息以设置时区",
  "auth.onboarding.lead": "为了准确计算周期，请选择您所在的国家（如需要请选择地区）。",
  "auth.onboarding.submit": "完成注册",
  "auth.onboarding.backToLogin": "返回登录",
  "auth.onboarding.error.expired": "会话已过期。请重新使用 GitHub/Google 登录。",
  "auth.signup.submitting": "注册中…",
  "auth.signup.haveAccount": "已有账户？",
  "auth.signup.loginLink": "登录",
  "auth.signup.back": "返回",
  "auth.signup.error.alreadyRegistered": "该邮箱已注册。",
  "auth.signup.error.invalidCode": "验证码无效。",
  "auth.signup.error.expired": "验证码已过期，请重新发送。",
  "auth.signup.error.cooldown": "请稍后重试。",
  "auth.signup.error.notVerified": "请先验证邮箱。",

  "auth.forgot.title": "重置密码",
  "auth.forgot.subtitle": "我们将向您的邮箱发送验证码",
  "auth.forgot.emailSubmit": "发送重置码",
  "auth.forgot.codeSubmit": "验证码",
  "auth.forgot.newPasswordSubmit": "更改密码",
  "auth.forgot.success": "密码已修改，请重新登录。",
  "auth.forgot.error.userNotFound": "该邮箱未注册。",
  "auth.forgot.linkSent":
    "如果该邮箱已注册，我们已发送密码重置链接，请查收邮件。",
  "auth.forgot.backToLogin": "返回登录",
  "auth.reset.title": "设置新密码",
  "auth.reset.subtitle": "请输入要使用的新密码。",
  "auth.reset.newPassword": "新密码",
  "auth.reset.submit": "更改密码",
  "auth.reset.success": "密码已更改，请使用新密码重新登录。",
  "auth.reset.goLogin": "前往登录",
  "auth.reset.requestAgain": "重新获取重置链接",
  "auth.reset.error.tokenInvalid": "链接无效，请重新申请密码重置。",
  "auth.reset.error.tokenExpired": "链接已过期，请重新申请密码重置。",
  "auth.reset.error.notAllowed": "此账户无法重置密码。",

  "auth.oauth.github": "使用 GitHub 继续",
  "auth.oauth.google": "使用 Google 继续",
  "auth.oauth.processing": "处理中…",

  "auth.header.logout": "退出登录",

  "onboarding.accountType.title": "您打算如何使用 ARCHIVE？",
  "onboarding.accountType.subtitle": "我们将根据您的工作方式定制体验。您可以随时在设置中更改。",
  "onboarding.accountType.developer": "开发者",
  "onboarding.accountType.developerDesc": "包含 GitHub 提交记录、回顾同步等开发者专属功能。",
  "onboarding.accountType.user": "普通用户",
  "onboarding.accountType.userDesc": "以日历、待办事项和回顾为中心的基础体验。",
  "onboarding.accountType.continue": "开始使用",
  "onboarding.accountType.skip": "跳过（以普通用户身份开始）",

  "settings.accountType.title": "账户类型",
  "settings.accountType.hint": "开发者账户包含 GitHub 集成和提交记录功能。",
  "settings.accountType.developer": "开发者",
  "settings.accountType.user": "普通用户",
};

const ja: Dict = {
  "nav.calendar": "カレンダー",
  "nav.todos": "ToDo",
  "nav.retrospectives": "振り返り",
  "nav.settings": "設定",
  "nav.brand": "A.R.C.H.I.V.E",

  "subheader.calendar.eyebrow": "プランニング・キャンバス",
  "subheader.calendar.title": "今日のカレンダー",
  "subheader.calendar.subtitle":
    "スケジュールとタスクを一画面で。カードをドラッグして別の日付に移動できます。",
  "subheader.todos.eyebrow": "クイック入力",
  "subheader.todos.title": "エディトリアル・カンバン",
  "subheader.todos.subtitle":
    "入力した瞬間にカンバンへ。未着手・進行中・完了の三段階で流れを整理します。",
  "subheader.retrospectives.eyebrow": "ライティング・台帳",
  "subheader.retrospectives.title": "振り返り",
  "subheader.retrospectives.subtitle":
    "完了したタスクと今日のコミットを一つの流れにまとめ、GitHub に自動同期します。",
  "subheader.settings.eyebrow": "連携とテンプレート",
  "subheader.settings.title": "設定",
  "subheader.settings.subtitle":
    "GitHub 連携範囲と自動振り返りサマリーを調整します。",

  "sync.connected": "GitHub 接続済み",
  "sync.disconnected": "未接続",
  "sync.offline": "オフライン",
  "sync.synced": "接続済 · {n}",
  "sync.status": "接続ステータス",
  "sync.connectInSettings": "設定から接続してください",
  "sync.ago.m": "{n}分前に接続",
  "sync.ago.h": "{n}時間前に接続",
  "sync.ago.d": "{n}日前に接続",
  "sync.ago.M": "{n}ヶ月前に接続",
  "sync.ago.Y": "{n}年前に接続",

  "todo.quickCapture.placeholder": "タスクを書く — 例:今日中にレポートを作成",
  "todo.quickCapture.hint":
    "入力すると即カンバンに入ります。日付なしなら今日に登録されます。",
  "todo.quickCapture.enter": "Enter",
  "todo.col.notStart.label": "Not Started",
  "todo.col.notStart.ko": "未着手",
  "todo.col.inProgress.label": "In Progress",
  "todo.col.inProgress.ko": "進行中",
  "todo.col.done.label": "Done",
  "todo.col.done.ko": "完了",
  "todo.col.empty": "この列にはまだカードがありません。",
  "todo.card.nextStep": "次のステップ",
  "todo.card.advance": "状態を変更",
  "todo.card.changeDate": "日付を変更",
  "todo.filter.all": "すべて",
  "todo.filter.today": "今日",
  "todo.filter.thisWeek": "今週",
  "todo.filter.pickDate": "日付選択",
  "todo.filter.clear": "フィルタ解除",
  "todo.notif.added.title": "タスクを追加",
  "demo.locked.title": "ログインが必要です",
  "demo.locked.message": "GitHub連携・同期はログイン後に利用できます。",
  "demo.locked.action": "ログイン",
  "todo.quick.today": "今日",
  "todo.quick.tomorrow": "明日",
  "todo.quick.weekend": "今週末",
  "todo.picker.quickDate": "クイック日付",
  "todo.picker.calendar": "カレンダー",
  "todo.picker.prev": "前の月",
  "todo.picker.next": "次の月",

  "calendar.view.day": "日",
  "calendar.view.week": "週",
  "calendar.view.month": "月",
  "calendar.timeline.untimed": "時間未設定",
  "calendar.timeline.auto": "自動",
  "calendar.legend.notStart": "未着手",
  "calendar.legend.inProgress": "進行中",
  "calendar.legend.done": "完了",
  "calendar.today": "TODAY",
  "calendar.taskDetail.title": "タスク詳細",
  "calendar.taskDetail.close": "閉じる",
  "calendar.empty.day": "—",
  "calendar.dropHint": "ここにドロップ",
  "calendar.nav.prev": "← 前へ",
  "calendar.nav.today": "今日へ",
  "calendar.nav.next": "次へ →",
  "calendar.addCard": "新しいカード",
  "calendar.addCard.placeholder": "タスクを入力して Enter",
  "calendar.moreItems": "+{n} 件以上",
  "calendar.days.sun": "日",
  "calendar.days.mon": "月",
  "calendar.days.tue": "火",
  "calendar.days.wed": "水",
  "calendar.days.thu": "木",
  "calendar.days.fri": "金",
  "calendar.days.sat": "土",
  "calendar.days.sunday": "日曜日",
  "calendar.days.monday": "月曜日",
  "calendar.days.tuesday": "火曜日",
  "calendar.days.wednesday": "水曜日",
  "calendar.days.thursday": "木曜日",
  "calendar.days.friday": "金曜日",
  "calendar.days.saturday": "土曜日",
  "calendar.taskDetail.status": "ステータス",
  "calendar.taskDetail.titleField": "タイトル",
  "calendar.taskDetail.date": "日付",
  "calendar.taskDetail.description": "説明",
  "calendar.taskDetail.descPlaceholder": "背景や参考リンクを記録してください。",
  "calendar.taskDetail.aiRetro": "AI 自動振り返り",
  "calendar.taskDetail.aiRetroDesc": "このタスクを振り返りに紐付けると、毎週日曜日に自動で週次サマリーが生成されます。",
  "calendar.taskDetail.goToRetro": "振り返りエディターへ",
  "calendar.taskDetail.time": "時間帯",
  "calendar.taskDetail.startTime": "開始",
  "calendar.taskDetail.endTime": "終了",
  "calendar.taskDetail.timeHint": "任意 — 空欄の場合、日ビューでは作成時刻を基準に1時間のブロックとして表示されます。",
  "calendar.taskDetail.clearTime": "時間をクリア",

  "retro.history": "履歴",
  "retro.archive": "振り返りアーカイブ",
  "retro.archiveDescription": "毎日・毎週・毎月・毎年の流れが一箇所に。",
  "retro.filter.daily": "毎日",
  "retro.filter.weekly": "毎週",
  "retro.filter.monthly": "毎月",
  "retro.filter.yearly": "毎年",
  "retro.search": "検索...",
  "retro.empty": "該当の振り返りはありません。",
  "retro.editor.titlePlaceholder": "タイトルを書く",
  "retro.editor.sub":
    "今日のタスクとコミット、学んだことを一本にまとめましょう。",
  "retro.editor.completed": "完了した作業",
  "retro.editor.noCompleted": "今日完了したタスクはありません。",
  "retro.editor.commits": "今日のコミット",
  "retro.editor.commitsPast": "この日のコミット",
  "retro.editor.noCommitsPast": "この日のコミットはありません",
  "retro.editor.learned": "学びと改善点",
  "retro.editor.learnedPlaceholder":
    "今日気付いたこと、次に改善したいことを自由に。",
  "retro.editor.save": "GitHub に Push",
  "retro.editor.pushing": "Push 中...",
  "retro.editor.pushSuccess": "GitHub に Push 完了",
  "retro.editor.pushFailed": "Push 失敗、再試行してください",
  "retro.editor.noCommits": "今日のコミットはありません",
  "retro.editor.loadCommits": "コミットを読み込む",
  "retro.editor.synced": "GitHub に同期",
  "retro.editor.pending": "同期待ち",
  "retro.summarize.weekly": "週次サマリー",
  "retro.summarize.monthly": "月次サマリー",
  "retro.summarize.yearly": "年次サマリー",
  "retro.readiness.title": "データが不足しています",
  "retro.readiness.monthlyMessage":
    "今月の振り返りは {covered}/{expected} 日です。\nデータ不足によりサマリーの品質が低下する可能性があります。",
  "retro.readiness.annualMessage":
    "{year}年に振り返りがある月は {covered}/12 です。\nデータ不足によりサマリーの品質が低下する可能性があります。",
  "retro.readiness.writeMore": "もっと書く",
  "retro.readiness.generate": "このまま生成",
  "retro.period.weeklyTitle": "要約する週を選択してください",
  "retro.period.monthlyTitle": "要約する月を選択してください",
  "retro.period.yearlyTitle": "要約する年を選択してください",
  "retro.period.description": "選択した期間の振り返りを AI が要約します。",
  "retro.period.confirm": "要約を生成",
  "retro.period.cancel": "キャンセル",
  "retro.period.weekLabel": "{year}年 第{week}週",
  "retro.period.currentBadge": "進行中",
  "retro.overwrite.title": "すでに要約された振り返りがあります",
  "retro.overwrite.message":
    "この期間にはすでに AI 要約の振り返りがあります。\n再要約して既存の内容を上書きしますか？",
  "retro.overwrite.confirm": "再要約・上書き",
  "retro.overwrite.cancel": "キャンセル",
  "retro.pager.prev": "前へ",
  "retro.pager.next": "次へ",
  "retro.pager.page": "{current} / {total}",
  "retro.filter.year": "年",
  "retro.filter.month": "月",
  "retro.filter.week": "週",
  "retro.filter.allYears": "全ての年",
  "retro.filter.allMonths": "全ての月",
  "retro.filter.allWeeks": "全ての週",
  "retro.badge.today": "Today",
  "retro.badge.draft": "下書き",
  "retro.badge.synced": "同期済",
  "retro.github.notConnected": "GitHub 未接続 — コミットと同期は無効です",
  "retro.github.connectFromSettings":
    "設定から GitHub アカウントを接続してください。",
  "retro.github.noCommitsEmailHint":
    "この日のコミットが見つかりません。git config user.email が GitHub アカウントに登録されているか確認してください。",
  "retro.github.noCommitsReconnect":
    "GitHub の再接続が必要です。再接続するとローカルのコミットがより正確に表示されます。",
  "retro.github.emailsSettingsLink": "GitHub Settings → Emails",
  "retro.newDaily": "今日の日次振り返りを書く",
  "retro.newDaily.duplicate": "今日の振り返りはすでに存在します",
  "retro.newDaily.created": "今日の日次振り返りが作成されました",
  "retro.editor.autoSaved": "変更は自動的に保存されます",

  "summary.processing.title": "AI サマリー処理中",
  "summary.processing.message": "振り返り内容を分析しています。少々お待ちを。",
  "summary.minimize": "最小化",
  "summary.completed.title": "AI サマリー完了",
  "summary.completed.message": "{kind} サマリーが振り返りに保存されました。",
  "summary.kind.weekly": "週次",
  "summary.kind.monthly": "月次",
  "summary.kind.yearly": "年次",

  "notif.panel.title": "通知",
  "notif.panel.subtitle": "過去 30 日のアクティビティ",
  "notif.panel.empty": "通知はありません。",
  "notif.panel.unread": "{n} 件の新着",
  "notif.panel.markAllRead": "全て既読",
  "notif.panel.clearRead": "既読を削除",
  "notif.panel.clearAll": "全て削除",
  "notif.panel.close": "閉じる",
  "notif.panel.retention": "{n} 日経過した通知は自動削除されます。",

  "search.placeholder": "タスクや振り返りを検索...",
  "search.empty": "該当する結果はありません。",
  "search.section.todos": "タスク",
  "search.section.entries": "振り返り",
  "search.close": "検索を閉じる",

  "settings.section.github": "GitHub",
  "settings.section.language": "言語",
  "settings.section.autoSummary": "自動振り返りサマリー",
  "settings.section.notifications": "通知",
  "settings.github.connected": "接続済み",
  "settings.github.notConnected": "未接続",
  "settings.github.connect": "接続",
  "settings.github.disconnect": "切断",
  "settings.github.connectedAs": "アカウント",
  "settings.github.targetRepo": "対象リポジトリ",
  "settings.github.permissions": "権限",
  "settings.github.tracked": "追跡中のリポジトリ",
  "settings.github.lastSync": "最終同期",
  "settings.github.autoRetrospective": "自動振り返り同期",
  "settings.github.checking": "接続状態を確認中…",
  "settings.github.noLinked": "連携されたリポジトリがありません",
  "settings.github.addRepo": "リポジトリを追加",
  "settings.github.syncAll": "一括同期",
  "settings.github.unlinkAll": "すべて解除",
  "settings.github.available": "連携可能なリポジトリ",
  "settings.github.noAvailable": "連携可能なリポジトリがありません",
  "settings.github.link": "連携",
  "settings.github.unlink": "解除",
  "settings.github.connectAccount": "GitHubアカウントを連携",
  "settings.github.connectAccountPending":
    "GitHubアカウント連携機能は近日提供予定です。GitHubでログインするとリポジトリを連携できます。",
  "settings.github.connectAccountHint":
    "GitHubアカウントを連携すると、リポジトリ連携やコミット・振り返りの push が使えます。",
  "settings.github.connecting": "接続中…",
  "settings.github.connectFailed": "GitHub 連携に失敗しました。再試行してください。",
  "settings.github.alreadyLinked": "この GitHub アカウントは既に他のユーザーに連携済み、または既に接続されています。",
  "settings.section.security": "セキュリティ",
  "settings.group.security.hint": "ログイン中のデバイスとセッションを管理します。",
  "settings.sessions.title": "アクティブなセッション",
  "settings.sessions.loading": "セッションを読み込み中…",
  "settings.sessions.empty": "アクティブなセッションはありません。",
  "settings.sessions.thisDevice": "この端末",
  "settings.sessions.signOut": "ログアウト",
  "settings.sessions.revokeOthers": "他のすべての端末からログアウト",
  "settings.sessions.unknownDevice": "不明な端末",
  "settings.sessions.revoked": "セッションを終了しました",
  "settings.sessions.revokedOthersTitle": "他の端末からログアウトしました",
  "settings.sessions.revokedOthersBody": "{count} 台の端末からログアウトしました。",
  "security.reuse.title": "セキュリティ通知",
  "security.reuse.message":
    "別の場所からのログイン試行が検知されたため、すべてのセッションが自動的に終了されました。心当たりがない場合はパスワードを変更してください。",
  "security.reuse.action": "再ログイン",
  "settings.github.connectedAsLogin": "@{login} で接続中",
  "settings.github.commitRead": "コミット読み取り",
  "settings.github.commitReadOn": "含む",
  "settings.github.commitReadOff": "除外",
  "settings.github.pushTarget": "Push 対象リポジトリ",
  "settings.github.pushTargetNone": "選択なし",
  "settings.github.pushTargetHint":
    "振り返りの Markdown をこのリポジトリに push します。",
  "settings.github.reconnectBanner": "GitHub 接続のアップデートが必要です",
  "settings.github.reconnectBannerMsg":
    "git bash などのローカルツールでのコミットを正確に表示するには、権限の更新が必要です。",
  "settings.github.reconnect": "GitHub を再接続",
  "settings.section.region": "地域とタイムゾーン",
  "settings.region.title": "国 / タイムゾーン",
  "settings.region.apply": "国の変更を適用",
  "settings.region.applying": "適用中…",
  "settings.region.updated": "国を変更しました",
  "settings.region.modalTitle": "要約時間も変更しますか？",
  "settings.region.modalMessage":
    "国を変更すると、AI 自動要約のタイムゾーン（現地午前1時）を新しい国に合わせて更新できます。現在のタイムゾーンを維持することもできます。",
  "settings.region.modalMessageWithTz":
    "{country}に変更すると、タイムゾーンが{timezone}になります。AI 要約のスケジュール（現地午前1時）も更新しますか？",
  "settings.region.modalUseNew": "新しい国のタイムゾーンにする",
  "settings.region.modalKeep": "現在のタイムゾーンを維持",
  "settings.region.selectRegionHint": "地域を選択すると適用ボタンが有効になります。",
  "settings.region.selectTimezone": "タイムゾーンを選択",
  "settings.region.selectTimezoneHint": "この国には複数のタイムゾーンがあります。選択してください。",
  "settings.region.loadingTz": "タイムゾーン読み込み中…",
  "settings.region.autoTz": "自動タイムゾーン：{timezone}",
  "settings.timezone.label": "タイムゾーン（要約実行基準）",
  "settings.timezone.hint":
    "AI 自動要約はこのタイムゾーンの午前1時に実行されます。",
  "settings.timezone.updated": "タイムゾーンを変更しました",
  "settings.language.label": "言語",
  "settings.language.rowHint": "インターフェース表示言語",
  "settings.region.countryHint": "日付・要約の基準となる地域",
  "settings.autoSummary.weekly": "週次自動サマリー",
  "settings.autoSummary.monthly": "月次自動サマリー",
  "settings.autoSummary.yearly": "年次自動サマリー",
  "settings.autoSummary.description":
    "ON にすると、期間終了の真夜中に AI が自動的に振り返りをサマリーします。",
  "settings.notifications.retention.label": "通知保持期間",
  "settings.notifications.retention.unit": "日",
  "settings.notifications.retention.hint": "古い通知を自動的に削除します。",
  "settings.section.templates": "振り返りテンプレート",
  "settings.templates.title": "Retro Templates",
  "settings.templates.description":
    "新しい振り返りを作成する際に自動で適用される初期構造を編集します。/ でブロックを挿入できます。",
  "settings.templates.default": "デフォルト",
  "settings.templates.add": "新しいテンプレート",
  "settings.templates.selectHint": "左のリストからテンプレートを選択してください。",
  "settings.templates.namePlaceholder": "テンプレート名",
  "settings.templates.contentPlaceholder":
    "新しい振り返りに事前入力されるコンテンツを記入してください。/ でブロックを挿入できます。",
  "settings.templates.reset": "デフォルトに戻す",
  "settings.templates.use": "使用する",
  "settings.templates.inUse": "使用中",
  "settings.templates.activeHint":
    "「使用中」のテンプレートが、新しい振り返りの作成時に自動で適用されます。",
  "settings.templates.newName": "新規{type}テンプレート",
  "settings.templates.defaultName.daily": "デフォルト日次テンプレート",
  "settings.templates.defaultName.weekly": "デフォルト週次テンプレート",
  "settings.templates.defaultName.monthly": "デフォルト月次テンプレート",
  "settings.templates.defaultName.yearly": "デフォルト年次テンプレート",
  "settings.section.integrations": "連携",
  "settings.section.preferences": "環境設定",
  "settings.group.integrations.hint": "外部サービスとの連携を管理します。",
  "settings.group.preferences.hint": "言語・自動サマリー・通知の動作を調整します。",
  "settings.group.templates.hint":
    "振り返りタイプごとの初期構造を定義し、使用するテンプレートを選択します。",

  "common.cancel": "キャンセル",
  "common.confirm": "確認",
  "common.save": "保存",
  "common.delete": "削除",
  "common.close": "閉じる",
  "common.on": "オン",
  "common.off": "オフ",

  "auth.divider.or": "または",
  "auth.error.network": "ネットワーク接続を確認してください。",
  "auth.error.unknown": "不明なエラーが発生しました。",
  "auth.password.show": "パスワードを表示",
  "auth.password.hide": "パスワードを非表示",
  "auth.consoleHint": "実際のメールは送信されません。ブラウザの開発者ツールのコンソールで認証コードを確認してください。",

  "auth.login.title": "おかえりなさい",
  "auth.login.subtitle": "ARCHIVE アカウントにサインイン",
  "auth.login.email": "メール",
  "auth.login.password": "パスワード",
  "auth.login.rememberMe": "ログイン状態を保持",
  "auth.login.forgotPassword": "パスワードをお忘れですか？",
  "auth.login.submit": "サインイン",
  "auth.login.submitting": "サインイン中…",
  "auth.login.noAccount": "アカウントをお持ちでない方は",
  "auth.login.signupLink": "新規登録",
  "auth.login.error.invalidCredentials": "メールまたはパスワードが正しくありません。",
  "auth.login.error.userNotFound": "登録されていないメールです。",

  "auth.signup.title": "ARCHIVE をはじめる",
  "auth.signup.subtitle": "メール認証を完了してアカウントを作成",
  "auth.signup.step1": "メール",
  "auth.signup.step2": "認証",
  "auth.signup.step3": "プロフィール",
  "auth.signup.email": "メール",
  "auth.signup.emailNext": "認証コードを送信",
  "auth.signup.emailSending": "送信中…",
  "auth.signup.code": "認証コード (6桁)",
  "auth.signup.codeVerify": "コードを確認",
  "auth.signup.codeResend": "コードを再送信",
  "auth.signup.codeResendIn": "{n} 秒後に再送信可能",
  "auth.signup.password": "パスワード",
  "auth.signup.passwordHint": "8文字以上",
  "auth.signup.passwordConfirm": "パスワード（確認）",
  "auth.signup.passwordMismatch": "パスワードが一致しません。",
  "auth.signup.displayName": "ニックネーム",
  "auth.signup.displayNamePlaceholder": "他のユーザーに表示される名前",
  "auth.signup.terms": "利用規約とプライバシーポリシーに同意します。",
  "auth.signup.submit": "登録完了",
  "auth.signup.country": "国",
  "auth.signup.countryPlaceholder": "国を選択",
  "auth.signup.region": "地域（州・県）",
  "auth.signup.regionPlaceholder": "地域を選択",
  "ui.select.search": "検索...",
  "ui.select.empty": "結果なし",
  "auth.signup.error.countryRequired": "国を選択してください。",
  "auth.signup.error.regionRequired": "この国は地域（州・県）の選択が必要です。",
  "auth.onboarding.title": "もう少しで完了です",
  "auth.onboarding.subtitle": "タイムゾーン設定のため国情報を入力してください",
  "auth.onboarding.lead": "正確な期間集計のため、お住まいの国（必要なら地域）を選択してください。",
  "auth.onboarding.submit": "登録を完了",
  "auth.onboarding.backToLogin": "ログインに戻る",
  "auth.onboarding.error.expired": "セッションの有効期限が切れました。もう一度GitHub/Googleでお試しください。",
  "auth.signup.submitting": "登録処理中…",
  "auth.signup.haveAccount": "既にアカウントをお持ちの方は",
  "auth.signup.loginLink": "サインイン",
  "auth.signup.back": "戻る",
  "auth.signup.error.alreadyRegistered": "このメールは既に登録されています。",
  "auth.signup.error.invalidCode": "コードが正しくありません。",
  "auth.signup.error.expired": "コードの有効期限が切れました。再送信してください。",
  "auth.signup.error.cooldown": "少し待ってから再度お試しください。",
  "auth.signup.error.notVerified": "先にメール認証を完了してください。",

  "auth.forgot.title": "パスワードのリセット",
  "auth.forgot.subtitle": "登録されたメールに認証コードを送ります",
  "auth.forgot.emailSubmit": "リセットコードを送信",
  "auth.forgot.codeSubmit": "コードを確認",
  "auth.forgot.newPasswordSubmit": "パスワードを変更",
  "auth.forgot.success": "パスワードが変更されました。再度サインインしてください。",
  "auth.forgot.error.userNotFound": "登録されていないメールです。",
  "auth.forgot.linkSent":
    "そのメールが登録されている場合、パスワード再設定リンクを送信しました。メールをご確認ください。",
  "auth.forgot.backToLogin": "サインインに戻る",
  "auth.reset.title": "新しいパスワードを設定",
  "auth.reset.subtitle": "使用したいパスワードを入力してください。",
  "auth.reset.newPassword": "新しいパスワード",
  "auth.reset.submit": "パスワードを変更",
  "auth.reset.success":
    "パスワードを変更しました。新しいパスワードで再度ログインしてください。",
  "auth.reset.goLogin": "ログインへ",
  "auth.reset.requestAgain": "再設定リンクを再取得",
  "auth.reset.error.tokenInvalid":
    "無効なリンクです。パスワード再設定をやり直してください。",
  "auth.reset.error.tokenExpired":
    "リンクの有効期限が切れました。再設定をやり直してください。",
  "auth.reset.error.notAllowed":
    "このアカウントはパスワード再設定を利用できません。",

  "auth.oauth.github": "GitHub で続ける",
  "auth.oauth.google": "Google で続ける",
  "auth.oauth.processing": "処理中…",

  "auth.header.logout": "サインアウト",

  "onboarding.accountType.title": "ARCHIVEをどのように使いますか？",
  "onboarding.accountType.subtitle": "あなたの作業スタイルに合った体験を提供します。設定からいつでも変更できます。",
  "onboarding.accountType.developer": "開発者",
  "onboarding.accountType.developerDesc": "GitHubのコミット履歴、振り返り連携など開発者向け機能を含みます。",
  "onboarding.accountType.user": "一般ユーザー",
  "onboarding.accountType.userDesc": "カレンダー、タスク、振り返りを中心としたシンプルな体験です。",
  "onboarding.accountType.continue": "始める",
  "onboarding.accountType.skip": "スキップ（一般ユーザーとして開始）",

  "settings.accountType.title": "アカウントタイプ",
  "settings.accountType.hint": "開発者アカウントはGitHub連携とコミット履歴機能を含みます。",
  "settings.accountType.developer": "開発者",
  "settings.accountType.user": "一般ユーザー",
};

export const DICTIONARIES: Record<Locale, Dict> = { ko, en, zh, ja };
