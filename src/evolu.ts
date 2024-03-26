import * as S from "@effect/schema/Schema";
import {
  NonEmptyString1000,
  cast,
  database,
  id,
  table,
} from "@evolu/common";

import {
  createEvolu,
} from "@evolu/react";
import {ExcalidrawElement} from "@excalidraw/excalidraw/types/element/types";

export const PageId = id("Page");
// It's branded string: string & Brand<"Id"> & Brand<"Todo">
// TodoId type ensures no other ID can be used where TodoId is expected.
export type PageId = S.Schema.Type<typeof PageId>;

export const SomeJson = S.struct({});
export type SomeJson = S.Schema.Type<typeof SomeJson>;

const PageTable = table({
  id: PageId,
  // Note we can enforce NonEmptyString1000.
  title: NonEmptyString1000,
  excalidrawElements: S.array(SomeJson)
});
export type PageTable = S.Schema.Type<typeof PageTable>;

const Database = database({
  pages: PageTable,
});
type Database = S.Schema.Type<typeof Database>;

export const evolu = createEvolu(Database, {
  name: 'evoludraw',
  // syncUrl: 'http://localhost_ignore'
});

export const allPagesListQuery = evolu.createQuery((db) =>
  db
    .selectFrom("pages")
    .select(["id", "title"])
    // SQLite doesn't support the boolean type, but we have `cast` helper.
    .where("isDeleted", "is not", cast(true))
    .orderBy("createdAt"),
);

export const getPageContent = (id: PageId) => evolu.createQuery(db => db.selectFrom("pages")
  .selectAll()
  .where("id", "==", id))

export function createPage(title: string) {
  return evolu.create("pages", {
    title: S.decodeSync(NonEmptyString1000)(title),
    excalidrawElements: []
  });
}

export function editPageName(page: Partial<PageTable>) {
  const newTitle = prompt('New Title', page.title ?? '');

  if (!newTitle) {
    return;
  }

  evolu.update("pages", {
    id: page.id!,
    title: S.decodeSync(NonEmptyString1000)(newTitle),
  });
}


export function editPageEntries(pageId: PageId,
                                excalidrawElements: ExcalidrawElement[]) {
  evolu.update("pages", {
    id: pageId,
    excalidrawElements
  });
}

export function deletePage(pageId: PageId) {
  evolu.update("pages", {
    id: pageId,
    isDeleted: true
  })
}
