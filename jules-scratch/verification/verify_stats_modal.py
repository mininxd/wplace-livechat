
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173/index.html")

    # Wait for the fab to be visible
    page.wait_for_selector(".livechat-fab", state="visible")

    # Click the fab to open the modal
    page.click(".livechat-fab")

    # Click the stats button
    page.click(".livechat-stats-btn")

    # Wait for the stats modal to be visible
    page.wait_for_selector(".livechat-stats-modal", state="visible")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync__playwright() as playwright:
    run(playwright)
