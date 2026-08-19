const workspaceFrameNamePrefix = "studyapp-workspace-";
const workspaceFrameSelector = `iframe.workspace-beta-frame[name^="${workspaceFrameNamePrefix}"]`;

function isWorkspaceFrameWindow(): boolean {
  return typeof window !== "undefined"
    && window.parent !== window
    && window.name.startsWith(workspaceFrameNamePrefix);
}

function focusWorkspaceFrameElement(target: EventTarget | null): void {
  if (!(target instanceof HTMLIFrameElement)) return;
  if (!target.matches(workspaceFrameSelector)) return;

  target.focus({ preventScroll: true });
  target.contentWindow?.focus();
}

function focusCurrentWorkspaceFrame(): void {
  if (!isWorkspaceFrameWindow()) return;
  window.focus();
}

function handleWorkspaceFrameWheel(event: WheelEvent): void {
  if (!isWorkspaceFrameWindow()) return;

  const hadFocus = document.hasFocus();
  window.focus();

  // Chromium can occasionally keep focus in the parent document after a
  // divider drag. In that state the first wheel event reaches the iframe but
  // its native scrolling may be skipped until the user clicks or selects text.
  // Preserve that first wheel movement explicitly; later events remain native.
  if (!hadFocus && (event.deltaX !== 0 || event.deltaY !== 0)) {
    event.preventDefault();
    window.scrollBy({
      behavior: "auto",
      left: event.deltaX,
      top: event.deltaY,
    });
  }
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
    // These listeners run inside each same-origin Workspace iframe. Unlike
    // parent-document listeners, they receive the pointer/wheel events that
    // occur over the embedded StudyApp content itself.
    document.addEventListener("pointerenter", focusCurrentWorkspaceFrame, true);
    document.addEventListener("pointermove", focusCurrentWorkspaceFrame, {
      capture: true,
      passive: true,
    });
    document.addEventListener("wheel", handleWorkspaceFrameWheel, {
      capture: true,
      passive: false,
    });
  } else {
    document.addEventListener("pointerover", (event) => {
      focusWorkspaceFrameElement(event.target);
    }, true);

    document.addEventListener("pointerup", releasePointerDividerFocus, true);
    document.addEventListener("pointercancel", releasePointerDividerFocus, true);
  }
}
