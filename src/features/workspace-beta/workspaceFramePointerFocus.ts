const workspaceFrameNamePrefix = "studyapp-workspace-";

function isWorkspaceFrameWindow(): boolean {
  return typeof window !== "undefined"
    && window.parent !== window
    && window.name.startsWith(workspaceFrameNamePrefix);
}

function focusCurrentWorkspaceFrame(): void {
  if (!isWorkspaceFrameWindow()) return;
  window.focus();
}

function normaliseWheelDelta(event: WheelEvent): { left: number; top: number } {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return { left: event.deltaX * 16, top: event.deltaY * 16 };
  }
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return {
      left: event.deltaX * window.innerWidth,
      top: event.deltaY * window.innerHeight,
    };
  }
  return { left: event.deltaX, top: event.deltaY };
}

function canScrollInDirection(
  element: HTMLElement,
  left: number,
  top: number,
): boolean {
  const style = getComputedStyle(element);
  const canScrollY = element.scrollHeight > element.clientHeight + 1
    && style.overflowY !== "hidden"
    && style.overflowY !== "clip"
    && (
      (top < 0 && element.scrollTop > 0)
      || (top > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1)
    );
  const canScrollX = element.scrollWidth > element.clientWidth + 1
    && style.overflowX !== "hidden"
    && style.overflowX !== "clip"
    && (
      (left < 0 && element.scrollLeft > 0)
      || (left > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth - 1)
    );
  return canScrollY || canScrollX;
}

function findWheelScroller(
  target: EventTarget | null,
  left: number,
  top: number,
): HTMLElement | null {
  let element = target instanceof Element ? target : null;

  while (element instanceof HTMLElement) {
    if (canScrollInDirection(element, left, top)) return element;
    element = element.parentElement;
  }

  const documentScroller = document.scrollingElement;
  if (
    documentScroller instanceof HTMLElement
    && canScrollInDirection(documentScroller, left, top)
  ) {
    return documentScroller;
  }

  return null;
}

function handleWorkspaceFrameWheel(event: WheelEvent): void {
  if (!isWorkspaceFrameWindow() || event.ctrlKey) return;

  focusCurrentWorkspaceFrame();

  const delta = normaliseWheelDelta(event);
  if (delta.left === 0 && delta.top === 0) return;

  const scroller = findWheelScroller(event.target, delta.left, delta.top);
  if (!scroller) return;

  // Do not depend on Chromium's iframe focus heuristics after a divider drag.
  // Workspace frames explicitly scroll the element underneath the pointer,
  // including nested scroll containers and the document scroller.
  event.preventDefault();
  scroller.scrollBy({
    behavior: "auto",
    left: delta.left,
    top: delta.top,
  });
}

function releasePointerDividerFocus(): void {
  const activeElement = document.activeElement;
  if (
    activeElement instanceof HTMLElement
    && activeElement.classList.contains("workspace-beta-resizer")
  ) {
    activeElement.blur();
  }
}

if (typeof document !== "undefined") {
  if (isWorkspaceFrameWindow()) {
    document.addEventListener("wheel", handleWorkspaceFrameWheel, {
      capture: true,
      passive: false,
    });
  } else {
    document.addEventListener("pointerup", releasePointerDividerFocus, true);
    document.addEventListener("pointercancel", releasePointerDividerFocus, true);
  }
}
