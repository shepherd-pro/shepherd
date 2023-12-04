import Evented from './evented';
import Step from './step';

/**
 * Class representing the site tour
 * @extends {Evented}
 */
declare class Tour extends Evented {
  /**
   * @param options The options for the tour
   * @returns The newly created Tour instance
   */
  constructor(options?: Tour.TourOptions); //TODO superheri Note: Return on constructor is not possible in typescript. Could this be possible to make this the same for the constructor of the Step class?

  /**
   * Adds a new step to the tour
   * @param options An object containing step options or a Step instance
   * @param index The optional index to insert the step at. If undefined, the step
   * is added to the end of the array.
   * @return The newly added step
   */
  addStep(options: Step | Step.StepOptions, index?: number): Step;

  /**
   * Add multiple steps to the tour
   */
  addSteps(steps: Array<object> | Array<Step>): Tour;

  /**
   * Go to the previous step in the tour
   */
  back(): void;

  /**
   * Calls done() triggering the 'cancel' event
   * If `confirmCancel` is true, will show a window.confirm before cancelling
   * If `confirmCancel` is a function, will call it and wait for the return value,
   * and only cancel when the value returned is true
   */
  cancel(): void;

  /**
   * Calls done() triggering the `complete` event
   */
  complete(): void;

  /**
   * Gets the step from a given id
   * @param id The id of the step to retrieve
   * @return The step corresponding to the `id` or null if no step matches the `id`
   */
  getById(id: number | string): Step | null;

  /**
   * Gets the current step
   * @returns {Step|null}
   */
  getCurrentStep(): Step | null;

  /**
   * Hide the current step
   */
  hide(): void;

  /**
   * Tells if the tour is active
   */
  isActive(): boolean;

  /**
   * Go to the next step in the tour
   * If we are at the end, call `complete`
   */
  next(): void;

  /**
   * Removes the step from the tour
   * @param name The id for the step to remove
   */
  removeStep(name: string): void;

  /**
   * Show a specific step in the tour
   * @param key The key to look up the step by
   * @param forward True if we are going forward, false if backward
   */
  show(key?: number | string, forward?: boolean): void;

  /**
   * Start the tour
   */
  start(): void;

  /**
   * An array of Step instances
   */
  steps: Array<Step>;
}

declare namespace Tour {
  interface TourOptions {
    /**
     * The prefix to add to the `shepherd-enabled` and `shepherd-target` class names as well as the `data-shepherd-step-id`.
     */
    classPrefix?: string;

    /**
     * If true, will issue a `window.confirm` before cancelling
     * If it is a function(support Async Function), it will be called and wait for the return value, and will only be cancelled if the value returned is true
     */
    confirmCancel?: boolean | (() => boolean) | Promise<boolean> | (() => Promise<boolean>);

    /**
     * The message to display in the confirm dialog
     */
    confirmCancelMessage?: string;

    /**
     * Default options for Steps created through `addStep`
     */
    defaultStepOptions?: Step.StepOptions;

    /**
     * Exiting the tour with the escape key will be enabled unless this is explicitly
     * set to false.
     */
    exitOnEsc?: boolean;

    /**
     * Navigating the tour via left and right arrow keys will be enabled
     * unless this is explicitly set to false.
     */
    keyboardNavigation?: boolean;

    /**
     * An optional container element for the steps. If not set, the steps will be appended to document.body.
     */
    stepsContainer?: HTMLElement;

    /**
     * An optional container element for the modal. If not set, the modal will be appended to document.body.
     */
    modalContainer?: HTMLElement;

    /**
     * An array of step options objects or Step instances to initialize the tour with
     */
    steps?: Array<object> | Array<Step>;

    /**
     * An optional "name" for the tour. This will be appended to the the tour's
     * dynamically generated `id` property.
     */
    tourName?: string;

    /**
     * Whether or not steps should be placed above a darkened
     * modal overlay. If true, the overlay will create an opening around the target element so that it
     * can remain interactive
     */
    useModalOverlay?: string | boolean;
  }
}

export default Tour;
