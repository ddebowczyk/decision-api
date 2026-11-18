set dotenv-load := true
set positional-arguments := true

mod ops

api := "packages/api"

# list recipes
default:
    @just --list --list-submodules

# install dependencies
install:
    pnpm install

# type-check the library, tests and examples
check: ops::quality::check

# run the offline test suite
test *args:
    @just ops quality test "$@"

# check + test: the gate for every step
gate: ops::quality::gate

# opt-in live tests against real provider APIs (uses .env; costs money)
live *args:
    @just ops quality live "$@"

# run an example, e.g. `just example triage`
example name:
    cd {{api}} && node --env-file-if-exists=../../.env examples/{{name}}.ts

# Show, check, set, or bump the package version.
version *args:
    node ops/version/version.mjs "$@"

# Build an installable JavaScript and TypeScript declaration archive.
package destination="dist":
    @just ops package build "$@"

# Publish the current version and compiled package to the GitHub release for origin.
release *args:
    @just ops release publish "$@"
