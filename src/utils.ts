import {ExcalidrawElement} from "@excalidraw/excalidraw/types/element/types";

export function isTheSame(left: ExcalidrawElement[], right: Readonly<ExcalidrawElement[]>) {
    if (left.length !== right.length) {
      return false;
    }

    const sumLeft = left.reduce((sum, e) => {
      return sum + e.version;
    }, 0);
    const sumRight = right.reduce((sum, e) => {
      return sum + e.version;
    }, 0);

    console.info(sumLeft, sumRight);

    return sumLeft === sumRight;
  }
