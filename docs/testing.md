# Walkthrough

# Commands

## Test everything

    npm install

## Rebuild standalone file in `dist/`:

    grunt dist

# Mocha-based

## SinonJS usage

Tests like `helpers.js` use it to avoid running CasperJS.

This allows us to avoid testing CasperJS itself, e.g. by asserting a helper `click()` wrapper actually caused PhantomJS to click a link. Instead we only assert correct use of CasperJS APIs.

* Cost: To continue the above example, we don't know if links really get clicked. And a lot of `beforeEach()` boilerplate may be required to keep tests concise.
* Benefit: Really fast, focused tests. Good speed/confidence ratio.

# CasperJS-based

# Fixtures
