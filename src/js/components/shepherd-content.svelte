<script>
  import ShepherdFooter from './shepherd-footer.svelte';
  import ShepherdHeader from './shepherd-header.svelte';
  import ShepherdText from './shepherd-text.svelte';
  import { isUndefined } from '../utils/type-check.js';

  export let descriptionId, labelId, step;
</script>

<div class="shepherd-content">
  {#if !isUndefined(step.options.title) || (step.options.cancelIcon && step.options.cancelIcon.enabled)}
    <ShepherdHeader {labelId} {step} />
  {/if}

  {#if !isUndefined(step.options.text)}
    <ShepherdText {descriptionId} {step} />
  {/if}

  {#if Array.isArray(step.options.buttons) && step.options.buttons.length}
    <ShepherdFooter {step} />
  {/if}
</div>

<style global>
  .shepherd-content {
    border-radius: 5px;
    outline: none;
    padding: 0;
  }
</style>
