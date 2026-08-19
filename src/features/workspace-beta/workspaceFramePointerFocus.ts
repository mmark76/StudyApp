const workspaceFrameSelector = 'iframe.workspace-beta-frame[name^="studyapp-workspace-"]';

function focusWorkspaceFrame(target: EventTarget | null): void {
  if (!(target instanceof HTMLIFrameElement)) return;
  if (!target.matches(workspaceFrameSelector)) return;

  // After dragging a Workspace divider, Chromium can leave focus on the
  // separator. Giving the hovered same-origin frame focus restores native
  // wheel scrolling without requiring a click or text selection first.
  target.focus({ preventScroll: true });
  target.contentWindow?.focus();
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
  document.addEventListener("pointerover", (event) => {
    focusWorkspaceFrame(event.target);
  }, true);

  document.addEventListener("wheel", (event) => {
    focusWorkspaceFrame(event.target);
  }, { capture: true, passive: true });

  document.addEventListener("pointerup", releasePointerDividerFocus, true);
  document.addEventListener("pointercancel", releasePointerDividerFocus, true);
}
