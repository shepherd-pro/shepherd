import { type StepOptionsAttachTo, type Step } from '../step.ts';
import { isFunction, isString } from './type-check.ts';

export class NoOp {
  constructor() {}
}

/**
 * Ensure class prefix ends in `-`
 * @param prefix - The prefix to prepend to the class names generated by nano-css
 * @return The prefix ending in `-`
 */
export function normalizePrefix(prefix?: string) {
  if (!isString(prefix) || prefix === '') {
    return '';
  }

  return prefix.charAt(prefix.length - 1) !== '-' ? `${prefix}-` : prefix;
}

/**
 * Resolves attachTo options, converting element option value to a qualified HTMLElement.
 * @param step - The step instance
 * @returns {{}|{element, on}}
 * `element` is a qualified HTML Element
 * `on` is a string position value
 */
export function parseAttachTo(step: Step) {
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
      returnOpts.element = document.querySelector(
        returnOpts.element
      ) as HTMLElement;
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
 */
export function shouldCenterStep(resolvedAttachToOptions: StepOptionsAttachTo) {
  if (
    resolvedAttachToOptions === undefined ||
    resolvedAttachToOptions === null
  ) {
    return true;
  }

  return !resolvedAttachToOptions.element || !resolvedAttachToOptions.on;
}

/**
 * Create a unique id for steps, tours, modals, etc
 */
export function uuid() {
  let d = Date.now();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
