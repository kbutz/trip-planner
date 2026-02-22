from playwright.sync_api import sync_playwright, expect

def verify_edinburgh_section():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:3000")

        # Wait for the destination list to load
        # We expect "Edinburgh" to be in the list
        edinburgh_item = page.locator("#destination-list li h3:has-text('Edinburgh')")
        expect(edinburgh_item).to_be_visible(timeout=10000)

        # Click on Edinburgh to see details
        edinburgh_item.click()

        # Verify details are shown
        # Check for banner image
        expect(page.locator(".city-banner")).to_be_visible()
        # Check for specific text from Edinburgh data
        # We use .first() because the description text appears in both description and historical context
        expect(page.locator("text=Castle Rock and Arthur's Seat").first).to_be_visible()

        # Take a screenshot
        page.screenshot(path="verification_edinburgh.png")

        print("Verification successful: Edinburgh found and rendered.")

        browser.close()

if __name__ == "__main__":
    verify_edinburgh_section()
