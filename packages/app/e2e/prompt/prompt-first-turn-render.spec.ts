import { test, expect } from "../fixtures"
import { promptSelector } from "../selectors"

test("new session first prompt renders in the timeline without refresh", async ({ page, sdk, gotoSession }) => {
  test.setTimeout(120_000)

  await gotoSession()

  const token = `E2E_FIRST_TURN_${Date.now()}`
  const prompt = page.locator(promptSelector)

  await prompt.click()
  await page.keyboard.type(token)
  await page.keyboard.press("Enter")

  await expect(page).toHaveURL(/\/session\/[^/?#]+/, { timeout: 30_000 })
  await expect(page.getByText("Build anything")).toHaveCount(0)
  await expect(page.getByText(token, { exact: true }).first()).toBeVisible({ timeout: 10_000 })

  const sessionID = /\/session\/([^/?#]+)/.exec(page.url())?.[1]
  if (!sessionID) throw new Error(`Failed to parse session id from url: ${page.url()}`)

  await expect
    .poll(
      async () => {
        const messages = await sdk.session.messages({ sessionID, limit: 20 }).then((r) => r.data ?? [])
        return messages.some((item) => item.info.role === "assistant")
      },
      { timeout: 90_000 },
    )
    .toBe(true)
})
