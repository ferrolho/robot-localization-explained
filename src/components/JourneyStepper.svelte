<script lang="ts">
  import { STAGES } from '../lib/stages';

  interface Props {
    activeStage: number;
    onStageChange: (stage: number) => void;
  }
  let { activeStage, onStageChange }: Props = $props();

  let currentStage = $derived(STAGES[activeStage - 1]);
</script>

<div class="stepper">
  {#each STAGES as stage, i}
    {#if i > 0}
      <div class="stepper-line" class:completed={activeStage >= stage.id}></div>
    {/if}
    <button
      class="stepper-node"
      class:active={activeStage === stage.id}
      class:completed={activeStage > stage.id}
      class:coming-soon={stage.comingSoon}
      onclick={() => onStageChange(stage.id)}
      title={stage.label}
    >
      {stage.id}
    </button>
  {/each}
</div>

<div class="stage-info">
  <div class="stage-label">
    {currentStage.label}
    {#if currentStage.comingSoon}
      <span class="coming-soon-badge">Coming Soon</span>
    {/if}
  </div>
  <div class="stage-description">{currentStage.description}</div>
</div>

<style>
  .stepper {
    display: flex;
    align-items: center;
    padding: 4px 0;
  }

  .stepper-line {
    flex: 1;
    height: 2px;
    background: var(--border);
    transition: background 0.2s;
  }

  .stepper-line.completed {
    background: var(--accent);
  }

  .stepper-node {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .stepper-node:hover {
    border-color: var(--accent);
    color: var(--text);
  }

  .stepper-node.active {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  .stepper-node.completed {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
    opacity: 0.6;
  }

  .stepper-node.coming-soon {
    border-style: dashed;
    opacity: 0.5;
  }

  .stage-info {
    margin-top: 6px;
  }

  .stage-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .coming-soon-badge {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--border);
    padding: 1px 6px;
    border-radius: 3px;
  }

  .stage-description {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.4;
    margin-top: 2px;
  }
</style>
