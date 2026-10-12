# Service Worker Recovery Checks

When updating service-worker behavior, test both first-time installation and upgrades.

- Confirm installation succeeds with a stable connection.
- Confirm a failed cache operation does not leave a broken active app.
- Verify old caches are removed only after the new cache is ready.
- Test offline reload after a successful visit.
- Reconnect and confirm updates can be applied.
- Keep core emergency resources available during recovery.
