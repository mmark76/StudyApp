import { expect, test } from "@playwright/test";

test("the Sources and AI Agent panels collapse without losing active work", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();

  const activeFrame = page.locator('iframe[name="studyapp-workspace-workspace"]');
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  const sourcesPanel = page.locator(".workspace-beta-phase-sources");
  const sourcesFrame = page.locator('iframe[name="studyapp-workspace-sources"]');
  const hideSources = page.getByRole("button", { name: "Hide sources panel", exact: true });
  const hideSourcesIcon = hideSources.locator(".workspace-beta-column-symbol");
  await expect(hideSources).toHaveText("");
  await expect(hideSourcesIcon).toBeVisible();
  await expect(page.locator(".workspace-beta-phase-workspace > .workspace-beta-panel-header .workspace-beta-column-toggle")).toHaveCount(0);
  await expect(page.locator(".workspace-beta-phase-tools > .workspace-beta-panel-header .workspace-beta-column-toggle")).toHaveCount(0);

  const expandedDividerPosition = await hideSourcesIcon.evaluate((element) =>
    getComputedStyle(element, "::before").left,
  );
  await hideSources.click();
  await expect(sourcesPanel).toHaveClass(/is-collapsed/u);
  await expect(sourcesFrame).toBeAttached();
  await expect(sourcesFrame).toBeHidden();
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  const showSources = page.getByRole("button", { name: "Show sources panel", exact: true });
  const showSourcesIcon = showSources.locator(".workspace-beta-column-symbol");
  const collapsedDividerPosition = await showSourcesIcon.evaluate((element) =>
    getComputedStyle(element, "::before").left,
  );
  expect(collapsedDividerPosition).not.toBe(expandedDividerPosition);
  await showSources.click();
  await expect(sourcesFrame).toBeVisible();

  const agentBar = page.locator(".workspace-beta-agent-bar");
  const hideAgent = page.getByRole("button", { name: "Hide AI Agent panel", exact: true });
  const hideIcon = hideAgent.locator(".workspace-beta-agent-toggle-symbol");
  await expect(agentBar).toContainText("AI Agent bar — Available only in Local version");
  await expect(agentBar).toContainText("Not available");
  await expect(hideAgent).toHaveText("");
  await expect(hideIcon).toBeVisible();
  const expandedAgentDividerPosition = await hideIcon.evaluate((element) =>
    getComputedStyle(element, "::before").top,
  );

  await hideAgent.click();
  await expect(page.locator(".workspace-beta-phase-one")).toHaveClass(/is-agent-collapsed/u);
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  await expect(agentBar.getByRole("status")).toBeHidden();
  const showAgent = page.getByRole("button", { name: "Show AI Agent panel", exact: true });
  const showIcon = showAgent.locator(".workspace-beta-agent-toggle-symbol");
  await expect(showIcon).toBeVisible();
  const collapsedAgentDividerPosition = await showIcon.evaluate((element) =>
    getComputedStyle(element, "::before").top,
  );
  expect(collapsedAgentDividerPosition).not.toBe(expandedAgentDividerPosition);

  await showAgent.click();
  await expect(agentBar.getByRole("status")).toBeVisible();
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  await expect(page.getByRole("button", { name: "Learning Goals", exact: true })).toHaveClass(/is-selected/u);
});
