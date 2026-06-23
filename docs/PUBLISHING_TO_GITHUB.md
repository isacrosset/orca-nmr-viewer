# Publishing to GitHub

## Create the repository

1. Sign in to GitHub.
2. Select **New repository**.
3. Use a name such as `orca-nmr-viewer`.
4. Set the repository to **Public**.
5. Do not add a README, license, or `.gitignore on GitHub`; they already exist
   locally.
6. Create the repository and copy its HTTPS address.

## Publish from Terminal

From the project directory, configure the identity that should appear in the
commit:

```sh
git init -b main
git config user.name "Your Name"
git config user.email "your-public-email@example.com"
git add .
```

GitHub supports a private `noreply` address in account email settings.

Create the first commit and publish it:

```sh
git commit -m "Initial public release"
git remote add origin https://github.com/isacrosset/orca-nmr-viewer.git
git push -u origin main
```

GitHub may ask you to authenticate through the browser or use a personal access
token. Account passwords are not accepted for Git operations over HTTPS.

## Publish release 0.5.0

Follow `outputs/GitHub-Release-v0.5.0/UPLOAD_INSTRUCTIONS.txt` and upload the
application ZIP and checksum from that folder.

## Recommended repository settings

- Enable Issues.
- Enable Discussions if user support is expected.
- Enable vulnerability reporting under Security.
- Add repository topics such as:
  `orca`, `nmr`, `computational-chemistry`, `swift`, `macos`, `apple-silicon`.
- Add a short description:
  `Native macOS viewer for ORCA NMR shieldings, chemical shifts and couplings.`
