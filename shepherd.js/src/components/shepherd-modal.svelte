<script>
  import { makeOverlayPath } from '../utils/overlay-path.ts';

  export let element, openingProperties;
  let modalIsVisible = false;
  let rafId = undefined;
  let pathDefinition;

  $: pathDefinition = makeOverlayPath(openingProperties);

  closeModalOpening();

  export const getElement = () => element;

  export function closeModalOpening() {
    openingProperties = [
      {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        r: 0
      }
    ];
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
   * @param {Number | { topLeft: Number, bottomLeft: Number, bottomRight: Number, topRight: Number }} modalOverlayOpeningRadius An amount of border radius to add around the modal overlay opening
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
    targetElement,
    extraHighlights
  ) {
    if (targetElement) {
      const elementsToHighlight = [targetElement, ...(extraHighlights || [])];
      openingProperties = [];

      for (const element of elementsToHighlight) {
        if (!element) continue;

        // Skip duplicate elements
        if (
          elementsToHighlight.indexOf(element) !==
          elementsToHighlight.lastIndexOf(element)
        ) {
          continue;
        }

        const { y, height } = _getVisibleHeight(element, scrollParent);
        const { x, width, left } = element.getBoundingClientRect();

        // Check if the element is contained by another element
        const isContained = elementsToHighlight.some((otherElement) => {
          if (otherElement === element) return false;
          const otherRect = otherElement.getBoundingClientRect();
          return (
            x >= otherRect.left &&
            x + width <= otherRect.right &&
            y >= otherRect.top &&
            y + height <= otherRect.bottom
          );
        });

        if (isContained) continue;

        // getBoundingClientRect is not consistent. Some browsers use x and y, while others use left and top
        openingProperties.push({
          width: width + modalOverlayOpeningPadding * 2,
          height: height + modalOverlayOpeningPadding * 2,
          x:
            (x || left) +
            modalOverlayOpeningXOffset -
            modalOverlayOpeningPadding,
          y: y + modalOverlayOpeningYOffset - modalOverlayOpeningPadding,
          r: modalOverlayOpeningRadius
        });
      }
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
      modalOverlayOpeningXOffset = 0,
      modalOverlayOpeningYOffset = 0
    } = step.options;

    const iframeOffset = _getIframeOffset(step.target);
    const scrollParent = _getScrollParent(step.target);

    // Setup recursive function to call requestAnimationFrame to update the modal opening position
    const rafLoop = () => {
      rafId = undefined;
      positionModal(
        modalOverlayOpeningPadding,
        modalOverlayOpeningRadius,
        modalOverlayOpeningXOffset + iframeOffset.left,
        modalOverlayOpeningYOffset + iframeOffset.top,
        scrollParent,
        step.target,
        step._resolvedExtraHighlightElements
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
   * Get the top and left offset required to position the modal overlay cutout
   * when the target element is within an iframe
   * @param {HTMLElement} element The target element
   * @private
   */
  function _getIframeOffset(element) {
    let offset = {
      top: 0,
      left: 0
    };

    if (!element) {
      return offset;
    }

    let targetWindow = element.ownerDocument.defaultView;

    while (targetWindow !== window.top) {
      const targetIframe = targetWindow?.frameElement;

      if (targetIframe) {
        const targetIframeRect = targetIframe.getBoundingClientRect();

        offset.top += targetIframeRect.top + (targetIframeRect.scrollTop ?? 0);
        offset.left +=
          targetIframeRect.left + (targetIframeRect.scrollLeft ?? 0);
      }

      targetWindow = targetWindow.parent;
    }

    return offset;
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
    transition:
      all 0.3s ease-out,
      height 0ms 0.3s,
      opacity 0.3s 0ms;
    width: 100vw;
    z-index: 9997;
  }

  .shepherd-modal-overlay-container.shepherd-modal-is-visible {
    height: 100vh;
    opacity: 0.5;
    transition:
      all 0.3s ease-out,
      height 0s 0s,
      opacity 0.3s 0s;
    transform: translateZ(0);
  }

  .shepherd-modal-overlay-container.shepherd-modal-is-visible path {
    pointer-events: all;
  }
</style>
