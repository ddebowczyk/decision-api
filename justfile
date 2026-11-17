set dotenv-load := true
set positional-arguments := true

api := "packages/api"

# list recipes
default:
    @just --list

# install dependencies
install:
    pnpm install

# type-check the library, tests and examples
check:
    cd {{api}} && pnpm exec tsc -p tsconfig.json --noEmit

# run the offline test suite
test *args:
    cd {{api}} && pnpm exec vitest run "$@"

# check + test: the gate for every step
gate: check test

# opt-in live tests against real provider APIs (uses .env; costs money)
live *args:
    cd {{api}} && pnpm exec vitest run --config vitest.live.config.ts "$@"

# run an example, e.g. `just example triage`
example name:
    cd {{api}} && node --env-file-if-exists=../../.env examples/{{name}}.ts
