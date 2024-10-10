import { deepmerge } from 'deepmerge-ts';
import { Evented } from './evented.ts';
import autoBind from './utils/auto-bind.ts';
import {
  isElement,
  isHTMLElement,
  isFunction,
  isUndefined
} from './utils/type-check.ts';
import { bindAdvance } from './utils/bind.ts';
import {
  parseAttachTo,
  normalizePrefix,
  uuid,
  parseExtraHighlights
} from './utils/general.ts';
import {
  setupTooltip,
  destroyTooltip,
  mergeTooltipConfig
} from './utils/floating-ui.ts';
// @ts-expect-error TODO: we don't have Svelte .d.ts files until we generate the dist
import ShepherdElement from './components/shepherd-element.svelte';
import { type Tour } from './tour.ts';

export type StepText =
  | string
  | ReadonlyArray<string>
  | HTMLElement
  | (() => string | ReadonlyArray<string> | HTMLElement);

export type StringOrStringFunction = string | (() => string);

/**
 * The options for the step
 */
export interface StepOptions {
  /**
   * The element the step should be attached to on the page.
   * An object with properties `element` and `on`.
   *
   * ```js
   * const step = new Step(tour, {
   *   attachTo: { element: '.some .selector-path', on: 'left' },
   *   ...moreOptions
   * });
   * ```
   *
   * If you don’t specify an attachTo the element will appear in the middle of the screen.
   * If you omit the `on` portion of `attachTo`, the element will still be highlighted, but the tooltip will appear
   * in the middle of the screen, without an arrow pointing to the target.
   */
  attachTo?: StepOptionsAttachTo;

  /**
   * An action on the page which should advance shepherd to the next step.
   * It should be an object with a string `selector` and an `event` name
   * ```js
   * const step = new Step(tour, {
   *   advanceOn: { selector: '.some .selector-path', event: 'click' },
   *   ...moreOptions
   * });
   * ```
   * `event` doesn’t have to be an event inside the tour, it can be any event fired on any element on the page.
   * You can also always manually advance the Tour by calling `myTour.next()`.
   */
  advanceOn?: StepOptionsAdvanceOn;

  /**
   * Whether to display the arrow for the tooltip or not
   */
  arrow?: boolean;

  /**
   * A function that returns a promise.
   * When the promise resolves, the rest of the `show` code for the step will execute.
   */
  beforeShowPromise?: () => Promise<unknown>;

  /**
   * An array of buttons to add to the step. These will be rendered in a
   * footer below the main body text.
   */
  buttons?: ReadonlyArray<StepOptionsButton>;

  /**
   * Should a cancel “✕” be shown in the header of the step?
   */
  cancelIcon?: StepOptionsCancelIcon;

  /**
   * A boolean, that when set to false, will set `pointer-events: none` on the target.
   */
  canClickTarget?: boolean;

  /**
   * A string of extra classes to add to the step's content element.
   */
  classes?: string;

  /**
   * An extra class to apply to the `attachTo` element when it is
   * highlighted (that is, when its step is active). You can then target that selector in your CSS.
   */
  highlightClass?: string;

  /**
   * The string to use as the `id` for the step.
   */
  id?: string;

  /**
   * An amount of padding to add around the modal overlay opening
   */
  modalOverlayOpeningPadding?: number;

  /**
   * An amount of border radius to add around the modal overlay opening
   */
  modalOverlayOpeningRadius?:
    | number
    | {
        topLeft?: number;
        bottomLeft?: number;
        bottomRight?: number;
        topRight?: number;
      };

  /**
   * An amount to offset the modal overlay opening in the x-direction
   */
  modalOverlayOpeningXOffset?: number;

  /**
   * An amount to offset the modal overlay opening in the y-direction
   */
  modalOverlayOpeningYOffset?: number;

  /**
   * Extra [options to pass to FloatingUI]{@link https://floating-ui.com/docs/tutorial/}
   */
  floatingUIOptions?: object;

  /**
   * Should the element be scrolled to when this step is shown?
   */
  scrollTo?: boolean | ScrollIntoViewOptions;

  /**
   * A function that lets you override the default scrollTo behavior and
   * define a custom action to do the scrolling, and possibly other logic.
   */
  scrollToHandler?: (element: HTMLElement) => void;

  /**
   * A function that, when it returns `true`, will show the step.
   * If it returns `false`, the step will be skipped.
   */
  showOn?: () => boolean;

