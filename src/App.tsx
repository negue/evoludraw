import {Excalidraw} from "@excalidraw/excalidraw";
import './App.css'

import {useDebouncedCallback} from 'use-debounce';
import {useEffect, useState} from "react";
import {ExcalidrawElement} from "@excalidraw/excalidraw/types/element/types";
import {ExcalidrawImperativeAPI} from "@excalidraw/excalidraw/types/types";
import {Mnemonic, useQuery, useSyncState} from "@evolu/react";
import {
  allPagesListQuery,
  createPage,
  deletePage, editPageEntries,
  editPageName,
  evolu,
  getPageContent,
  PageId,
  PageTable
} from "./evolu.ts";
import {isTheSame} from "./utils.ts";

// Enjoy the State MADneSs!! :) and the ts-expect-errors, this is a POC

function App() {
  const {rows: allPages} = useQuery(allPagesListQuery);
  const currentSyncState = useSyncState();

  const [currentPageId, setCurrentPageId] = useState<PageId | null>(null)
  const [currentPage, setCurrentPage] = useState<Partial<PageTable> | null>(null);

  useEffect(() => {
    if (!currentPageId && allPages.length !== 0) {
      // update the currentPageId on the first view
      setCurrentPageId(allPages[0].id)
    }

    if (currentSyncState._tag === "SyncStateIsSynced"
      && !currentPageId
      && allPages.length === 0) {
      // Create a page on the first view,
      // sadly buggy: create a 2nd when importing a mnenomic
      // createNewPageAndJumpToIt("First Page :)");

    }
  }, [currentSyncState, currentPageId, allPages, setCurrentPageId]);


  const [appState, setAppState] = useState<Readonly<ExcalidrawElement[]>>([]);

  function createNewPageAndJumpToIt(insertName?: string) {
    const result = createPage(insertName ?? prompt("Page Name") ?? 'Empty');

    setCurrentPageId(result.id);
  }

  // every mouse move triggers it as well, thats why a debounce is needed :D
  const debounced = useDebouncedCallback(
    // function
    (value) => {
      if (isTheSame(value, appState)) {
        return;
      }

      const valueClone = structuredClone(value);

      // deep clone the objects, otherwise the isTheSame function can't detect any changes
      // since the values are updated internally
      setAppState(valueClone);

      if (!currentPageId) {
        return;
      }

      console.info('updating the database entry', valueClone);

      // readonly types to PageTable column property type...
      // I don't know, any for now, I'm sorry :D
      editPageEntries(currentPageId, valueClone as any)
    },
    // delay in ms
    1000
  );

  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

  useEffect(() => {
    if (!currentPageId || !excalidrawAPI) {
      return;
    }

    if (allPages.length !== 0 && currentPage?.id !== currentPageId) {
      setCurrentPage(allPages.find(p => p.id === currentPageId) as Partial<PageTable>);
    }

    const pageContentQuery = getPageContent(currentPageId);

    function processNewElements(pageData: Partial<PageTable>) {
      var currentSceneElements = excalidrawAPI?.getSceneElements();


      const elements = pageData?.excalidrawElements ?? [] as unknown as Readonly<ExcalidrawElement[]>;


      // @ts-expect-error NonDeleted <> ExcalidrawElements
      if (isTheSame(currentSceneElements, elements)) {
        console.info('processNewElements called but it was the same, ignoring, sync call');
        return;
      }

      setCurrentPage(pageData);

      if (excalidrawAPI) {
        console.info('updating scene', elements);
        // @ts-expect-error Readonly untyped to readonly ExcalidrawElements
        excalidrawAPI.updateScene({elements: elements})
      }
    }

    console.info('Subscribing to Evolu');

    // subscribe not returning any data on the first call... by design or by bug?^^
    const unsubscribeOfEvolu = evolu.subscribeQuery(pageContentQuery)(() => {
      const updatedData = evolu.getQuery(pageContentQuery);

      // @ts-expect-error Kysely Result != PageTable .. stuff
      processNewElements(updatedData.row)
    });

    // async/await not allowed in useEffect... yaaay
    evolu.loadQuery(pageContentQuery).then(res => {
      // @ts-expect-error Kysely Result != PageTable .. stuff
      processNewElements(res.row)
    });

    return () => {

      console.info('Unsubscribing to Evolu');
      unsubscribeOfEvolu();
    }
  }, [currentPageId, excalidrawAPI]);

  function deleteOwner() {
    evolu.resetOwner();
  }

  function getMnemonic() {
    alert(evolu.getOwner()?.mnemonic);
  }

  function setMnemonic() {
    const mem = prompt("Your Mnemonic");

    if (mem) {
      evolu.restoreOwner(mem as Mnemonic)
    }

  }

  return (
    <>
      <div>
        <br/>
        <button onClick={() => createNewPageAndJumpToIt()}>New Page</button>
        | &nbsp;
        <select value={currentPageId ?? ''}
                onChange={e => setCurrentPageId(e.target.value as PageId)}>
          {allPages.map(p =>
            <option key={p.id} value={p.id}>{p.title}</option>
          )}
        </select>&nbsp;
        |
        <button disabled={currentPage === null}
                onClick={() => editPageName(currentPage!)}>Rename Page</button>
        <button disabled={currentPageId === null}
                onClick={() => deletePage(currentPageId!)}>Delete Page
        </button>
        |
        <button onClick={getMnemonic}>Copy memnoic</button>
        <button onClick={setMnemonic}>Set memnoic</button>
        <button onClick={deleteOwner}>Reset Owner</button>

        <br/>
        <br/>
      </div>
      <div style={{height: "90%"}}>
        {currentPageId &&
          <Excalidraw onChange={el => debounced(el)}
                      excalidrawAPI={(api) => setExcalidrawAPI(api)}/>
        }
      </div>
    </>
  )
}

export default App
