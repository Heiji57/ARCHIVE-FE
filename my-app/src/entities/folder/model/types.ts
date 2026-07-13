export interface Folder {
  id: string;
  name: string;
  parentFolderId: string | null;
  /** 이 폴더의 직계 하위 폴더 개수. */
  folderCount: number;
  /** 이 폴더에 직접 속한 회고록 개수(daily+weekly+monthly+yearly 합산). */
  entryCount: number;
  createdAt: string;
  updatedAt: string | null;
}
