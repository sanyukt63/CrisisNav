# Offline Testing Checklist

CrisisNav is intended to keep core guidance available when connectivity is unreliable.

## Test procedure

1. Start with a clean browser session.
2. Load the application while connected.
3. Visit the core protocol pages that should be cached.
4. Disable network access.
5. Reload the application.
6. Verify the app shell and cached protocol content remain usable.
7. Restore connectivity and confirm normal navigation resumes.

## Watch for

- Missing cached assets
- Broken navigation while offline
- Stale or incomplete protocol content
- Service-worker update errors
- UI states that assume a network connection

Emergency software should be tested carefully, and the application must not be treated as a replacement for official emergency services.
