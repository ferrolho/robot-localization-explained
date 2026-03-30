<script lang="ts">
  import katex from 'katex';

  interface Props {
    lastStep: 'predict' | 'correct';
  }
  let { lastStep }: Props = $props();

  function renderKatex(latex: string): string {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
  }

  const predictFormulas = [
    { label: 'State', latex: '\\hat{x}_k^- = A\\hat{x}_{k-1} + Bu_k' },
    { label: 'Covariance', latex: 'P_k^- = AP_{k-1}A^T + Q' },
  ];

  const correctFormulas = [
    { label: 'Kalman gain', latex: 'K_k = P_k^- H^T(HP_k^- H^T + R)^{-1}' },
    { label: 'State', latex: '\\hat{x}_k = \\hat{x}_k^- + K_k(z_k - H\\hat{x}_k^-)' },
    { label: 'Covariance', latex: 'P_k = (I - K_kH)P_k^-' },
  ];
</script>

<div class="formula-section" class:active={lastStep === 'predict'}>
  <div class="formula-header">Predict</div>
  {#each predictFormulas as f}
    <div class="formula-row">
      <span class="formula-label">{f.label}</span>
      <span class="formula-math">{@html renderKatex(f.latex)}</span>
    </div>
  {/each}
</div>

<div class="formula-section" class:active={lastStep === 'correct'}>
  <div class="formula-header">Correct</div>
  {#each correctFormulas as f}
    <div class="formula-row">
      <span class="formula-label">{f.label}</span>
      <span class="formula-math">{@html renderKatex(f.latex)}</span>
    </div>
  {/each}
</div>

<style>
  .formula-section {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid var(--border);
    opacity: 0.5;
    transition: opacity 0.2s, border-color 0.2s;
  }

  .formula-section.active {
    opacity: 1;
    border-color: var(--accent);
  }

  .formula-header {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent);
    margin-bottom: 6px;
  }

  .formula-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 6px;
  }

  .formula-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .formula-math {
    font-size: 14px;
    overflow-x: auto;
  }

  .formula-math :global(.katex) {
    font-size: 0.9em;
    color: var(--text);
  }
</style>
