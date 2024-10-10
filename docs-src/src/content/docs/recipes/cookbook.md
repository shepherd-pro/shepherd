---
title: Cookbook
---

### Disable Scroll

Previously, disabling scrolling was built into Shepherd, but it was buggy
and bulky, so we opted to remove [body-scroll-lock](https://github.com/willmcpo/body-scroll-lock)
as a dependency, in favor of users installing it directly in their apps. To disable scrolling,
you can install `body-scroll-lock` and run `bodyScrollLock.disableBodyScroll();` before
starting the tour, then `bodyScrollLock.clearAllBodyScrollLocks();` after stopping the tour.

### Highlighting multiple elements

Highlighting multiple elements is supported by Shepherd out of the box. You can pass an array of selectors to the `extraHighlights` option in the step configuration. This will highlight all the elements in the array as well as the target element defined in the `attachTo` option.

```javascript
const tour = new Shepherd.Tour({
  steps: [
    {
      text: 'This is a step with multiple highlights',
      attachTo: {
        element: '.target-element',
        on: 'bottom'
      },
      extraHighlights: ['.example-selector', '.example-selector-2']
    }
  ]
});
```

If an element to be highlighted is contained by another element that is also being highlighted, the contained element will not be highlighted. This is to prevent the contained element from being obscured by the containing element.

### Offsets

By default, FloatingUI instances are placed directly next to their target. However, if you need to apply some margin
between them or if you need to fine tune the position according to some custom logic, you can use an offset middleware.

For example:

```js
import { offset } from '@floating-ui/dom';

const tour = new Shepherd.Tour({
  steps: [
    {
      ...
      floatingUIOptions: {
        middleware: [offset({ mainAxis: 0, crossAxis: 12 })]
      }
      ...
    }
  ]
});
```

### Progress Indicator

Using the already exposed API, you could add a progress indicator of your choosing
for each step to let your users know how far into a tour they may be.

The example below uses the [Step](https://docs.shepherdjs.dev/api/step/classes/step/) `options`
object and adds to `when` on the `show` event. Within that, we create an element
to render in the header with text of what step out of all potential steps is now
being show.

```javascript
when: {
  show() {
    const currentStep = Shepherd.activeTour?.getCurrentStep();
    const currentStepElement = currentStep?.getElement();
    const header = currentStepElement?.querySelector('.shepherd-header');
    const progress = document.createElement('span');
    progress.style['margin-right'] = '315px';
    progress.innerText = `${Shepherd.activeTour?.steps.indexOf(currentStep) + 1}/${Shepherd.activeTour?.steps.length}`;
    header?.insertBefore(progress, currentStepElement.querySelector('.shepherd-cancel-icon'));
  }
}
```

Another example, for anyone who wants to add progress indicators to the footer. Add the `shepherd-progress` className and some extra styles.

```javascript
when: {
  show() {
    const currentStep = Shepherd.activeTour?.getCurrentStep();
    const currentStepElement = currentStep?.getElement();
    const footer = currentStepElement?.querySelector('.shepherd-footer');
    const progress = document.createElement('span');
    progress.className = 'shepherd-progress';
    progress.innerText = `${Shepherd.activeTour?.steps.indexOf(currentStep) + 1} of ${Shepherd.activeTour?.steps.length}`;
    footer?.insertBefore(progress, currentStepElement.querySelector('.shepherd-button:last-child'));
  }
}
```

```scss
.shepherd-footer {
  align-items: center;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  display: flex;
  justify-content: space-between;
  padding: 0 0.75rem 0.75rem;

  .shepherd-button:last-child {
    margin-right: 0;
  }

  .shepherd-progress {
    font-size: 0.8rem;
  }
}
```
