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
  | "sync.minutesAgo"
  | "sync.offline"
  | "sync.synced"
  | "sync.status"
  | "sync.connectInSettings"
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
  | "todo.quick.today"
  | "todo.quick.tomorrow"
  | "todo.quick.weekend"
  | "todo.picker.quickDate"
  | "todo.picker.calendar"
  | "todo.picker.prev"
  | "todo.picker.next"
  // Calendar
  | "calendar.view.week"
  | "calendar.view.month"
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
  | "retro.editor.learned"
  | "retro.editor.learnedPlaceholder"
  | "retro.editor.save"
  | "retro.editor.synced"
  | "retro.editor.pending"
  | "retro.summarize.weekly"
  | "retro.summarize.monthly"
  | "retro.summarize.yearly"
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
  | "settings.language.label"
  | "settings.autoSummary.weekly"
  | "settings.autoSummary.monthly"
  | "settings.autoSummary.yearly"
  | "settings.autoSummary.description"
  | "settings.notifications.retention.label"
  | "settings.notifications.retention.unit"
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
  | "auth.forgot.error.userNotFound"
  | "auth.forgot.backToLogin"
  // Auth — OAuth
  | "auth.oauth.github"
  | "auth.oauth.google"
  | "auth.oauth.processing"
  // Auth — header
  | "auth.header.logout";

type Dict = Record<TranslationKey, string>;

const ko: Dict = {
  "nav.calendar": "Calendar",
  "nav.todos": "To-Dos",
  "nav.retrospectives": "Retrospectives",
  "nav.settings": "Settings",
  "nav.brand": "A.R.C.H.I.V.E",

  "subheader.calendar.eyebrow": "Planning Canvas",
  "subheader.calendar.title": "오늘의 캘린더",
  "subheader.calendar.subtitle":
    "일정과 작업을 한 화면에서 살펴봅니다. 카드를 드래그해 다른 날짜로 옮길 수 있습니다.",
  "subheader.todos.eyebrow": "Quick Capture",
  "subheader.todos.title": "Editorial Kanban",
  "subheader.todos.subtitle":
    "자연어로 적는 순간 칸반에 정렬됩니다. 시작 전 / 진행 중 / 완료 세 열로 흐름을 정리하세요.",
  "subheader.retrospectives.eyebrow": "Writing Ledger",
  "subheader.retrospectives.title": "Retrospectives",
  "subheader.retrospectives.subtitle":
    "완료한 작업과 오늘의 커밋을 한 흐름으로 묶고, GitHub 저장소에 자동 동기화합니다.",
  "subheader.settings.eyebrow": "Integrations and Templates",
  "subheader.settings.title": "Settings",
  "subheader.settings.subtitle":
    "GitHub 연결 범위와, 자동 회고 요약을 자유롭게 조정합니다.",

  "sync.connected": "GitHub 연결됨",
  "sync.disconnected": "연결 없음",
  "sync.minutesAgo": "{n}분 전 동기화",
  "sync.offline": "Offline",
  "sync.synced": "Synced · {n}m",
  "sync.status": "Sync Status",
  "sync.connectInSettings": "Settings에서 연결하세요",

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
  "todo.quick.today": "오늘",
  "todo.quick.tomorrow": "내일",
  "todo.quick.weekend": "이번 주말",
  "todo.picker.quickDate": "Quick Date",
  "todo.picker.calendar": "Calendar",
  "todo.picker.prev": "이전 달",
  "todo.picker.next": "다음 달",

  "calendar.view.week": "주간",
  "calendar.view.month": "월간",
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
  "retro.editor.learned": "배운 점과 아쉬운 점 · Learned",
  "retro.editor.learnedPlaceholder":
    "오늘 알게 된 것, 다음에 더 잘하고 싶은 것을 자유롭게 적어주세요.",
  "retro.editor.save": "저장 · 동기화",
  "retro.editor.synced": "GitHub에 동기화됨",
  "retro.editor.pending": "동기화 대기 중",
  "retro.summarize.weekly": "주간 요약",
  "retro.summarize.monthly": "월간 요약",
  "retro.summarize.yearly": "연간 요약",
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
  "settings.language.label": "언어 선택",
  "settings.autoSummary.weekly": "주간 자동 요약",
  "settings.autoSummary.monthly": "월간 자동 요약",
  "settings.autoSummary.yearly": "연간 자동 요약",
  "settings.autoSummary.description":
    "활성화하면 해당 기간이 끝나는 자정에 AI가 자동으로 회고를 요약합니다.",
  "settings.notifications.retention.label": "알림 보관 기간",
  "settings.notifications.retention.unit": "일",

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
  "auth.forgot.backToLogin": "로그인으로 돌아가기",

  "auth.oauth.github": "GitHub으로 계속하기",
  "auth.oauth.google": "Google로 계속하기",
  "auth.oauth.processing": "처리 중…",

  "auth.header.logout": "로그아웃",
};

