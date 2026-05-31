import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 에디터 로드/렌더 실패 시 fallback UI를 렌더. 페이지 전체를 깨지 않게 함.
 */
export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RichEditor] crashed:", error, info);
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
