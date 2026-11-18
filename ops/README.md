# Repository operations

Run `just ops` to list every operations command. Run a module name on its own,
such as `just ops release`, to see its commands and arguments. Each module
owns its justfile and implementation. The root justfile also provides shortcuts.

| Module | Commands | Root shortcuts |
| --- | --- | --- |
| [Version](version/justfile) | `just ops version show`, `check`, `bump <major\|minor\|patch>`, `set <version>` | `just version`, `just version bump minor` |
| [Quality](quality/justfile) | `just ops quality check`, `test [filter]`, `gate`, `live [filter]` | `just check`, `just test`, `just gate`, `just live` |
| [Package](package/justfile) | `just ops package build [directory]` | `just package [directory]` |
| [Release](release/justfile) | `just ops release publish [notes-file]` | `just release [notes-file]` |

## Cut a release

1. Run `just ops version bump minor` (or choose `patch` or `major`).
2. Run `just ops quality gate`, then commit and push the version change.
3. Run `just ops release publish` from the clean, pushed default branch. It
   checks the tag, builds the archive, verifies the uploaded bytes and publishes
   the GitHub release. Rerun against the same commit to resume a matching draft.

To build locally, use `just ops package build`. It writes the tarball to
`dist/` by default. Relative output directories and release notes paths resolve
from the repository root. Install a downloaded archive with
`pnpm add ./decisions-api-<version>.tgz effect@4.1.3`.
