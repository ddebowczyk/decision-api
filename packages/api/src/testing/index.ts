/**
 * Test doubles for code that uses `@decisions/api`:
 * - `FakeEngine`: canned answers, no HTTP; for application tests.
 * - `ScriptedHttp`: ordered HTTP replies and a request log; for engine tests.
 * - `Replies`: provider bodies built from plain values.
 *
 * @since 0.1.0
 */
export * as FakeEngine from "./FakeEngine.ts"
export * as Replies from "./Replies.ts"
export * as ScriptedHttp from "./ScriptedHttp.ts"
