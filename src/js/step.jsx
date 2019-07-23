import preact from 'preact';

import { Evented } from './evented.js';
import autoBind from './utils/auto-bind';
import { isElement, isFunction, isUndefined } from './utils/type-check';
import { bindAdvance } from './utils/bind.js';
import { getElementForStep } from './utils/dom';
import { setupTooltip, parseAttachTo, normalizePrefix } from './utils/general.js';
import { toggleShepherdModalClass } from './utils/modal.jsx';
import ShepherdElement from './components/shepherd-element.jsx';

// Polyfills
import 'element-matches';
import smoothscroll from 'smoothscroll-polyfill';

smoothscroll.polyfill();

const { h, render } = preact;

/**
 * Creates incremented ID for each newly created step
 *
 * @return {Function} A function that returns the unique id for the step
 * @private
 */
const uniqueId = (function() {
  let id = 0;
  return function() {
    return ++id;
  };
})();

/**
 * A class representing steps to be added to a tour.
 * @extends {Evented}
 */
export class Step extends Evented {
  /**
   * Create a step
   * @param {Tour} tour The tour for the step
   * @param {Object} options The options for the step
   * @param {Object} options.attachTo What element the step should be attached to on the page.
   * It should be an object with the properties `element` and `on`, where `element` is an element selector string
   * or a DOM element and `on` is the optional direction to place the Tippy tooltip.
   *
   * ```js
   * const new Step(tour, {
   *   attachTo: { element: '.some .selector-path', on: 'left' },
   *   ...moreOptions
   * })'
   * ```
   *
   * If you don’t specify an attachTo the element will appear in the middle of the screen.
   * If you omit the `on` portion of `attachTo`, the element will still be highlighted, but the tooltip will appear
   * in the middle of the screen, without an arrow pointing to the target.
   * @param {HTMLElement|string} options.attachTo.element
   * @param {string} options.attachTo.on
   * @param {Object} options.advanceOn An action on the page which should advance shepherd to the next step.
   * It should be an object with a string `selector` and an `event` name
   * ```js
   * const new Step(tour, {
   *   advanceOn: { selector: '.some .selector-path', event: 'click' },
   *   ...moreOptions
   * })'
   * ```
   * `event` doesn’t have to be an event inside the tour, it can be any event fired on any element on the page.
   * You can also always manually advance the Tour by calling `myTour.next()`.
   * @param {function} options.beforeShowPromise A function that returns a promise.
   * When the promise resolves, the rest of the `show` code for the step will execute.
   * @param {Object[]} options.buttons An array of buttons to add to the step. These will be rendered in a
   * footer below the main body text.
   * @param {function} options.buttons.button.action A function executed when the button is clicked on
   * You can use action to skip steps or navigate to specific steps, with something like:
   * ```js
   * action: function() {
   *   return Shepherd.activeTour.show('some_step_name');
   * }
   * ```
   * @param {string} options.buttons.button.classes Extra classes to apply to the `<a>`
   * @param {boolean} options.buttons.button.secondary If true, a shepherd-button-secondary class is applied to the button
   * @param {string} options.buttons.button.text The HTML text of the button
   * @param {string} options.classes A string of extra classes to add to the step's content element.
   * @param {string} options.highlightClass An extra class to apply to the `attachTo` element when it is
   * highlighted (that is, when its step is active). You can then target that selector in your CSS.
   * @param {Object} options.tippyOptions Extra [options to pass to tippy.js]{@link https://atomiks.github.io/tippyjs/#all-options}
   * @param {boolean|Object} options.scrollTo Should the element be scrolled to when this step is shown? If true, uses the default `scrollIntoView`,
   * if an object, passes that object as the params to `scrollIntoView` i.e. `{behavior: 'smooth', block: 'center'}`
   * @param {function} options.scrollToHandler A function that lets you override the default scrollTo behavior and
   * define a custom action to do the scrolling, and possibly other logic.
   * @param {boolean} options.showCancelLink Should a cancel “✕” be shown in the header of the step?
   * @param {function} options.showOn A function that, when it returns `true`, will show the step.
   * If it returns false, the step will be skipped.
   * @param {string} options.text The text in the body of the step. It can be one of three types:
   * ```
   * - HTML string
   * - `HTMLElement` object
   * - `Function` to be executed when the step is built. It must return one the two options above.
   * ```
   * @param {string} options.title The step's title. It becomes an `h3` at the top of the step.
   * @param {Object} options.when You can define `show`, `hide`, etc events inside `when`. For example:
   * ```js
   * when: {
   *   show: function() {
   *     window.scrollTo(0, 0);
   *   }
   * }
   * ```
   * @param {Number} options.modalOverlayOpeningPadding An amount of padding to add around the modal overlay opening
   * @return {Step} The newly created Step instance
   */
  constructor(tour, options = {}) {
    super(tour, options);
    this.tour = tour;
    this.classPrefix = this.tour.options ? normalizePrefix(this.tour.options.classPrefix) : '';
    this.styles = tour.styles;

    autoBind(this);

    this._setOptions(options);

    return this;
  }

  /**
   * Cancel the tour
   * Triggers the `cancel` event
   */
  cancel() {
    this.tour.cancel();
    this.trigger('cancel');
  }

  /**
   * Complete the tour
   * Triggers the `complete` event
   */
  complete() {
    this.tour.complete();
    this.trigger('complete');
  }

