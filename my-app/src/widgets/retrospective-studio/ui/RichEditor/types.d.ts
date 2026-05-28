/**
 * tiptap-markdown은 Editor.storage.markdown.getMarkdown()을 추가하지만
 * 타입 선언을 제공하지 않으므로 여기서 모듈 확장.
 */
declare module "@tiptap/core" {
  interface Storage {
    markdown: {
      getMarkdown: () => string;
    };
  }
}

export {};
