# playwright-self-heal-bot

Automated Playwright workflow runner with Slack failure webhooks (`#bot-alerts`) designed to hand off broken DOM traces and Accessibility tree snapshots to a Devin Bot session for automated selector repair PRs.

## Workflow
1. Scheduled Playwright jobs run e-commerce order & price sync tasks.
2. On `TimeoutError` or schema validation failure, the custom reporter uploads the Trace, ARIA snapshot, and failure log to Slack.
3. Devin Bot picks up the thread, inspects the updated DOM/AXTree, updates the locator, verifies via `npx playwright test`, and opens a PR.
