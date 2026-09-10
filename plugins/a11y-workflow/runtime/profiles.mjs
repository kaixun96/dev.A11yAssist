export function validateProfileReceipt(profile, receipt) {
  if (profile !== 'agentow-odsp' || receipt.outcome !== 'pass') return;
  const gates = receipt.gates ?? {};
  if (receipt.stage === 'source' && !(receipt.entrypoint === '/agentow-a11y' &&
    receipt.model === 'gpt-6-astra' &&
    ['codespaceOwned', 'freshnessVerifiedOnExecutionHost', 'agentowA11yMode', 'effectiveModelVerified'].every(gate => gates[gate] === true))) {
    throw new Error('AgentOW profile requires its A11y entrypoint, model, exclusive Codespace and freshness gates');
  }
  if (receipt.stage === 'after' && gates.codespaceOwned !== true) {
    throw new Error('AgentOW profile requires continued exclusive Codespace ownership');
  }
  if (receipt.stage === 'cleanup' && gates.codespaceReleased !== true) {
    throw new Error('AgentOW profile requires token-bound Codespace release');
  }
}
