# Offline Cache Strategy

CrisisNav depends on cached application resources when connectivity is unavailable.

## Cache priorities

1. Application shell
2. Core emergency protocol content
3. Navigation and localization resources
4. Optional assets

## Update behavior

A cache update should not make the existing working application unavailable. Test first-load caching, offline reload, stale content replacement, and recovery after connectivity returns.

Emergency content should have a clear versioning strategy so users can distinguish updated resources from older cached resources.
