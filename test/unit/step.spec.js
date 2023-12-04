import { spy } from 'sinon';
import Shepherd from '../../src/js/shepherd';
import { Step } from '../../src/js/step';
import { Tour } from '../../src/js/tour';
import ResizeObserver from 'resize-observer-polyfill';
import { offset } from '@floating-ui/dom';

// since importing non UMD, needs assignment
window.Shepherd = Shepherd;
window.ResizeObserver = ResizeObserver;

const DEFAULT_STEP_CLASS = 'shepherd-step-tooltip';

describe('Tour | Step', () => {
  let tour;

  const showOn = () => {
    return true;
  };

  const when = {
    show() {}
  };

  beforeEach(() => {
    tour = new Tour();
  });

  describe('Shepherd.Step()', () => {
    const defaultOffsetMiddleware = offset({ mainAxis: 0, crossAxis: 32 });
    const fooMiddleware = { name: 'foo', options: 'bar', fn: (args) => args };

    const instance = new Shepherd.Tour({
      defaultStepOptions: {
        classes: DEFAULT_STEP_CLASS,
        scrollTo: true,
        floatingUIOptions: {
          middleware: [defaultOffsetMiddleware]
        },
        showOn,
        when
      }
    });

    const testStep = instance.addStep({
      attachTo: { element: 'body', on: 'top' },
      highlightClass: 'highlight',
      text: 'This is a step for testing',
      buttons: [
        {
          text: 'Next',
          action: instance.next
        }
      ],
      id: 'test',
      floatingUIOptions: {
        middleware: [fooMiddleware]
      }
    });

    const showTestStep = instance.addStep({
      buttons: [],
      id: 'test2',
      text: 'Another Step'
    });

    // Add more steps for total _setupButtons coverage
    instance.addStep({
      buttons: {
        text: 'Next',
        action: instance.next
      },
      id: 'test3-id',
      text: 'Another Step part deux'
    });

    const stepWithoutNameWithId = instance.addStep({
      attachTo: { element: 'body' },
      highlightClass: 'highlight',
      id: 'no-name',
      text: 'This is a step without a name, but with an id',
      buttons: [
        {
          text: 'Next',
          action: instance.next
        }
      ]
    });

    const stepWithoutNameWithoutIdOffsetMiddleware = offset({
      mainAxis: 0,
      crossAxis: -32
    });
    const stepWithoutNameWithoutId = instance.addStep({
      attachTo: { element: 'body' },
      highlightClass: 'highlight',
      text: 'This is a step without a name, and without an id',
      buttons: [
        {
          text: 'Next',
          action: instance.next
        }
      ],
      floatingUIOptions: {
        middleware: [stepWithoutNameWithoutIdOffsetMiddleware]
      }
    });

    const beforeShowPromise = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          console.log('beforeShowPromise worked!');
          resolve('beforeShowPromise worked!');
        }, 1000);
      });

    const beforeShowPromiseTestStep = instance.addStep({
      text: 'Before Show Promise Step',
      id: 'test3',
      beforeShowPromise
    });

    afterEach(() => {
      instance.complete();
    });

    it('has all the correct properties', () => {
      const values = [
        'arrow',
        'classes',
        'scrollTo',
        'floatingUIOptions',
        'showOn',
        'when',
        'attachTo',
        'highlightClass',
        'text',
        'buttons',
        'id'
      ];
      expect(values).toEqual(Object.keys(testStep.options));

      expect(testStep.id, 'passed name set as id').toBe('test');
      expect(stepWithoutNameWithId.id, 'no name, id passed is set').toBe(
        'no-name'
      );
      expect(
        stepWithoutNameWithoutId.id,
        'id is generated when no name or id passed'
      ).toMatch(
        /^step-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
      );
    });

    it('deep clones defaultStepOptions and copies functions', () => {
      expect(testStep.options).toEqual({
        arrow: true,
        attachTo: { element: 'body', on: 'top' },
        buttons: [
          {
            text: 'Next',
            action: instance.next
          }
        ],
        classes: DEFAULT_STEP_CLASS,
        highlightClass: 'highlight',
        id: 'test',
        scrollTo: true,
        text: 'This is a step for testing',
        floatingUIOptions: {
          middleware: [defaultOffsetMiddleware, fooMiddleware]
        },
        showOn,
        when
      });
    });

    it('allows the step to override a previously defined modifier', () => {
      stepWithoutNameWithoutId.show();
      const offsetMiddleware =
        stepWithoutNameWithoutId.options.floatingUIOptions.middleware.filter(
          ({ name }) => name === 'offset'
        );
      const offsetResult = offsetMiddleware.reduce(
        (agg, current) => {
          agg.mainAxis += current.options.mainAxis;
          agg.crossAxis += current.options.crossAxis;
          return agg;
        },
        { mainAxis: 0, crossAxis: 0 }
      );

      expect(offsetResult).toEqual({ mainAxis: 0, crossAxis: 0 });
    });

    describe('.hide()', () => {
      it('detaches from the step target', () => {
        instance.start();

        const targetElem = document.body;

        expect(targetElem.classList.contains('shepherd-enabled')).toBe(true);

        testStep.hide();

        expect(targetElem.classList.contains('shepherd-enabled')).toBe(false);
      });
    });

    describe('.show()', () => {
      it('beforeShowPromise called before `show`', () => {
        console.log = jest.fn();
        const promise = beforeShowPromiseTestStep.show();

        return promise.then(() => {
          expect(console.log).toHaveBeenCalledWith('beforeShowPromise worked!');
        });
      });

      it('shows step evoking method, regardless of order', () => {
        showTestStep.show();

        expect(
          document.querySelector('[data-shepherd-step-id=test2]')
        ).toBeInTheDocument();
      });
    });
  });

  describe('cancel()', () => {
    it('triggers the cancel event and tour method', () => {
      let cancelCalled = false;
      let eventTriggered = false;
      const step = new Step(
        {
          cancel() {
            cancelCalled = true;
          }
        },
        {}
      );
      step.on('cancel', () => (eventTriggered = true));
      step.cancel();

      expect(cancelCalled, 'cancel method from tour called').toBeTruthy();
      expect(eventTriggered, 'cancel event was triggered').toBeTruthy();
    });
  });

  describe('complete()', () => {
    it('triggers the complete event and tour method', () => {
      let completeCalled = false;
      let eventTriggered = false;
      const step = new Step(
        {
          complete() {
            completeCalled = true;
          }
        },
        {}
      );
      step.on('complete', () => (eventTriggered = true));
      step.complete();

      expect(completeCalled, 'complete method from tour called').toBeTruthy();
      expect(eventTriggered, 'complete event was triggered').toBeTruthy();
    });
  });

  describe('destroy()', () => {
    it('triggers the destroy event', () => {
      const step = new Step(tour, {});
      let eventTriggered = false;
      step.on('destroy', () => (eventTriggered = true));
      step.destroy();

      expect(eventTriggered, 'destroy event was triggered').toBeTruthy();
    });
  });

  describe('hide()', () => {
    let beforeHideTriggered = false;
    let modalHideCalled = false;
    const step = new Step(
      {
        modal: {
          hide() {
            modalHideCalled = true;
          }
        }
      },
      {}
    );

    it('triggers the before-hide event', () => {
      step.on('before-hide', () => (beforeHideTriggered = true));
      step.hide();

      expect(
        beforeHideTriggered,
        'before-hide event was triggered'
      ).toBeTruthy();
    });

    it('calls tour.modal.hide', () => {
      expect(modalHideCalled, 'tour.modal.hide called').toBeTruthy();
    });
  });

  describe('updateStepOptions', () => {
    let step;

    beforeEach(() => {
      step = new Step(tour, {
        id: 'test-id',
        attachTo: { element: 'body', on: 'top' },
        text: 'Lorem Ipsum',
        classes: 'classes-test',
        title: 'Test',
        scrollTo: false,
        buttons: [
          { text: 'button one', disabled: false, classes: 'button1' },
          { text: 'button two', disabled: true, classes: 'button2' }
        ]
      });
      step.show();
    });

    afterEach(() => {
      step.destroy();
    });

    it('should update passed in properties', async () => {
      step.updateStepOptions({ text: 'updated', title: 'New title' });

      expect(step.options.text).toBe('updated');
      expect(step.options.title).toBe('New title');

      await window.requestAnimationFrame(
        () =>
          new Promise((resolve) => {
            return resolve();
          })
      );

      expect(document.querySelector('.shepherd-text').textContent).toBe(
        'updated'
      );
      expect(document.querySelector('.shepherd-title').textContent).toBe(
        'New title'
      );
    });

    it('should not affect other properties', async () => {
      step.updateStepOptions({ text: 'updated', title: 'New title' });
      expect(step.options.id).toEqual('test-id');
      expect(step.options.buttons).toEqual([
        { text: 'button one', disabled: false, classes: 'button1' },
        { text: 'button two', disabled: true, classes: 'button2' }
      ]);

      await window.requestAnimationFrame(
        () =>
          new Promise((resolve) => {
            return resolve();
          })
      );

      expect(document.querySelector('.button1').textContent).toBe('button one');
      expect(document.querySelector('.button2').textContent).toBe('button two');
    });

    it('should update buttons', async () => {
      const buttons = [
        { text: 'button one updated', disabled: true, classes: 'button1' },
        { text: 'button two updated', disabled: false, classes: 'button2' }
      ];

      step.updateStepOptions({ buttons });
      expect(step.options.buttons).toEqual(buttons);

      await window.requestAnimationFrame(
        () =>
          new Promise((resolve) => {
            return resolve();
          })
      );

      const buttonOne = document.querySelector('.button1');
      expect(buttonOne.textContent).toBe('button one updated');
      expect(buttonOne.disabled).toBe(true);

      const buttonTwo = document.querySelector('.button2');
      expect(buttonTwo.textContent).toBe('button two updated');
      expect(buttonTwo.disabled).toBe(false);
    });

    it('removing title should remove class', async () => {
      step.updateStepOptions({ title: '' });
      expect(step.options.title).toEqual('');

      await window.requestAnimationFrame(
        () =>
          new Promise((resolve) => {
            return resolve();
          })
      );

      const element = document.querySelector('.shepherd-element');
      expect(element.classList.contains('shepherd-has-title')).toBeFalsy();
    });

    it('updating classes should update element classes', async () => {
      step.updateStepOptions({ classes: 'test-1 test-2' });
      expect(step.options.classes).toEqual('test-1 test-2');

      await window.requestAnimationFrame(
        () =>
          new Promise((resolve) => {
            return resolve();
          })
      );

      const element = document.querySelector('.shepherd-element');
      expect(element.classList.contains('test-1')).toBeTruthy();
      expect(element.classList.contains('test-2')).toBeTruthy();
      expect(element.classList.contains('classes-test')).toBeFalsy();
    });
  });

  describe('_setupElements()', () => {
    it('calls destroy on the step if the content element is already set', () => {
      const step = new Step(tour, {});
      let destroyCalled = false;
      step.el = document.createElement('a');
      step.destroy = () => (destroyCalled = true);
      step._setupElements();
      expect(
        destroyCalled,
        '_setupElements method called destroy with element set'
      ).toBeTruthy();
    });

    it('calls destroy on the tooltip if it already exists', () => {
      const step = new Step(tour, {});
      let destroyCalled = false;
      step.cleanup = () => {
        destroyCalled = true;
      };
      step._setupElements();
      expect(
        destroyCalled,
        '_setupElements method called destroy on the existing tooltip'
      ).toBe(true);
    });
  });

  describe('_scrollTo()', () => {
    it('calls the scroll native method', () => {
      const div = document.createElement('div');
      let handlerCalled = false;
      div.classList.add('scroll-test');
      document.body.appendChild(div);
      const step = new Step('test', {
        attachTo: { element: '.scroll-test', on: 'center' }
      });
      div.scrollIntoView = () => (handlerCalled = true);

      step._scrollTo();
      expect(handlerCalled).toBeTruthy();
    });

    it('calls the custom handler', () => {
      let handlerAdded = false;
      const step = new Step('test', {
        scrollToHandler: () => (handlerAdded = true)
      });

      step._scrollTo();
      expect(handlerAdded).toBeTruthy();
    });

    it('calls scroll native method after before-show promise resolution', () => {
      const resTester = document.createElement('div');
      let resHandlerCalled = false;
      resTester.classList.add('post-res-scroll-test');
      resTester.scrollIntoView = () => (resHandlerCalled = true);
      const resSpy = jest.spyOn(resTester, 'scrollIntoView');
      document.body.appendChild(resTester);

      const beforeShowPromise = new Promise((resolve) => {
        return setTimeout(() => resolve('beforeShowPromise worked!'), 1000);
      });

      const step = new Step('test', {
        attachTo: { element: '.post-res-scroll-test', on: 'center' },
        beforeShowPromise: () => {
          return beforeShowPromise;
        }
      });

      step.show();

      step._scrollTo();

      expect(resHandlerCalled).toBeTruthy();
      expect(resSpy).toHaveBeenCalled();
    });

    it('calls the custom handler after before-show promise resolution', () => {
      let resHandlerAdded = false;

      const beforeShowPromise = new Promise((resolve) => {
        return setTimeout(() => resolve('beforeShowPromise worked!'), 1000);
      });

      const step = new Step('test', {
        scrollToHandler: () => (resHandlerAdded = true),
        beforeShowPromise: () => {
          return beforeShowPromise;
        }
      });

      const resSpy = jest.spyOn(step.options, 'scrollToHandler');

      step.show();

      step._scrollTo();

      expect(resHandlerAdded).toBeTruthy();
      expect(resSpy).toHaveBeenCalled();
    });
  });

  describe('setOptions()', () => {
    it('calls event handlers passed in as properties to the `when` option', () => {
      let whenCalled = false;
      const step = new Step('test', {
        when: {
          destroy: () => (whenCalled = true)
        }
      });

      step.destroy();
      expect(whenCalled).toBeTruthy();
    });
  });

  describe('getTour()', () => {
    it('returns the tour value', () => {
      const step = new Step(new Shepherd.Tour(), {});

      expect(step.getTour() instanceof Shepherd.Tour).toBeTruthy();
    });
  });

  describe('_createTooltipContent', () => {
    it('ARIA attributes set', () => {
      const step = new Step(tour, {
        id: 'test-step',
        text: 'Lorem Ipsum',
        title: 'Test'
      });

      const element = step._createTooltipContent();

      expect(element.getAttribute('aria-labelledby')).toBe('test-step-label');
      expect(element.querySelector('.shepherd-title').id).toBe(
        'test-step-label'
      );

      expect(element.getAttribute('aria-describedby')).toBe(
        'test-step-description'
      );
      expect(element.querySelector('.shepherd-text').id).toBe(
        'test-step-description'
      );
    });
  });

  describe('correct operation of classes on body element when step not attached to an element', () => {
    const offsetMiddleware = offset({ crossAxis: 32 });
    const defaultCallback = (args) => args;
    const instance = new Shepherd.Tour({
      defaultStepOptions: {
        classes: DEFAULT_STEP_CLASS,
        scrollTo: true,
        floatingUIOptions: {
          middleware: [offsetMiddleware]
        },
        showOn,
        when
      }
    });

    const stepWithoutAttachment = instance.addStep({
      highlightClass: 'highlight',
      text: 'This is a step for testing',
      buttons: [
        {
          text: 'Next',
          action: instance.next
        }
      ],
      id: 'test',
      floatingUIOptions: {
        middleware: [{ name: 'foo', options: 'bar', fn: defaultCallback }]
      }
    });

    afterEach(() => {
      instance.complete();
    });

    describe('.hide()', () => {
      it('detaches from the step target', () => {
        instance.start();

        const targetElem = document.body;

        expect(targetElem.classList.contains('shepherd-enabled')).toBe(true);

        stepWithoutAttachment.hide();

        expect(targetElem.classList.contains('shepherd-enabled')).toBe(false);
      });
    });

    describe('.destroy()', () => {
      it('detaches from the step target', () => {
        instance.start();

        const targetElem = document.body;

        expect(targetElem.classList.contains('shepherd-enabled')).toBe(true);

        stepWithoutAttachment.destroy();

        expect(targetElem.classList.contains('shepherd-enabled')).toBe(false);
      });
    });
  });

  describe('lazy attachTo evaluation', () => {
    // We test this using attachTo.element callback.
    // Note that lazy evaluation largely relies on `parseAttachTo`, however this does
    // not it's implementation, only if the callback is called lazily.
    it('lazily evaluates attachTo.element callback', () => {
      const step1AttachToCallback = spy();
      const step2AttachToCallback = spy();

      const instance = new Shepherd.Tour({
        steps: [
          {
            text: 'step 1',
            attachTo: { element: step1AttachToCallback, on: 'auto' }
          },
          {
            text: 'step 2',
            attachTo: { element: step2AttachToCallback, on: 'auto' }
          }
        ]
      });

      instance.start();
      expect(step1AttachToCallback.called).toBe(true);
      expect(step2AttachToCallback.called).toBe(false);
      instance.next();
      expect(step2AttachToCallback.called).toBe(true);
      expect(step1AttachToCallback.callCount).toBe(1);
      expect(step2AttachToCallback.callCount).toBe(1);
    });

    it('lazily evaluates attachTo.element selector', () => {
      const querySelectorAllSpy = spy(document, 'querySelectorAll');

      const instance = new Shepherd.Tour({
        steps: [
          {
            text: 'step 1',
            attachTo: { element: '#step-1-attach-to-element', on: 'auto' }
          },
          {
            text: 'step 2',
            attachTo: { element: '#step-2-attach-to-element', on: 'auto' }
          }
        ]
      });

      instance.start();
      expect(querySelectorAllSpy.calledWith('#step-1-attach-to-element')).toBe(
        true
      );
      expect(querySelectorAllSpy.calledWith('#step-2-attach-to-element')).toBe(
        false
      );
      instance.next();
      expect(querySelectorAllSpy.calledWith('#step-2-attach-to-element')).toBe(
        true
      );
    });

    it('evaluates attachTo on subsequent shows', () => {
      const step1AttachToCallback = spy();
      const step2AttachToCallback = spy();

      const instance = new Shepherd.Tour({
        steps: [
          {
            text: 'step 1',
            attachTo: { element: step1AttachToCallback, on: 'auto' }
          },
          {
            text: 'step 2',
            attachTo: { element: step2AttachToCallback, on: 'auto' }
          }
        ]
      });

      instance.start();
      expect(step1AttachToCallback.callCount).toBe(1);
      instance.next();
      instance.back();
      expect(step1AttachToCallback.callCount).toBe(2);
    });

    it('evaluates attachTo only once', () => {
      const instance = new Shepherd.Tour({
        steps: [
          {
            text: 'step 1',
            attachTo: { element: () => {}, on: 'auto' },
            id: 'step1'
          },
          {
            text: 'step 2',
            attachTo: { element: () => {}, on: 'auto' }
          }
        ]
      });

      instance.start();

      expect(instance.getCurrentStep().isOpen()).toBe(true);
      // Subsequent calls to the getter return the same object
      const result1 = instance.getCurrentStep()._getResolvedAttachToOptions();

      expect(result1).not.toBeNull();

      instance.next();

      const result2 = instance.getById('step1')._getResolvedAttachToOptions();

      expect(result1).toEqual(result2);
    });

    it('can evaluate _getResolvedAttachToOptions before step before-show phase', () => {
      const instance = new Shepherd.Tour({
        steps: [
          {
            text: 'step 1',
            attachTo: { element: () => {}, on: 'auto' }
          },
          {
            text: 'step 2',
            attachTo: { element: () => {}, on: 'auto' },
            id: 'step2'
          }
        ]
      });

      instance.start();

      expect(instance.getById('step2')._getResolvedAttachToOptions()).toEqual({
        element: undefined,
        on: 'auto'
      });
    });
  });
});
