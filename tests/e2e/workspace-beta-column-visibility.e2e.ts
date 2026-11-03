import { expect, test } from "@playwright/test";

test("only the AI Agent panel can be collapsed without losing active work", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();

  const activeFrame = page.locator('iframe[name="studyapp-workspace-workspace"]');
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  await expect(page.locator(".workspace-beta-phase-sources > .workspace-beta-panel-header .workspace-beta-column-toggle")).toHaveCount(0);
  await expect(page.locator(".workspace-beta-phase-workspace > .workspace-beta-panel-header .workspace-beta-column-toggle")).toHaveCount(0);
  await expect(page.locator(".workspace-beta-phase-tools > .workspace-beta-panel-header .workspace-beta-column-toggle")).toHaveCount(0);

  const agentBar = page.locator(".workspace-beta-agent-bar");
  const hideAgent = page.getByRole("button", { name: "Hide AI Agent panel", exact: true });
  const hideIcon = hideAgent.locator(".workspace-beta-agent-toggle-symbol");
  await expect(agentBar).toContainText("Not available");
  await expect(hideAgent).toHaveText("");
  await expect(hideIcon).toBeVisible();
  const expandedDividerPosition = await hideIcon.evaluate((element) =>
    getComputedStyle(element, "::before").top,
  );

  await hideAgent.click();
  await expect(page.locator(".workspace-beta-phase-one")).toHaveClass(/is-agent-collapsed/u);
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  await expect(agentBar.getByRole("status")).toBeHidden();
  const showAgent = page.getByRole("button", { name: "Show AI Agent panel", exact: true });
  const showIcon = showAgent.locator(".workspace-beta-agent-toggle-symbol");
  await expect(showIcon).toBeVisible();
  const collapsedDividerPosition = await showIcon.evaluate((element) =>
    getComputedStyle(element, "::before").top,
  );
  expect(collapsedDividerPosition).not.toBe(expandedDividerPosition);

  await showAgent.click();
  await expect(agentBar.getByRole("status")).toBeVisible();
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  await expect(page.getByRole("button", { name: "Learning Goals", exact: true })).toHaveClass(/is-selected/u);
});
