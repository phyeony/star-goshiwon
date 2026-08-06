import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

const PDF_DIR = path.join("test-results", "document-pdfs");

// A4 at 96 CSS px/in: 210mm = 793.7px. The sheet carries its own 18mm
// (68.03px) margins as padding, because @page margins are ignored by
// headless printToPDF and overridable in the print dialog.
const A4_WIDTH_PX = 793.7;
const MARGIN_PX = 68.03;

test.describe("document print layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.goto("/test/document-print?type=contract&lang=ko");
    await page.emulateMedia({ media: "print" });
  });

  test("only the document reaches the page", async ({ page }) => {
    // Chrome outside the print root is hidden by the global print rules.
    await expect(page.getByTestId("page-chrome")).toBeHidden();
    await expect(page.getByTestId("print-button")).toBeHidden();
    // Form controls inside the root are dropped outright.
    await expect(page.getByTestId("stray-input")).toBeHidden();

    // The document itself survives.
    await expect(
      page.getByRole("heading", { name: "숙소 이용 계약서" })
    ).toBeVisible();
    await expect(page.getByText("Jane Traveler").first()).toBeVisible();
  });

  test("the sheet keeps real margins on both sides", async ({ page }) => {
    // The regression that shipped: print:px-0 stripped the sheet's padding
    // while @page margins did not apply, putting text on the paper edge.
    const box = await page.locator("article").first().evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        left: parseFloat(cs.paddingLeft),
        right: parseFloat(cs.paddingRight),
        width: r.width,
      };
    });

    expect(box.left).toBeGreaterThanOrEqual(MARGIN_PX - 1);
    expect(box.right).toBeGreaterThanOrEqual(MARGIN_PX - 1);
    expect(box.width).toBeLessThanOrEqual(A4_WIDTH_PX + 1);
  });

  test("no content spills past the printable width", async ({ page }) => {
    const worst = await page.evaluate((limit) => {
      let overflow = 0;
      for (const el of Array.from(document.querySelectorAll("article *"))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && getComputedStyle(el).visibility !== "hidden") {
          overflow = Math.max(overflow, r.right - limit);
        }
      }
      return overflow;
    }, A4_WIDTH_PX - MARGIN_PX);

    expect(worst).toBeLessThanOrEqual(1);
  });

  test("prints on an A4 page box", async ({ page }) => {
    fs.mkdirSync(PDF_DIR, { recursive: true });
    const file = path.join(PDF_DIR, "contract-ko.pdf");
    await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });

    const pdf = fs.readFileSync(file);
    expect(pdf.byteLength).toBeGreaterThan(1000);

    // Page box in PDF points (1pt = 1/72in). A4 is 595 x 842pt. Only the page
    // box is asserted here — text placement is checked against the DOM above,
    // where coordinates are unambiguous.
    const mediaBox = pdf
      .toString("latin1")
      .match(/\/MediaBox\s*\[\s*([\d.\s-]+)\]/);
    expect(mediaBox).not.toBeNull();
    const [, , width, height] = mediaBox![1].trim().split(/\s+/).map(Number);
    expect(width).toBeGreaterThan(590);
    expect(width).toBeLessThan(600);
    expect(height).toBeGreaterThan(835);
    expect(height).toBeLessThan(848);
  });
});

test("the English contract keeps its margins too", async ({ page }) => {
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.goto("/test/document-print?type=contract&lang=en");
  await page.emulateMedia({ media: "print" });

  const padding = await page
    .locator("article")
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
  expect(padding).toBeGreaterThanOrEqual(MARGIN_PX - 1);
});
