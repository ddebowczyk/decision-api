# Upstage / Solar Decide

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Upstage documents Solar Decide as a beta decision endpoint on Solar Mini 4, using the same `/v1/systemone` schema as Jev. It returns Noul, Choice, and Score answers with probabilities rather than prose. The native model is `solar-decide`; OpenRouter lists `upstage/solar-decide`.

The model page quotes a 512K context window, $0.10/M input tokens, and free output, and emphasizes Korean-language understanding. The provider page says API input is not used for training and is not stored unless needed for service delivery and explicitly stated. Those statements are documentation claims, not a contractual compliance assessment.

The captured model page is primarily a model overview rather than a complete HTTP reference. It establishes the intended schema and model, but does not establish every transport URL, question limit, or independent-question guarantee. Do not invent a complete production contract from the 512K headline. The native model page and router listing can have different prices or deployment restrictions.

Assessment: relevant for Korean and larger state inputs. Authentication, exact native transport configuration, and application accuracy still require validation before integration.

## Sources and local captures

- [Native model docs](https://console.upstage.ai/docs/models/solar-decide) · [local capture](../sources/upstage/solar-decide.md)
- [Router listing](https://openrouter.ai/upstage/solar-decide) · [local capture](../sources/openrouter/upstage--solar-decide.md)
