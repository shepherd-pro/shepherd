import merge from 'deepmerge';
import { shouldCenterStep } from './general';
import {
  autoUpdate,
  arrow,
  computePosition,
  flip,
  limitShift,
  shift
} from '@floating-ui/dom';

/**
 * Floating UI Options
 *
 * @typedef {object} FloatingUIOptions
 */

/**
 * Determines options for the tooltip and initializes event listeners.
 *
 * @param {Step} step The step instance
 *
 * @return {FloatingUIOptions}
 */
export function setupTooltip(step) {
  if (step.cleanup) {
    step.cleanup();
  }

  const attachToOptions = step._getResolvedAttachToOptions();

  let targets = attachToOptions.element;
  const floatingUIOptions = getFloatingUIOptions(attachToOptions, step);
  const shouldCenter = shouldCenterStep(attachToOptions);

  if (shouldCenter) {
    targets = [document.body];
    const content = step.shepherdElementComponent.getElement();
    content.classList.add('shepherd-centered');
  }

  const cleanup = targets.map((target) =>
    autoUpdate(target, step.el, () => {
      // The element might have already been removed by the end of the tour.
      if (!step.el) {
        step.cleanup();
        return;
      }

      setPosition(target, step, floatingUIOptions, shouldCenter);
    })
  );

  step.cleanup = (...args) => cleanup.forEach((i) => i(...args));

  step.target = attachToOptions.element;

  return floatingUIOptions;
}

/**
 * Merge tooltip options handling nested keys.
 *
 * @param tourOptions - The default tour options.
 * @param options - Step specific options.
 *
 * @return {floatingUIOptions: FloatingUIOptions}
 */
export function mergeTooltipConfig(tourOptions, options) {
  return {
    floatingUIOptions: merge(
      tourOptions.floatingUIOptions || {},
      options.floatingUIOptions || {}
    )
  };
}

/**
 * Cleanup function called when the step is closed/destroyed.
 *
 * @param {Step} step
 */
export function destroyTooltip(step) {
  if (step.cleanup) {
    step.cleanup();
  }

  step.cleanup = null;
}

/**
 *
 * @return {Promise<*>}
 */
function setPosition(target, step, floatingUIOptions, shouldCenter) {
  return (
    computePosition(target, step.el, floatingUIOptions)
      .then(floatingUIposition(step, shouldCenter))
      // Wait before forcing focus.
      .then(
        (step) =>
          new Promise((resolve) => {
            setTimeout(() => resolve(step), 300);
          })
      )
      // Replaces focusAfterRender modifier.
      .then((step) => {
        if (step && step.el) {
          step.el.focus({ preventScroll: true });
        }
      })
  );
}

/**
 *
 * @param step
 * @param shouldCenter
 * @return {function({x: *, y: *, placement: *, middlewareData: *}): Promise<unknown>}
 */
function floatingUIposition(step, shouldCenter) {
  return ({ x, y, placement, middlewareData }) => {
    if (!step.el) {
      return step;
    }

    if (shouldCenter) {
      Object.assign(step.el.style, {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      });
    } else {
      Object.assign(step.el.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`
      });
    }

    step.el.dataset.popperPlacement = placement;

    placeArrow(step.el, middlewareData);

    return step;
  };
}

/**
 *
 * @param el
 * @param middlewareData
 */
function placeArrow(el, middlewareData) {
  const arrowEl = el.querySelector('.shepherd-arrow');
  if (arrowEl && middlewareData.arrow) {
    const { x: arrowX, y: arrowY } = middlewareData.arrow;
    Object.assign(arrowEl.style, {
      left: arrowX != null ? `${arrowX}px` : '',
      top: arrowY != null ? `${arrowY}px` : ''
    });
  }
}

/**
 * Gets the `Floating UI` options from a set of base `attachTo` options
 * @param attachToOptions
 * @param {Step} step The step instance
 * @return {Object}
 * @private
 */
export function getFloatingUIOptions(attachToOptions, step) {
  const options = {
    strategy: 'absolute',
    middleware: []
  };

  const arrowEl = addArrow(step);

  const shouldCenter = shouldCenterStep(attachToOptions);

  if (!shouldCenter) {
    options.middleware.push(
      flip(),
      // Replicate PopperJS default behavior.
      shift({
        limiter: limitShift(),
        crossAxis: true
      })
    );

    if (arrowEl) {
      options.middleware.push(arrow({ element: arrowEl }));
    }

    options.placement = attachToOptions.on;
  }

  return merge(step.options.floatingUIOptions || {}, options);
}

/**
 * @param {Step} step
 * @return {HTMLElement|false|null}
 */
function addArrow(step) {
  if (step.options.arrow && step.el) {
    return step.el.querySelector('.shepherd-arrow');
  }

  return false;
}
