from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/index.html", timeout=60000)

        # Click the floating action button to open the chat modal
        fab = page.locator('.livechat-fab')
        expect(fab).to_be_visible()
        fab.click()

        # Click the settings button to open the settings modal
        settings_button = page.locator('.livechat-settings-btn')
        expect(settings_button).to_be_visible()
        settings_button.click()

        # Wait for the settings modal to be visible
        settings_modal = page.locator('.livechat-settings-modal')
        expect(settings_modal).to_be_visible()

        # Take a screenshot of the settings modal
        settings_modal_content = page.locator('.livechat-settings-content')
        screenshot_path = "jules-scratch/verification/verification.png"
        settings_modal_content.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
