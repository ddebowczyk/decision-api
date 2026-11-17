# Microsoft / Microsoft-Decision-1

Researched: 2026-10-17. Evidence: public documentation; no authenticated inference or local model benchmark.

Microsoft-Decision-1 is a decision-scoring model built by post-training Qwen3.5-9B. Microsoft's announcement documents yes/no, multiple-choice, and rating tasks, including rubric grading of responses and agent actions. It is available through Microsoft Foundry and OpenRouter. The announcement quotes $0.042/M input tokens and free output.

The Foundry guide uses `<resource-endpoint>/providers/microsoft/v1/systemone`. Crucially, the request's `model` is the user's deployment name; the returned `model` can identify `microsoft-decision-1`. A portable provider record therefore needs resource URL, deployment name, and authentication configuration separately from the public model name. Foundry supports the deployment and identity workflow described in the captured guide; availability depends on region and deployment type.

Microsoft reports 36-benchmark accuracy and latency comparisons, including Jev. Treat those as Microsoft-reported measurements with the stated benchmark population, not a guarantee on arbitrary applications. The sources captured here do not establish publicly downloadable weights or a self-hosting license.

Assessment: relevant when Azure deployment, identity, and processing-region controls are requirements; the Jev-like payload does not remove the Foundry deployment layer.

## Sources and local captures

- [Launch and pricing](https://commandline.microsoft.com/microsoft-decision-1-model-foundry/) · [local capture](../sources/microsoft/announcement.md)
- [Foundry guide](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-microsoft-decision) · [local capture](../sources/microsoft/foundry-guide.md)
- [Foundry Labs](https://labs.ai.azure.com/innovations/microsoft-decision-1/) · [local capture](../sources/microsoft/foundry-labs.md)
