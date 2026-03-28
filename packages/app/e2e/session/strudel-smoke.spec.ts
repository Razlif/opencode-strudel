import type { Page } from "@playwright/test"
import { test, expect } from "../fixtures"
import { smoke } from "../strudel"

const editor = (page: Page) => page.getByTestId("strudel-editor")
const play = (page: Page) => page.getByTestId("strudel-play")
const toggle = (page: Page) => page.getByTestId("strudel-console-toggle")
const lines = (page: Page) => page.getByTestId("strudel-console-line")

async function open(page: Page) {
  await expect(page.getByTestId("strudel-bar")).toBeVisible()
  await expect(page.getByTestId("strudel-ready")).toBeVisible({ timeout: 30_000 })
  await toggle(page).click()
  await expect(page.getByTestId("strudel-console")).toBeVisible()
}

async function log(page: Page) {
  return (await lines(page).allTextContents()).join("\n")
}

async function text(page: Page, id: string) {
  return ((await page.getByTestId(id).textContent()) ?? "").trim()
}

async function waitLog(page: Page, token: string) {
  await expect.poll(() => log(page), { timeout: 30_000 }).toContain(token)
}

test.describe("strudel smoke", () => {
  for (const item of smoke) {
    test(item.name, async ({ page, withProject }) => {
      await page.setViewportSize({ width: 1440, height: 900 })

      await withProject(async ({ gotoSession }) => {
        await gotoSession()
        await open(page)

        await editor(page).click()
        await editor(page).fill(item.code)
        await play(page).click()

        await expect.poll(() => text(page, "strudel-state"), { timeout: 30_000 }).toBe("playing")
        await expect.poll(() => text(page, "strudel-msg"), { timeout: 30_000 }).toContain("Playing")

        if (item.miss) {
          await waitLog(page, item.token ?? "sound ")
          return
        }

        await expect.poll(() => log(page), { timeout: 30_000 }).not.toContain("not found")
      })
    })
  }
})
