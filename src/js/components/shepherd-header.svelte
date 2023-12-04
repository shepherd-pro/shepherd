<script>
  import ShepherdCancelIcon from './shepherd-cancel-icon.svelte';
  import ShepherdTitle from './shepherd-title.svelte';

  export let labelId, step;
  let title, cancelIcon;

  $: {
    title = step.options.title;
    cancelIcon = step.options.cancelIcon;
  }
</script>

<header class="shepherd-header">
  {#if title}
    <ShepherdTitle {labelId} {title} />
  {/if}

  {#if cancelIcon && cancelIcon.enabled}
    <ShepherdCancelIcon {cancelIcon} {step} />
  {/if}
</header>

<style global>
  .shepherd-header {
    align-items: center;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    display: flex;
    justify-content: flex-end;
    line-height: 2em;
    padding: 0.75rem 0.75rem 0;
  }

  .shepherd-has-title .shepherd-content .shepherd-header {
    background: #e6e6e6;
    padding: 1em;
  }
</style>
