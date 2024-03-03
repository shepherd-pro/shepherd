<script>
  import ShepherdButton from './shepherd-button.svelte';

  export let step;

  $: buttons = step.options.buttons;
  $: progress = step.options.progress;

  afterUpdate(() => {
    if (isFunction(progress)) {
      progress = progress();
    }

    if (progress) element.innerHTML = progress;
  });
</script>

<style global>
  .shepherd-footer {
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    display: flex;
    flex-direction: column;
    padding: 0 0.75rem 0.75rem;
    width 100%;
  }

  .shepherd-footer .shepherd-button:last-child {
    margin-right: 0;
  }

  .shepherd-button-group {
    display: flex;
    justify-content: flex-end;
    width 100%;
  }
</style>

<footer class="shepherd-footer">
    {#if buttons}
      <div class="shepherd-button-group">
        {#each buttons as config}
          <ShepherdButton
            {config}
            {step}
          />
        {/each}
      </div>
    {/if}
    {#if progress}
      <div
        bind:this={element}
        class="shepherd-progress">
      </div>
    {/if}
</footer>
