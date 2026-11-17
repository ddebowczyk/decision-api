# Repository operations

Run these from the repository root.

| Command | Result |
| --- | --- |
| `just version` | Show the package version and verify its exported value |
| `just version bump minor` | Increase the minor version in the manifest and exported value. Also accepts `major` and `patch` |
| `just version set 0.3.0` | Set an explicit stable version |
| `just gate` | Typecheck and run the offline suite |
| `just package` | Build the JavaScript and declaration tarball in `dist/`. Pass a directory to change the destination |
| `just release` | Verify the clean, pushed default branch, check the package, create its tag, and publish the verified tarball to GitHub Releases. Pass a Markdown file to supply release notes |

Commit and push the version bump before running `just release`. The command
targets the GitHub repository configured as `origin`, checks that the tag points
at the local commit, and verifies the uploaded archive. Rerunning against the
same commit and package bytes resumes a matching draft or verifies a published
release. The command leaves GitHub repository visibility as configured.

The tarball is `@decisions/api` with JavaScript and TypeScript declarations for
its three entry points. Install the downloaded asset with
`pnpm add ./decisions-api-<version>.tgz effect@4.1.3`.