const en: Dict = {
  "nav.calendar": "Calendar",
  "nav.todos": "To-Dos",
  "nav.retrospectives": "Retrospectives",
  "nav.settings": "Settings",
  "nav.brand": "A.R.C.H.I.V.E",

  "subheader.calendar.eyebrow": "Planning Canvas",
  "subheader.calendar.title": "Today's Calendar",
  "subheader.calendar.subtitle":
    "Review schedules and tasks in one view. Drag a card to move it to another day.",
  "subheader.todos.eyebrow": "Quick Capture",
  "subheader.todos.title": "Editorial Kanban",
  "subheader.todos.subtitle":
    "Type to add — your task lands on the board instantly. Flow through Not Started · In Progress · Done.",
  "subheader.retrospectives.eyebrow": "Writing Ledger",
  "subheader.retrospectives.title": "Retrospectives",
  "subheader.retrospectives.subtitle":
    "Tie completed work and today's commits into a single thread, then sync to your GitHub repo.",
  "subheader.settings.eyebrow": "Integrations and Templates",
  "subheader.settings.title": "Settings",
  "subheader.settings.subtitle":
    "Adjust GitHub scope and automated retrospective summaries.",

  "sync.connected": "GitHub connected",
  "sync.disconnected": "Not connected",
  "sync.minutesAgo": "Synced {n}m ago",
  "sync.offline": "Offline",
  "sync.synced": "Synced · {n}m",
  "sync.status": "Sync Status",
  "sync.connectInSettings": "Connect from Settings",

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
  "todo.quick.today": "Today",
  "todo.quick.tomorrow": "Tomorrow",
  "todo.quick.weekend": "This weekend",
  "todo.picker.quickDate": "Quick Date",
  "todo.picker.calendar": "Calendar",
  "todo.picker.prev": "Previous month",
  "todo.picker.next": "Next month",

  "calendar.view.week": "Week",
  "calendar.view.month": "Month",
  "calendar.legend.notStart": "Not Started",
  "calendar.legend.inProgress": "In Progress",
  "calendar.legend.done": "Done",
  "calendar.today": "TODAY",
  "calendar.taskDetail.title": "Task Detail",
  "calendar.taskDetail.close": "Close",
  "calendar.empty.day": "—",
  "calendar.dropHint": "Drop here",
  "calendar.nav.prev": "← Prev",
  "calendar.nav.today": "Today",
  "calendar.nav.next": "Next →",
  "calendar.addCard": "New card",
  "calendar.moreItems": "+{n} more",
  "calendar.days.sun": "S",
  "calendar.days.mon": "M",
  "calendar.days.tue": "T",
  "calendar.days.wed": "W",
  "calendar.days.thu": "T",
  "calendar.days.fri": "F",
  "calendar.days.sat": "S",
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
  "retro.editor.learned": "What I learned",
  "retro.editor.learnedPlaceholder":
    "Write freely about what you learned and what you'd improve.",
  "retro.editor.save": "Save · Sync",
  "retro.editor.synced": "Synced to GitHub",
  "retro.editor.pending": "Sync pending",
  "retro.summarize.weekly": "Weekly summary",
  "retro.summarize.monthly": "Monthly summary",
  "retro.summarize.yearly": "Yearly summary",
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
  "settings.language.label": "Language",
  "settings.autoSummary.weekly": "Weekly auto-summary",
  "settings.autoSummary.monthly": "Monthly auto-summary",
  "settings.autoSummary.yearly": "Yearly auto-summary",
  "settings.autoSummary.description":
    "When on, the AI will summarize retrospectives automatically at midnight when the period ends.",
  "settings.notifications.retention.label": "Notification retention",
  "settings.notifications.retention.unit": "days",

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
  "auth.forgot.backToLogin": "Back to sign in",

  "auth.oauth.github": "Continue with GitHub",
  "auth.oauth.google": "Continue with Google",
  "auth.oauth.processing": "Processing…",

  "auth.header.logout": "Sign out",
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
  "sync.minutesAgo": "{n} 分钟前同步",
  "sync.offline": "离线",
  "sync.synced": "已同步 · {n}m",
  "sync.status": "同步状态",
  "sync.connectInSettings": "请在设置中连接",

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
  "todo.quick.today": "今天",
  "todo.quick.tomorrow": "明天",
  "todo.quick.weekend": "本周末",
  "todo.picker.quickDate": "快速日期",
  "todo.picker.calendar": "日历",
  "todo.picker.prev": "上一月",
  "todo.picker.next": "下一月",

  "calendar.view.week": "周",
  "calendar.view.month": "月",
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
  "retro.editor.learned": "学到的与改进点",
  "retro.editor.learnedPlaceholder":
    "随意记录今天学到的事情和下次想做得更好的部分。",
  "retro.editor.save": "保存 · 同步",
  "retro.editor.synced": "已同步到 GitHub",
  "retro.editor.pending": "等待同步",
  "retro.summarize.weekly": "周摘要",
  "retro.summarize.monthly": "月摘要",
  "retro.summarize.yearly": "年摘要",
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
  "settings.language.label": "语言",
  "settings.autoSummary.weekly": "周自动摘要",
  "settings.autoSummary.monthly": "月自动摘要",
  "settings.autoSummary.yearly": "年自动摘要",
  "settings.autoSummary.description":
    "启用后,AI 会在对应周期结束的午夜自动生成摘要。",
  "settings.notifications.retention.label": "通知保留时长",
  "settings.notifications.retention.unit": "天",

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
  "auth.forgot.backToLogin": "返回登录",

  "auth.oauth.github": "使用 GitHub 继续",
  "auth.oauth.google": "使用 Google 继续",
  "auth.oauth.processing": "处理中…",

  "auth.header.logout": "退出登录",
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
  "sync.minutesAgo": "{n} 分前に同期",
  "sync.offline": "オフライン",
  "sync.synced": "Synced · {n}m",
  "sync.status": "同期ステータス",
  "sync.connectInSettings": "設定から接続してください",

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
  "todo.quick.today": "今日",
  "todo.quick.tomorrow": "明日",
  "todo.quick.weekend": "今週末",
  "todo.picker.quickDate": "クイック日付",
  "todo.picker.calendar": "カレンダー",
  "todo.picker.prev": "前の月",
  "todo.picker.next": "次の月",

  "calendar.view.week": "週",
  "calendar.view.month": "月",
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
  "retro.editor.learned": "学びと改善点",
  "retro.editor.learnedPlaceholder":
    "今日気付いたこと、次に改善したいことを自由に。",
  "retro.editor.save": "保存・同期",
  "retro.editor.synced": "GitHub に同期",
  "retro.editor.pending": "同期待ち",
  "retro.summarize.weekly": "週次サマリー",
  "retro.summarize.monthly": "月次サマリー",
  "retro.summarize.yearly": "年次サマリー",
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
  "settings.language.label": "言語",
  "settings.autoSummary.weekly": "週次自動サマリー",
  "settings.autoSummary.monthly": "月次自動サマリー",
  "settings.autoSummary.yearly": "年次自動サマリー",
  "settings.autoSummary.description":
    "ON にすると、期間終了の真夜中に AI が自動的に振り返りをサマリーします。",
  "settings.notifications.retention.label": "通知保持期間",
  "settings.notifications.retention.unit": "日",

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
  "auth.forgot.backToLogin": "サインインに戻る",

  "auth.oauth.github": "GitHub で続ける",
  "auth.oauth.google": "Google で続ける",
  "auth.oauth.processing": "処理中…",

  "auth.header.logout": "サインアウト",
};

export const DICTIONARIES: Record<Locale, Dict> = { ko, en, zh, ja };