  /**
   * The text in the body of the step. It can be one of four types:
   * ```
   * - HTML string
   * - Array of HTML strings
   * - `HTMLElement` object
   * - `Function` to be executed when the step is built. It must return one of the three options above.
   * ```
   */
  text?: StepText;

  /**
   * The step's title. It becomes an `h3` at the top of the step.
   * ```
   * - HTML string
   * - `Function` to be executed when the step is built. It must return HTML string.
   * ```
   */
  title?: StringOrStringFunction;

  /**
   * You can define `show`, `hide`, etc events inside `when`. For example:
   * ```js
   * when: {
   *   show: function() {
   *     window.scrollTo(0, 0);
   *   }
   * }
   * ```
   */
  when?: StepOptionsWhen;

  /**
   * An array of extra element selectors to highlight when the overlay is shown
   * The tooltip won't be fixed to these elements, but they will be highlighted
   * just like the `attachTo` element.
   * ```js
   * const step = new Step(tour, {
   *   extraHighlights: [ '.pricing', '#docs' ],
   *   ...moreOptions
   * });
   */
  extraHighlights?: ReadonlyArray<string>;
}

export type PopperPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'left'
  | 'left-start'
  | 'left-end';

export interface StepOptionsAttachTo {
  element?:
    | HTMLElement
    | string
    | null
    | (() => HTMLElement | string | null | undefined);
  on?: PopperPlacement;
}

export interface StepOptionsAdvanceOn {
  event: string;
  selector: string;
}

export interface StepOptionsButton {
  /**
   * A function executed when the button is clicked on
   * It is automatically bound to the `tour` the step is associated with, so things like `this.next` will
   * work inside the action.
   * You can use action to skip steps or navigate to specific steps, with something like:
   * ```js
   * action() {
   *   return this.show('some_step_name');
   * }
   * ```
   */
  action?: (this: Tour) => void;

  /**
   * Extra classes to apply to the `<a>`
   */
  classes?: string;

  /**
   * Whether the button should be disabled
   * When the value is `true`, or the function returns `true` the button will be disabled
   */
  disabled?: boolean | (() => boolean);

  /**
   * The aria-label text of the button
   */
  label?: StringOrStringFunction;

  /**
   * A boolean, that when true, adds a `shepherd-button-secondary` class to the button.
   */
  secondary?: boolean;

  /**
   * The HTML text of the button
   */
  text?: StringOrStringFunction;
}

export interface StepOptionsButtonEvent {
  [key: string]: () => void;
}

export interface StepOptionsCancelIcon {
  enabled?: boolean;
  label?: string;
}

export interface StepOptionsWhen {
  [key: string]: (this: Step) => void;
}

/**
 * A class representing steps to be added to a tour.
 * @extends {Evented}
 */
export class Step extends Evented {
  _resolvedAttachTo: StepOptionsAttachTo | null;
  _resolvedExtraHighlightElements?: HTMLElement[];
  classPrefix?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  declare cleanup: Function | null;
  el?: HTMLElement | null;
  declare id: string;
  declare options: StepOptions;
  target?: HTMLElement | null;
  tour: Tour;

