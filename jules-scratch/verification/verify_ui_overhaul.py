from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # The dev server is running on localhost:5173
    page.goto("http://localhost:5173")

    # Click the floating action button to open the chat modal
    fab = page.locator('.livechat-fab')
    fab.click()

    # Wait for the modal to be visible
    modal = page.locator('.livechat-modal')
    expect(modal).to_be_visible()

    # Take a screenshot of the modal
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
