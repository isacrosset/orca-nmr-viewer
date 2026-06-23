# Release process

1. Update the version and build number in `Resources/Info.plist`.
2. Update `CHANGELOG.md` and prepare release notes.
3. Run:

   ```sh
   swift test
   ./build-app.sh
   ```

4. Create a clean application ZIP that preserves macOS metadata.
5. Verify the extracted application's code signature and architecture.
6. Generate `SHA256SUMS.txt`.
7. Commit the changes and create a version tag:

   ```sh
   git tag -a v0.5.0 -m "ORCA NMR Viewer 0.5.0"
   git push origin main --tags
   ```

8. On GitHub, create a Release from the tag and upload:

   - `ORCA-NMR-Viewer-macOS-arm64.zip`
   - `SHA256SUMS.txt`

9. Paste the matching release-notes file into the Release description.

Public distribution without a Gatekeeper warning requires signing with an
Apple Developer ID certificate and notarizing the application.

Repository: https://github.com/isacrosset/orca-nmr-viewer
