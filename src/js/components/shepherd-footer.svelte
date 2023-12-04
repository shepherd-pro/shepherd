<script>
  import ShepherdButton from './shepherd-button.svelte';

  export let step;

  $: buttons = step.options.buttons;
</script>

<footer class="shepherd-footer">
  {#if buttons}
    {#each buttons as config}
      <ShepherdButton {config} {step} />
    {/each}
  {/if}
</footer>

<style global>
  .shepherd-footer {
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    display: flex;
    justify-content: flex-end;
    padding: 0 0.75rem 0.75rem;
  }

  .shepherd-footer .shepherd-button:last-child {
    margin-right: 0;
  }
</style>
