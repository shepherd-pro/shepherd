import {
  getModalMaskOpening,
  createModalOverlay,
  positionModalOpening,
  closeModalOpening,
  classNames as modalClassNames
} from './utils/modal';
import { addStepEventListeners, getElementForStep } from './utils/dom';
import { debounce, defer } from 'lodash';

export class Modal {
  constructor(options) {
    if (!this._modalOverlayElem) {
      this._modalOverlayElem = createModalOverlay();
      this._modalOverlayOpening = getModalMaskOpening(this._modalOverlayElem);

      // don't show yet -- each step will control that
      this.hide();

      document.body.appendChild(this._modalOverlayElem);
    }

    this.options = options;

    return this;
  }

  /**
   * Remove the SVG element, set this._modalOverlayElem to null and remove the
   * modal class name from the body.
   */
  cleanup() {
    defer(() => {
      const element = this._modalOverlayElem;

      if (element && element instanceof SVGElement) {
        element.parentNode.removeChild(element);
      }

      this._modalOverlayElem = null;
      document.body.classList.remove(modalClassNames.isVisible);
    });
  }

  /**
   * Hide the modal overlay
   */
  hide() {
    document.body.classList.remove(modalClassNames.isVisible);

    if (this._modalOverlayElem) {
      this._modalOverlayElem.style.display = 'none';
    }
  }

  /**
   * If modal is enabled, setup the svg mask opening and modal overlay for the step
   * @param step
   */
  setupForStep(step) {
    if (this.options.useModalOverlay) {
      this._styleForStep(step);
      this.show();

    } else {
      this.hide();
    }
  }

  /**
   * Show the modal overlay
   */
  show() {
    document.body.classList.add(modalClassNames.isVisible);

    if (this._modalOverlayElem) {
      this._modalOverlayElem.style.display = 'block';
    }
  }

  /**
   * Style the modal for the step
   * @param {Step} step The step to style the opening for
   * @private
   */
  _styleForStep(step) {
    const modalOverlayOpening = this._modalOverlayOpening;
    const targetElement = getElementForStep(step);

    if (targetElement) {
      positionModalOpening(targetElement, modalOverlayOpening);

      this._onScreenChange = debounce(
        positionModalOpening.bind(this, targetElement, modalOverlayOpening),
        0,
        { leading: false, trailing: true } // see https://lodash.com/docs/#debounce
      );

      addStepEventListeners.call(this);

    } else {
      closeModalOpening(this._modalOverlayOpening);
    }
  }
}