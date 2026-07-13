import { useCallback, useState } from "react";

export interface FolderCrumb {
  id: string;
  name: string;
}

export interface UseFolderNavResult {
  /** 현재 폴더(null=최상위/루트). */
  currentFolderId: string | null;
  /** 루트 제외 경로(루트→현재 순). */
  breadcrumb: FolderCrumb[];
  /** 폴더 카드를 클릭해 그 안으로 들어간다. */
  enterFolder: (folder: FolderCrumb) => void;
  /** 루트로 이동. */
  goToRoot: () => void;
  /** breadcrumb[index] 로 이동(그 뒤 경로는 버림). */
  goToCrumb: (index: number) => void;
}

/** 폴더 브라우징 경로(현재 폴더 + breadcrumb) 상태. GET /folders/contents 는 직계
 * 하위만 반환하므로 조상 경로를 서버에서 알 수 없다 — 사용자가 들어간 순서대로
 * 클라이언트에서 스택으로 추적한다. */
export function useFolderNav(): UseFolderNavResult {
  const [breadcrumb, setBreadcrumb] = useState<FolderCrumb[]>([]);
  const currentFolderId =
    breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : null;

  const enterFolder = useCallback((folder: FolderCrumb) => {
    setBreadcrumb((prev) => [...prev, folder]);
  }, []);
  const goToRoot = useCallback(() => setBreadcrumb([]), []);
  const goToCrumb = useCallback((index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }, []);

  return { currentFolderId, breadcrumb, enterFolder, goToRoot, goToCrumb };
}
