function isNode(value: EventTarget | null): value is Node {
  return value instanceof Node;
}

document.addEventListener("mouseout", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const menu = target.closest<HTMLDetailsElement>("details.workspace-beta-info-menu");
  if (!menu?.open) return;

  if (isNode(event.relatedTarget) && menu.contains(event.relatedTarget)) return;

  menu.open = false;
});
