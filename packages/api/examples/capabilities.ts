/** Static discovery and an application-owned runtime override; no keys or HTTP. */
import { Effect, Result, Schema } from "effect"
import { Capabilities, Decision, Planner, Q } from "@decisions/api"
import { Provider } from "@decisions/api/providers"

const catalog = Capabilities.override(Capabilities.builtIn, "levanto", "levanto-sage-2", {
  version: "my-configuration-1",
  verification: "unknown",
  capabilities: { limits: { questionsPerCall: { value: 1, evidence: "conservative-bound" } } },
  features: { "my-app.audit": { support: "supported", adapterSupport: "unknown", constraints: { region: "eu" } } }
})

// The same data can be stored in JSON and decoded at the application boundary.
const metadata: unknown = JSON.parse(JSON.stringify(catalog))
const validated = Result.getOrThrow(Capabilities.decode(metadata))
const provider = Provider.levanto({ capabilities: validated })
const definition = Decision.make("capabilities-demo", {
  revision: "1",
  input: Schema.String,
  questions: [["safe", Q.boolean("Safe to publish?")], ["urgent", Q.boolean("Urgent?")]]
})

Effect.runSync(Effect.gen(function*() {
  const prepared = yield* Decision.prepare(definition, "Please fix the outage immediately.")
  const plan = Result.getOrThrow(Planner.plan(prepared, provider.deployment, {
    model: provider.model, capabilities: [provider.capabilities]
  }))
  console.log(JSON.stringify({
    provider: provider.capabilities.provider,
    model: provider.capabilities.model,
    questionsPerCall: provider.capabilities.capabilities.limits.questionsPerCall,
    calls: plan.calls.length,
    capabilityFingerprint: Capabilities.fingerprint(plan.capabilities)
  }, null, 2))
}))
