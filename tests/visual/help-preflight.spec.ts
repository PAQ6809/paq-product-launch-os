import { expect, test, type Locator, type Page } from "@playwright/test";

const routes = [
  { path: "/zh-TW", action: 'a[href$="/products/new"]:visible' },
  { path: "/zh-TW/login", action: 'form button[type="submit"]:visible' },
  { path: "/zh-TW/signup", action: 'form button[type="submit"]:visible' },
  { path: "/zh-TW/reset-password", action: 'form button[type="submit"]:visible' },
  { path: "/zh-TW/dashboard", action: 'a[href$="/products/new"]:visible' },
  { path: "/zh-TW/products/new", action: 'form button[type="submit"]:visible' },
  { path: "/zh-TW/products/arc-snap-power-bank/report", action: 'button:has-text("Export Markdown"):visible' }
];

async function expectCleanLayout(page: Page, route: string) {
  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      bodyScrollWidth: document.body.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasBrokenQuestionMarks: text.includes("??"),
      hasReplacementCharacter: text.includes("\uFFFD"),
      htmlScrollWidth: document.documentElement.scrollWidth
    };
  });

  expect(result.hasBrokenQuestionMarks, `${route} should not render repeated question marks`).toBe(false);
  expect(result.hasReplacementCharacter, `${route} should not render replacement characters`).toBe(false);
  expect(result.htmlScrollWidth, `${route} html should not overflow`).toBeLessThanOrEqual(result.clientWidth + 1);
  expect(result.bodyScrollWidth, `${route} body should not overflow`).toBeLessThanOrEqual(result.clientWidth + 1);
}

async function expectActionIsUsable(page: Page, locator: Locator, route: string) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator, `${route} primary action should be visible`).toBeVisible();
  await expect(locator, `${route} primary action should be enabled`).toBeEnabled();

  const isReachableAtCenter = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const topElement = document.elementFromPoint(x, y);
    return topElement === element || element.contains(topElement);
  });

  expect(isReachableAtCenter, `${route} primary action should not be covered`).toBe(true);
}

async function expectFloatingWidgetDoesNotCover(page: Page, locator: Locator, route: string) {
  const helpButton = page.getByRole("button", { name: /AI Help/ });
  await expect(helpButton, `${route} Help trigger should be visible`).toBeVisible();

  await locator.scrollIntoViewIfNeeded();
  const [targetBox, helpBox] = await Promise.all([locator.boundingBox(), helpButton.boundingBox()]);
  expect(targetBox, `${route} primary action should have a box`).not.toBeNull();
  expect(helpBox, `${route} Help trigger should have a box`).not.toBeNull();

  if (!targetBox || !helpBox) return;
  const overlaps =
    targetBox.x < helpBox.x + helpBox.width &&
    targetBox.x + targetBox.width > helpBox.x &&
    targetBox.y < helpBox.y + helpBox.height &&
    targetBox.y + targetBox.height > helpBox.y;

  expect(overlaps, `${route} Help trigger should not cover primary action`).toBe(false);
}

test("preflight routes are clean and primary actions remain usable with floating help", async ({ page }) => {
  test.slow();

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator("header").first(), `${route.path} header should render`).toBeVisible();
    await expect(page.locator("select").first(), `${route.path} language switcher should render`).toBeVisible();
    await expectCleanLayout(page, route.path);

    const primaryAction = page.locator(route.action).first();
    await expectActionIsUsable(page, primaryAction, route.path);
    await expectFloatingWidgetDoesNotCover(page, primaryAction, route.path);
  }
});

test("help drawer overlays without widening the page", async ({ page }) => {
  await page.goto("/zh-TW/products/new");
  await page.getByRole("button", { name: /AI Help/ }).click();
  await expect(page.getByRole("dialog", { name: "PAQ AI Help" })).toBeVisible();
  await expectCleanLayout(page, "/zh-TW/products/new with help drawer");

  const drawer = page.getByRole("dialog", { name: "PAQ AI Help" });
  const drawerBox = await drawer.boundingBox();
  const viewport = page.viewportSize();
  expect(drawerBox).not.toBeNull();
  expect(viewport).not.toBeNull();

  if (drawerBox && viewport) {
    expect(drawerBox.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(drawerBox.height).toBeLessThanOrEqual(viewport.height + 1);
  }
});