  /**
   * Remove the step, delete the step's element, and destroy the tippy instance for the step
   * Triggers `destroy` event
   */
  destroy() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }

    if (isElement(this.el) && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
      this.el = null;
    }

    if (this.target) {
      this._updateStepTargetOnHide();
    }

    this.trigger('destroy');
  }

  /**
   * Returns the tour for the step
   * @return {Tour} The tour instance
   */
  getTour() {
    return this.tour;
  }

  /**
   * Hide the step and destroy the tippy instance
   */
  hide() {
    this.tour.modal.hide();

    this.trigger('before-hide');

    document.body.removeAttribute(`data-${this.classPrefix}shepherd-step`);

    if (this.target) {
      this._updateStepTargetOnHide();
    }

    if (this.tooltip) {
      this.tooltip.hide();
    }

    this.trigger('hide');
  }

  /**
   * Check if the step is open and visible
   * @return {boolean} True if the step is open and visible
   */
  isOpen() {
    return Boolean(
      this.tooltip &&
      this.tooltip.state &&
      this.tooltip.state.isVisible
    );
  }

  /**
   * Wraps `_show` and ensures `beforeShowPromise` resolves before calling show
   * @return {*|Promise}
   */
  show() {
    if (isFunction(this.options.beforeShowPromise)) {
      const beforeShowPromise = this.options.beforeShowPromise();
      if (!isUndefined(beforeShowPromise)) {
        return beforeShowPromise.then(() => this._show());
      }
    }
    this._show();
  }

  /**
   * Creates Shepherd element for step based on options
   *
   * @return {Element} The DOM element for the step tooltip
   * @private
   */
  _createTooltipContent() {
    let classes = this.options.classes || '';
    const descriptionId = `${this.id}-description`;
    const labelId = `${this.id}-label`;

    if (this.options.showCancelLink) {
      classes += ` ${this.classPrefix}shepherd-has-cancel-link`;
    }

    return render(
      <ShepherdElement
        classPrefix={this.classPrefix}
        classes={classes}
        descriptionId={descriptionId}
        labelId={labelId}
        step={this}
        styles={this.styles}
      />,
      null
    );
  }

  /**
   * If a custom scrollToHandler is defined, call that, otherwise do the generic
   * scrollIntoView call.
   *
   * @param {boolean|Object} scrollToOptions If true, uses the default `scrollIntoView`,
   * if an object, passes that object as the params to `scrollIntoView` i.e. `{ behavior: 'smooth', block: 'center' }`
   * @private
   */
  _scrollTo(scrollToOptions) {
    const { element } = parseAttachTo(this);

    if (isFunction(this.options.scrollToHandler)) {
      this.options.scrollToHandler(element);
    } else if (isElement(element)) {
      element.scrollIntoView(scrollToOptions);
    }
  }

  /**
   * Sets the options for the step, maps `when` to events, sets up buttons
   * @param {Object} options The options for the step
   * @private
   */
  _setOptions(options = {}) {
    this.options = options;
    const { when } = this.options;

    this.destroy();
    this.id = this.options.id || `step-${uniqueId()}`;

    if (when) {
      Object.entries(when).forEach(([event, handler]) => {
        this.on(event, handler, this);
      });
    }
  }

  /**
   * Create the element and set up the tippy instance
   * @private
   */
  _setupElements() {
    if (!isUndefined(this.el)) {
      this.destroy();
    }

    this.el = this._createTooltipContent();

    if (this.options.advanceOn) {
      bindAdvance(this);
    }

    setupTooltip(this);
  }

  /**
   * Triggers `before-show`, generates the tooltip DOM content,
   * sets up a tippy instance for the tooltip, then triggers `show`.
   * @private
   */
  _show() {
    this.tour.modal.setupForStep(this);
    this._styleTargetElementForStep(this);

    this.trigger('before-show');

    if (!this.el) {
      this._setupElements();
    }

    this.target.classList.add(`${this.classPrefix}shepherd-enabled`, `${this.classPrefix}shepherd-target`);
    document.body.setAttribute(`data-${this.classPrefix}shepherd-step`, this.id);

    if (this.options.scrollTo) {
      setTimeout(() => {
        this._scrollTo(this.options.scrollTo);
      });
    }

    this.tooltip.show();
    this.trigger('show');
    this.el.focus();
  }

  /**
   * Modulates the styles of the passed step's target element, based on the step's options and
   * the tour's `modal` option, to visually emphasize the element
   *
   * @param step The step object that attaches to the element
   * @private
   */
  _styleTargetElementForStep(step) {
    const targetElement = getElementForStep(step);

    if (!targetElement) {
      return;
    }

    toggleShepherdModalClass(targetElement);

    if (step.options.highlightClass) {
      targetElement.classList.add(step.options.highlightClass);
    }

    if (step.options.canClickTarget === false) {
      targetElement.style.pointerEvents = 'none';
    }
  }

  /**
   * When a step is hidden, remove the highlightClass and 'shepherd-enabled'
   * and 'shepherd-target' classes
   * @private
   */
  _updateStepTargetOnHide() {
    if (this.options.highlightClass) {
      this.target.classList.remove(this.options.highlightClass);
    }

    this.target.classList.remove(`${this.classPrefix}shepherd-enabled`, `${this.classPrefix}shepherd-target`);
  }
}
