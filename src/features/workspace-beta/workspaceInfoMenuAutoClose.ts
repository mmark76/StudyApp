function isNode(value: EventTarget | null): value is Node {
  return value instanceof Node;
}

const INFO_MENU_CLOSE_DELAY_MS = 260;
let pendingCloseTimer: number | null = null;
let pendingCloseMenu: HTMLDetailsElement | null = null;

function clearPendingClose(menu?: HTMLDetailsElement) {
  if (menu && pendingCloseMenu !== menu) return;
  if (pendingCloseTimer !== null) window.clearTimeout(pendingCloseTimer);
  pendingCloseTimer = null;
  pendingCloseMenu = null;
}

document.addEventListener("mouseover", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const menu = target.closest<HTMLDetailsElement>("details.workspace-beta-info-menu");
  if (!menu) return;
  clearPendingClose(menu);
});

document.addEventListener("mouseout", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const menu = target.closest<HTMLDetailsElement>("details.workspace-beta-info-menu");
  if (!menu?.open) return;

  if (isNode(event.relatedTarget) && menu.contains(event.relatedTarget)) return;

  clearPendingClose();
  pendingCloseMenu = menu;
  pendingCloseTimer = window.setTimeout(() => {
    if (menu.open) menu.open = false;
    clearPendingClose(menu);
  }, INFO_MENU_CLOSE_DELAY_MS);
});
