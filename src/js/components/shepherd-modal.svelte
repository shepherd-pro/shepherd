<script>
  import { uuid } from '../utils/general.js';
  import { makeOverlayPath } from '../utils/overlay-path.js';

  export let element, openingProperties;
  const guid = uuid();
  let modalIsVisible = false;
  let rafId = undefined;
  let pathDefinition;

  $: pathDefinition = makeOverlayPath(openingProperties);

  closeModalOpening();

  export const getElement = () => element;

  export function closeModalOpening() {
    openingProperties = {
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      r: 0
    };
  }

  /**
   * Hide the modal overlay
   */
  export function hide() {
    modalIsVisible = false;

    // Ensure we cleanup all event listeners when we hide the modal
    _cleanupStepEventListeners();
  }

  /**
   * Uses the bounds of the element we want the opening overtop of to set the dimensions of the opening and position it
   * @param {Number} modalOverlayOpeningPadding An amount of padding to add around the modal overlay opening
   * @param {Number} modalOverlayOpeningRadius An amount of border radius to add around the modal overlay opening
   * @param {Number} modalOverlayOpeningXOffset An amount to offset the modal overlay opening in the x-direction
   * @param {Number} modalOverlayOpeningYOffset An amount to offset the modal overlay opening in the y-direction
   * @param {HTMLElement} scrollParent The scrollable parent of the target element
   * @param {HTMLElement} targetElement The element the opening will expose
   */
  export function positionModal(
    modalOverlayOpeningPadding = 0,
    modalOverlayOpeningRadius = 0,
    modalOverlayOpeningXOffset = 0,
    modalOverlayOpeningYOffset = 0,
    scrollParent,
    targetElement
  ) {
    if (targetElement) {
      const { y, height } = _getVisibleHeight(targetElement, scrollParent);
      const { x, width, left } = targetElement.getBoundingClientRect();

      // getBoundingClientRect is not consistent. Some browsers use x and y, while others use left and top
      openingProperties = {
        width: width + modalOverlayOpeningPadding * 2,
        height: height + modalOverlayOpeningPadding * 2,
        x: (x || left) + modalOverlayOpeningXOffset - modalOverlayOpeningPadding,
        y: y + modalOverlayOpeningYOffset - modalOverlayOpeningPadding,
        r: modalOverlayOpeningRadius
      };
    } else {
      closeModalOpening();
    }
  }

  /**
   * If modal is enabled, setup the svg mask opening and modal overlay for the step
   * @param {Step} step The step instance
   */
  export function setupForStep(step) {
    // Ensure we move listeners from the previous step, before we setup new ones
    _cleanupStepEventListeners();

    if (step.tour.options.useModalOverlay) {
      _styleForStep(step);
      show();
    } else {
      hide();
    }
  }

  /**
   * Show the modal overlay
   */
  export function show() {
    modalIsVisible = true;
  }

  const _preventModalBodyTouch = (e) => {
    e.preventDefault();
  };

  const _preventModalOverlayTouch = (e) => {
    e.stopPropagation();
  };

  /**
   * Add touchmove event listener
   * @private
   */
  function _addStepEventListeners() {
    // Prevents window from moving on touch.
    window.addEventListener('touchmove', _preventModalBodyTouch, {
      passive: false
    });
  }

  /**
   * Cancel the requestAnimationFrame loop and remove touchmove event listeners
   * @private
   */
  function _cleanupStepEventListeners() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }

    window.removeEventListener('touchmove', _preventModalBodyTouch, {
      passive: false
    });
  }

  /**
   * Style the modal for the step
   * @param {Step} step The step to style the opening for
   * @private
   */
  function _styleForStep(step) {
    const {
      modalOverlayOpeningPadding,
      modalOverlayOpeningRadius,
      modalOverlayOpeningXOffset,
      modalOverlayOpeningYOffset
    } = step.options;

    const scrollParent = _getScrollParent(step.target);

    // Setup recursive function to call requestAnimationFrame to update the modal opening position
    const rafLoop = () => {
      rafId = undefined;
      positionModal(
        modalOverlayOpeningPadding,
        modalOverlayOpeningRadius,
        modalOverlayOpeningXOffset,
        modalOverlayOpeningYOffset,
        scrollParent,
        step.target
      );
      rafId = requestAnimationFrame(rafLoop);
    };

    rafLoop();

    _addStepEventListeners();
  }

  /**
   * Find the closest scrollable parent element
   * @param {HTMLElement} element The target element
   * @returns {HTMLElement}
   * @private
   */
  function _getScrollParent(element) {
    if (!element) {
      return null;
    }

    const isHtmlElement = element instanceof HTMLElement;
    const overflowY =
      isHtmlElement && window.getComputedStyle(element).overflowY;
    const isScrollable = overflowY !== 'hidden' && overflowY !== 'visible';

    if (isScrollable && element.scrollHeight >= element.clientHeight) {
      return element;
    }

    return _getScrollParent(element.parentElement);
  }

  /**
   * Get the visible height of the target element relative to its scrollParent.
   * If there is no scroll parent, the height of the element is returned.
   *
   * @param {HTMLElement} element The target element
   * @param {HTMLElement} [scrollParent] The scrollable parent element
   * @returns {{y: number, height: number}}
   * @private
   */
  function _getVisibleHeight(element, scrollParent) {
    const elementRect = element.getBoundingClientRect();
    let top = elementRect.y || elementRect.top;
    let bottom = elementRect.bottom || top + elementRect.height;

    if (scrollParent) {
      const scrollRect = scrollParent.getBoundingClientRect();
      const scrollTop = scrollRect.y || scrollRect.top;
      const scrollBottom = scrollRect.bottom || scrollTop + scrollRect.height;

      top = Math.max(top, scrollTop);
      bottom = Math.min(bottom, scrollBottom);
    }

    const height = Math.max(bottom - top, 0); // Default to 0 if height is negative

    return { y: top, height };
  }
</script>

<svg
  bind:this={element}
  class={`${
    modalIsVisible ? 'shepherd-modal-is-visible' : ''
  } shepherd-modal-overlay-container`}
  on:touchmove={_preventModalOverlayTouch}
>
  <path d={pathDefinition} />
</svg>

<style global>
  .shepherd-modal-overlay-container {
    height: 0;
    left: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    position: fixed;
    top: 0;
    transition: all 0.3s ease-out, height 0ms 0.3s, opacity 0.3s 0ms;
    width: 100vw;
    z-index: 9997;
  }

  .shepherd-modal-overlay-container.shepherd-modal-is-visible {
    height: 100vh;
    opacity: 0.5;
    transition: all 0.3s ease-out, height 0s 0s, opacity 0.3s 0s;
    transform: translateZ(0);
  }

  .shepherd-modal-overlay-container.shepherd-modal-is-visible path {
    pointer-events: all;
  }
</style>
