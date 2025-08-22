from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:5173/index.html")

    # Click the fab to open the modal
    page.locator('.livechat-fab').click()

    # Wait for the modal to appear
    expect(page.locator('.livechat-modal')).to_be_visible()

    # Type in the chat input to activate the counter
    page.locator('#chatInput').type("Hello")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
