import { isFunction, isString } from './type-check';
import {
  makeCenteredPopper,
  generateFocusAfterRenderModifier
} from './popper-options';

import {
  computePosition,
  autoUpdate,
  shift,
  arrow,
  limitShift
} from '@floating-ui/dom';
//import { generateFocusMiddleware } from './floatingui-options';

/**
 * Ensure class prefix ends in `-`
 * @param {string} prefix The prefix to prepend to the class names generated by nano-css
 * @return {string} The prefix ending in `-`
 */
export function normalizePrefix(prefix) {
  if (!isString(prefix) || prefix === '') {
    return '';
  }

  return prefix.charAt(prefix.length - 1) !== '-' ? `${prefix}-` : prefix;
}

/**
 * Resolves attachTo options, converting element option value to a qualified HTMLElement.
 * @param {Step} step The step instance
 * @returns {{}|{element, on}}
 * `element` is a qualified HTML Element
 * `on` is a string position value
 */
export function parseAttachTo(step) {
  const options = step.options.attachTo || {};
  const returnOpts = Object.assign({}, options);

  if (isFunction(returnOpts.element)) {
    // Bind the callback to step so that it has access to the object, to enable running additional logic
    returnOpts.element = returnOpts.element.call(step);
  }

  if (isString(returnOpts.element)) {
    // Can't override the element in user opts reference because we can't
    // guarantee that the element will exist in the future.
    try {
      returnOpts.element = document.querySelector(returnOpts.element);
    } catch (e) {
      // TODO
    }
    if (!returnOpts.element) {
      console.error(
        `The element for this Shepherd step was not found ${options.element}`
      );
    }
  }

  return returnOpts;
}

/**
 * Checks if the step should be centered or not. Does not trigger attachTo.element evaluation, making it a pure
 * alternative for the deprecated step.isCentered() method.
 * @param resolvedAttachToOptions
 * @returns {boolean}
 */
export function shouldCenterStep(resolvedAttachToOptions) {
  if (
    resolvedAttachToOptions === undefined ||
    resolvedAttachToOptions === null
  ) {
    return true;
  }

  return !resolvedAttachToOptions.element || !resolvedAttachToOptions.on;
}

/**
 * Determines options for the tooltip and initializes
 * `step.tooltip` as a Popper instance.
 * @param {Step} step The step instance
 */
export function setupTooltip(step) {
  if (step.cleanup) {
    console.log('cleanup');
    step.cleanup();
  }

  const attachToOptions = step._getResolvedAttachToOptions();

  let target = attachToOptions.element;
  const floatingUIOptions = getFloatingUIOptions(attachToOptions, step);

  if (shouldCenterStep(attachToOptions)) {
    target = document.body;
    const content = step.shepherdElementComponent.getElement();
    content.classList.add('shepherd-centered');
  }

  step.cleanup = autoUpdate(target, step.el, () => {
    // The element might have already been removed by the end of the tour.
    if (!step.el) {
      step.cleanup();
      return;
    }

    computePosition(target, step.el, floatingUIOptions)
      .then(({ x, y, placement, middlewareData }) => {
        Object.assign(step.el.style, {
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`
        });

        step.el.dataset.popperPlacement = placement;

        const arrowEl = step.el.querySelector('.shepherd-arrow');
        if (arrowEl) {
          const { x: arrowX, y: arrowY } = middlewareData.arrow;

          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right'
          }[placement.split('-')[0]];

          Object.assign(arrowEl.style, {
            left: arrowX != null ? `${arrowX}px` : '',
            top: arrowY != null ? `${arrowY}px` : '',
            right: '',
            bottom: '',
            [staticSide]: '-35px'
          });
        }

        return new Promise((resolve) => {
          setTimeout(() => resolve(step), 300);
        });
      })
      // Replaces focusAfterRender modifier.
      .then(({ el }) => {
        if (el) {
          el.focus({ preventScroll: true });
        }
      });
  });

  //step.tooltip = createPopper(target, step.el, popperOptions);
  step.target = attachToOptions.element;

  return floatingUIOptions;
}

/**
 * Create a unique id for steps, tours, modals, etc
 * @return {string}
 */
export function uuid() {
  let d = Date.now();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}


/**
 * Gets the `Popper` options from a set of base `attachTo` options
 * @param attachToOptions
 * @param {Step} step The step instance
 * @return {Object}
 * @private
 */
export function getFloatingUIOptions(attachToOptions, step) {
  const arrowEl = step.el.querySelector('.shepherd-arrow');
  let options = {
    middleware: [shift({
      limiter: limitShift(),
      crossAxis: true
    })],
    strategy: 'absolute'
  };
  if (arrowEl) {
    options.middleware.push(arrow({ element: arrowEl }));
  }

  if (shouldCenterStep(attachToOptions)) {
    //options = makeCenteredPopper(step);
    console.log('@todo : makeCenteredPopper(step)');
  } else {
    options.placement = attachToOptions.on;
  }

  const defaultStepOptions =
    step.tour && step.tour.options && step.tour.options.defaultStepOptions;

  if (defaultStepOptions) {
    //options = _mergeModifiers(defaultStepOptions, options);
    console.log('@todo : _mergeModifiers(defaultStepOptions, options)');
  }

  //options = _mergeModifiers(step.options, options);
  console.log('@todo : _mergeModifiers(step.options, options)');

  return options;
}

/**
 * Gets the `Popper` options from a set of base `attachTo` options
 * @param attachToOptions
 * @param {Step} step The step instance
 * @return {Object}
 * @private
 */
export function getPopperOptions(attachToOptions, step) {
  let popperOptions = {
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          altAxis: true,
          tether: false
        }
      },
      generateFocusAfterRenderModifier(step)
    ],
    strategy: 'absolute'
  };

  if (shouldCenterStep(attachToOptions)) {
    popperOptions = makeCenteredPopper(step);
  } else {
    popperOptions.placement = attachToOptions.on;
  }

  const defaultStepOptions =
    step.tour && step.tour.options && step.tour.options.defaultStepOptions;

  if (defaultStepOptions) {
    popperOptions = _mergeModifiers(defaultStepOptions, popperOptions);
  }

  popperOptions = _mergeModifiers(step.options, popperOptions);

  return popperOptions;
}

function _mergeModifiers(stepOptions, popperOptions) {
  if (stepOptions.popperOptions) {
    let mergedPopperOptions = Object.assign(
      {},
      popperOptions,
      stepOptions.popperOptions
    );

    if (
      stepOptions.popperOptions.modifiers &&
      stepOptions.popperOptions.modifiers.length > 0
    ) {
      const names = stepOptions.popperOptions.modifiers.map((mod) => mod.name);
      const filteredModifiers = popperOptions.modifiers.filter(
        (mod) => !names.includes(mod.name)
      );

      mergedPopperOptions.modifiers = Array.from(
        new Set([...filteredModifiers, ...stepOptions.popperOptions.modifiers])
      );
    }

    return mergedPopperOptions;
  }

  return popperOptions;
}
