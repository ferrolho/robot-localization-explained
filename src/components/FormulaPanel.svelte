<script lang="ts">
  import katex from 'katex';

  interface Props {
    activeSteps: { predicted: boolean; corrected: boolean };
  }
  let { activeSteps }: Props = $props();

  /** Wrap a LaTeX term in \htmlClass so we can attach tooltips. */
  function tip(cls: string, latex: string): string {
    return `\\htmlClass{tip tip-${cls}}{${latex}}`;
  }

  function renderKatex(latex: string): string {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
      trust: true,
      strict: false,
    });
  }

  const predictFormulas = [
    {
      label: 'State',
      latex: `${tip('xhat-prior', '\\hat{x}_k^-')} = ${tip('A', 'A')}${tip('xhat-prev', '\\hat{x}_{k-1}')} + ${tip('B', 'B')}${tip('u', 'u_k')}`,
    },
    {
      label: 'Covariance',
      latex: `${tip('P-prior', 'P_k^-')} = ${tip('A', 'A')}${tip('P-prev', 'P_{k-1}')}${tip('A', 'A^T')} + ${tip('Q', 'Q')}`,
    },
  ];

  const correctFormulas = [
    {
      label: 'Kalman gain',
      latex: `${tip('K', 'K_k')} = ${tip('P-prior', 'P_k^-')}${tip('H', 'H^T')}(${tip('H', 'H')}${tip('P-prior', 'P_k^-')}${tip('H', 'H^T')} + ${tip('R', 'R')})^{-1}`,
    },
    {
      label: 'State',
      latex: `${tip('xhat', '\\hat{x}_k')} = ${tip('xhat-prior', '\\hat{x}_k^-')} + ${tip('K', 'K_k')}(${tip('z', 'z_k')} - ${tip('H', 'H')}${tip('xhat-prior', '\\hat{x}_k^-')})`,
    },
    {
      label: 'Covariance',
      latex: `${tip('P', 'P_k')} = (${tip('I', 'I')} - ${tip('K', 'K_k')}${tip('H', 'H')})${tip('P-prior', 'P_k^-')}`,
    },
  ];

  const tooltips: Record<string, string> = {
    'xhat-prior': 'Prior state estimate (before correction)',
    'xhat-prev': 'Previous posterior state estimate',
    'xhat': 'Posterior state estimate (after correction)',
    'A': 'State transition matrix (Jacobian F in our EKF)',
    'B': 'Control input matrix',
    'u': 'Control input (encoder v, ω)',
    'P-prior': 'Prior covariance (before correction)',
    'P-prev': 'Previous posterior covariance',
    'P': 'Posterior covariance (after correction)',
    'Q': 'Process noise covariance',
    'K': 'Kalman gain — weights correction vs prediction',
    'H': 'Observation matrix — maps state to measurement space',
    'R': 'Measurement noise covariance',
    'z': 'Measurement vector (sensor reading)',
    'I': 'Identity matrix',
  };

  let tooltipText = $state('');
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let tooltipVisible = $state(false);

  function attachTooltips(node: HTMLElement) {
    function onEnter(e: Event) {
      const el = (e.target as HTMLElement).closest('.tip') as HTMLElement | null;
      if (!el) return;
      for (const [cls, text] of Object.entries(tooltips)) {
        if (el.classList.contains(`tip-${cls}`)) {
          const rect = el.getBoundingClientRect();
          tooltipX = rect.left + rect.width / 2;
          tooltipY = rect.top;
          tooltipText = text;
          tooltipVisible = true;
          return;
        }
      }
    }

    function onLeave(e: Event) {
      const el = (e.target as HTMLElement).closest('.tip');
      if (el) tooltipVisible = false;
    }

    node.addEventListener('mouseover', onEnter);
    node.addEventListener('mouseout', onLeave);

    return {
      destroy() {
        node.removeEventListener('mouseover', onEnter);
        node.removeEventListener('mouseout', onLeave);
      },
    };
  }
</script>

{#if tooltipVisible}
  <div class="tooltip" style="left: {tooltipX}px; top: {tooltipY}px;">
    {tooltipText}
  </div>
{/if}

<div class="formula-wrapper" use:attachTooltips>
  <div class="formula-section" class:active={activeSteps.predicted}>
    <div class="formula-header">Predict</div>
    {#each predictFormulas as f}
      <div class="formula-row">
        <span class="formula-label">{f.label}</span>
        <span class="formula-math">{@html renderKatex(f.latex)}</span>
      </div>
    {/each}
  </div>

  <div class="formula-section" class:active={activeSteps.corrected}>
    <div class="formula-header">Correct</div>
    {#each correctFormulas as f}
      <div class="formula-row">
        <span class="formula-label">{f.label}</span>
        <span class="formula-math">{@html renderKatex(f.latex)}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .tooltip {
    position: fixed;
    transform: translate(-50%, -100%) translateY(-6px);
    padding: 4px 10px;
    font-size: 11px;
    color: var(--text);
    background: var(--bg-secondary, #2a2a3e);
    border: 1px solid var(--border);
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 100;
  }

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

  .formula-math :global(.tip) {
    cursor: help;
    border-radius: 2px;
    transition: background 0.15s;
  }

  .formula-math :global(.tip:hover) {
    background: rgba(255, 255, 255, 0.08);
  }
</style>