  constructor(tour: Tour, options: StepOptions = {}) {
    super();

    this.tour = tour;
    this.classPrefix = this.tour.options
      ? normalizePrefix(this.tour.options.classPrefix)
      : '';
    // @ts-expect-error TODO: investigate where styles comes from
    this.styles = tour.styles;

    /**
     * Resolved attachTo options. Due to lazy evaluation, we only resolve the options during `before-show` phase.
     * Do not use this directly, use the _getResolvedAttachToOptions method instead.
     * @type {StepOptionsAttachTo | null}
     * @private
     */
    this._resolvedAttachTo = null;

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
   * Remove the step, delete the step's element, and destroy the FloatingUI instance for the step.
   * Triggers `destroy` event
   */
  destroy() {
    destroyTooltip(this);

    if (isHTMLElement(this.el)) {
      this.el.remove();
      this.el = null;
    }

    this._updateStepTargetOnHide();

    this.trigger('destroy');
  }

  /**
   * Returns the tour for the step
   * @return The tour instance
   */
  getTour() {
    return this.tour;
  }

  /**
   * Hide the step
   */
  hide() {
    this.tour.modal?.hide();

    this.trigger('before-hide');

    if (this.el) {
      this.el.hidden = true;
    }

    this._updateStepTargetOnHide();

    this.trigger('hide');
  }

  /**
   * Resolves attachTo options.
   * @returns {{}|{element, on}}
   */
  _resolveExtraHiglightElements() {
    this._resolvedExtraHighlightElements = parseExtraHighlights(this);
    return this._resolvedExtraHighlightElements;
  }

  /**
   * Resolves attachTo options.
   * @returns {{}|{element, on}}
   */
  _resolveAttachToOptions() {
    this._resolvedAttachTo = parseAttachTo(this);
    return this._resolvedAttachTo;
  }

  /**
   * A selector for resolved attachTo options.
   * @returns {{}|{element, on}}
   * @private
   */
  _getResolvedAttachToOptions() {
    if (this._resolvedAttachTo === null) {
      return this._resolveAttachToOptions();
    }

    return this._resolvedAttachTo;
  }

  /**
   * Check if the step is open and visible
   * @return True if the step is open and visible
   */
  isOpen() {
    return Boolean(this.el && !this.el.hidden);
  }

  /**
   * Wraps `_show` and ensures `beforeShowPromise` resolves before calling show
   */
  show() {
    if (isFunction(this.options.beforeShowPromise)) {
      return Promise.resolve(this.options.beforeShowPromise()).then(() =>
        this._show()
      );
    }
    return Promise.resolve(this._show());
  }

  /**
   * Updates the options of the step.
   *
   * @param {StepOptions} options The options for the step
   */
  updateStepOptions(options: StepOptions) {
    Object.assign(this.options, options);

    // @ts-expect-error TODO: get types for Svelte components
    if (this.shepherdElementComponent) {
      // @ts-expect-error TODO: get types for Svelte components
      this.shepherdElementComponent.$set({ step: this });
    }
  }

  /**
   * Returns the element for the step
   * @return {HTMLElement|null|undefined} The element instance. undefined if it has never been shown, null if it has been destroyed
   */
  getElement() {
    return this.el;
  }

  /**
   * Returns the target for the step
   * @return {HTMLElement|null|undefined} The element instance. undefined if it has never been shown, null if query string has not been found
   */
  getTarget() {
    return this.target;
  }

  /**
   * Creates Shepherd element for step based on options
   *
   * @return {HTMLElement} The DOM element for the step tooltip
   * @private
   */
  _createTooltipContent() {
    const descriptionId = `${this.id}-description`;
    const labelId = `${this.id}-label`;

    // @ts-expect-error TODO: get types for Svelte components
    this.shepherdElementComponent = new ShepherdElement({
      target: this.tour.options.stepsContainer || document.body,
      props: {
        classPrefix: this.classPrefix,
        descriptionId,
        labelId,
        step: this,
        // @ts-expect-error TODO: investigate where styles comes from
        styles: this.styles
      }
    });

    // @ts-expect-error TODO: get types for Svelte components
    return this.shepherdElementComponent.getElement();
  }

  /**
   * If a custom scrollToHandler is defined, call that, otherwise do the generic
   * scrollIntoView call.
   *
   * @param {boolean | ScrollIntoViewOptions} scrollToOptions - If true, uses the default `scrollIntoView`,
   * if an object, passes that object as the params to `scrollIntoView` i.e. `{ behavior: 'smooth', block: 'center' }`
   * @private
   */
  _scrollTo(scrollToOptions: boolean | ScrollIntoViewOptions) {
    const { element } = this._getResolvedAttachToOptions();

    if (isFunction(this.options.scrollToHandler)) {
      this.options.scrollToHandler(element as HTMLElement);
    } else if (
      isElement(element) &&
      typeof element.scrollIntoView === 'function'
    ) {
      element.scrollIntoView(scrollToOptions);
    }
  }

  /**
   * _getClassOptions gets all possible classes for the step
   * @param {StepOptions} stepOptions The step specific options
   * @returns {string} unique string from array of classes
   */
  _getClassOptions(stepOptions: StepOptions) {
    const defaultStepOptions =
      this.tour && this.tour.options && this.tour.options.defaultStepOptions;
    const stepClasses = stepOptions.classes ? stepOptions.classes : '';
    const defaultStepOptionsClasses =
      defaultStepOptions && defaultStepOptions.classes
        ? defaultStepOptions.classes
        : '';
    const allClasses = [
      ...stepClasses.split(' '),
      ...defaultStepOptionsClasses.split(' ')
    ];
    const uniqClasses = new Set(allClasses);

    return Array.from(uniqClasses).join(' ').trim();
  }

  /**
   * Sets the options for the step, maps `when` to events, sets up buttons
   * @param options - The options for the step
   */
  _setOptions(options: StepOptions = {}) {
    let tourOptions =
      this.tour && this.tour.options && this.tour.options.defaultStepOptions;

    tourOptions = deepmerge({}, tourOptions || {});

    this.options = Object.assign(
      {
        arrow: true
      },
      tourOptions,
      options,
      mergeTooltipConfig(tourOptions, options)
    );

    const { when } = this.options;

    this.options.classes = this._getClassOptions(options);

    this.destroy();
    this.id = this.options.id || `step-${uuid()}`;

    if (when) {
      Object.keys(when).forEach((event) => {
        // @ts-expect-error TODO: fix this type error
        this.on(event, when[event], this);
      });
    }
  }

  /**
   * Create the element and set up the FloatingUI instance
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

    // The tooltip implementation details are handled outside of the Step
    // object.
    setupTooltip(this);
  }

  /**
   * Triggers `before-show`, generates the tooltip DOM content,
   * sets up a FloatingUI instance for the tooltip, then triggers `show`.
   * @private
   */
  _show() {
    this.trigger('before-show');

    // Force resolve to make sure the options are updated on subsequent shows.
    this._resolveAttachToOptions();
    this._resolveExtraHiglightElements();
    this._setupElements();

    if (!this.tour.modal) {
      this.tour.setupModal();
    }

    this.tour.modal?.setupForStep(this);
    this._styleTargetElementForStep(this);

    if (this.el) {
      this.el.hidden = false;
    }

    // start scrolling to target before showing the step
    if (this.options.scrollTo) {
      setTimeout(() => {
        this._scrollTo(
          this.options.scrollTo as boolean | ScrollIntoViewOptions
        );
      });
    }

    if (this.el) {
      this.el.hidden = false;
    }

    // @ts-expect-error TODO: get types for Svelte components
    const content = this.shepherdElementComponent.getElement();
    const target = this.target || document.body;
    const extraHighlightElements = this._resolvedExtraHighlightElements;

    target.classList.add(`${this.classPrefix}shepherd-enabled`);
    target.classList.add(`${this.classPrefix}shepherd-target`);
    content.classList.add('shepherd-enabled');

    extraHighlightElements?.forEach((el) => {
      el.classList.add(`${this.classPrefix}shepherd-enabled`);
      el.classList.add(`${this.classPrefix}shepherd-target`);
    });

    this.trigger('show');
  }

  /**
   * Modulates the styles of the passed step's target element, based on the step's options and
   * the tour's `modal` option, to visually emphasize the element
   *
   * @param {Step} step The step object that attaches to the element
   * @private
   */
  _styleTargetElementForStep(step: Step) {
    const targetElement = step.target;
    const extraHighlightElements = step._resolvedExtraHighlightElements;

    if (!targetElement) {
      return;
    }

    const highlightClass = step.options.highlightClass;
    if (highlightClass) {
      targetElement.classList.add(highlightClass);
      extraHighlightElements?.forEach((el) => el.classList.add(highlightClass));
    }

    targetElement.classList.remove('shepherd-target-click-disabled');
    extraHighlightElements?.forEach((el) =>
      el.classList.remove('shepherd-target-click-disabled')
    );

    if (step.options.canClickTarget === false) {
      targetElement.classList.add('shepherd-target-click-disabled');
      extraHighlightElements?.forEach((el) =>
        el.classList.add('shepherd-target-click-disabled')
      );
    }
  }

  /**
   * When a step is hidden, remove the highlightClass and 'shepherd-enabled'
   * and 'shepherd-target' classes
   * @private
   */
  _updateStepTargetOnHide() {
    const target = this.target || document.body;
    const extraHighlightElements = this._resolvedExtraHighlightElements;

    const highlightClass = this.options.highlightClass;
    if (highlightClass) {
      target.classList.remove(highlightClass);
      extraHighlightElements?.forEach((el) =>
        el.classList.remove(highlightClass)
      );
    }

    target.classList.remove(
      'shepherd-target-click-disabled',
      `${this.classPrefix}shepherd-enabled`,
      `${this.classPrefix}shepherd-target`
    );
    extraHighlightElements?.forEach((el) => {
      el.classList.remove(
        'shepherd-target-click-disabled',
        `${this.classPrefix}shepherd-enabled`,
        `${this.classPrefix}shepherd-target`
      );
    });
  }
}
