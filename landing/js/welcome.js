'use strict';

(function () {
  function init() {
    var shepherd = setupShepherd();
    setTimeout(function () {
      shepherd.start();
    }, 400);
  }

  function setupShepherd() {
    var shepherd = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: {
          enabled: true
        },
        classes: 'class-1 class-2',
        scrollTo: {
          behavior: 'smooth',
          block: 'center'
        }
      },
      // This should add the first tour step
      steps: [
        {
          text: '\n         <p>\n           Shepherd is a JavaScript library for guiding users through your app.\n           It uses <a href="https://floating-ui.com/" data-test-popper-link>Floating UI</a>,\n           another open source library, to render dialogs for each tour "step".\n         </p>\n        \n         <p>\n           Among many things, Floating UI makes sure your steps never end up off screen or cropped by an overflow.\n           (Try resizing your browser to see what we mean.)\n         </p>\n',
          attachTo: {
            element: '.hero-welcome',
            on: 'bottom'
          },
          buttons: [
            {
              action() {
                return this.cancel();
              },
              secondary: true,
              text: 'Exit'
            },
            {
              action() {
                return this.next();
              },
              text: 'Next'
            }
          ],
          id: 'welcome'
        }
      ],
      useModalOverlay: true
    });

    const element = document.createElement('p');
    element.innerText =
      'Including Shepherd is easy! Just include shepherd.js. The styles are bundled with the JS.';

    // These steps should be added via `addSteps`
    const steps = [
      {
        title: 'Including',
        text: element,
        attachTo: {
          element: '.hero-including',
          on: 'bottom'
        },
        buttons: [
          {
            action() {
              return this.back();
            },
            secondary: true,
            text: 'Back'
          },
          {
            action() {
              return this.next();
            },
            text: 'Next'
          }
        ],
        id: 'including'
      },
      {
        title: 'Creating a Shepherd Tour',
        text:
          'Creating a Shepherd tour is easy. too! ' +
          'Just create a `Tour` instance, and add as many steps as you want.',
        attachTo: {
          element: '.hero-example',
          on: 'right'
        },
        buttons: [
          {
            action() {
              return this.back();
            },
            secondary: true,
            text: 'Back'
          },
          {
            action() {
              return this.next();
            },
            text: 'Next'
          }
        ],
        id: 'creating'
      },
      {
        title: 'Attaching to Elements',
        text: 'Your tour steps can target and attach to elements in DOM (like this step).',
        attachTo: {
          element: '.hero-example',
          on: 'left'
        },
        buttons: [
          {
            action() {
              return this.back();
            },
            secondary: true,
            text: 'Back'
          },
          {
            action() {
              return this.next();
            },
            text: 'Next'
          }
        ],
        id: 'attaching'
      },
      {
        title: 'Highliting multiple Elements',
        text: 'Your tour steps can highlight multiple elements (like this step).',
        attachTo: {
          element: '.hero-multiple-select',
          on: 'bottom',
          multiple: true
        },
        buttons: [
          {
            action: function () {
              return this.back();
            },
            secondary: true,
            text: 'Back'
          },
          {
            action: function () {
              return this.next();
            },
            text: 'Next'
          }
        ],
        id: 'multiple-select'
      }
    ];

    shepherd.addSteps(steps);

    // This should add steps after the ones added with `addSteps`
    shepherd.addStep({
      title: 'Centered Shepherd Element',
      text: 'But attachment is totally optional!\n       Without a target, a tour step will create an element that\'s centered within the view.       Check out the <a href="https://shepherdjs.dev/docs/">documentation</a> to learn more.',
      buttons: [
        {
          action() {
            return this.back();
          },
          secondary: true,
          text: 'Back'
        },
        {
          action() {
            return this.next();
          },
          text: 'Next'
        }
      ],
      id: 'centered-example'
    });

    shepherd.addStep({
      title: 'Learn more',
      text: 'Star Shepherd on Github so you remember it for your next project',
      attachTo: {
        element: '.hero-followup',
        on: 'top'
      },
      buttons: [
        {
          action() {
            return this.back();
          },
          secondary: true,
          text: 'Back'
        },
        {
          action() {
            return this.next();
          },
          text: 'Done'
        }
      ],
      id: 'followup',
      modalOverlayOpeningPadding: '10'
    });
    return shepherd;
  }

  function ready() {
    if (
      document.attachEvent
        ? document.readyState === 'complete'
        : document.readyState !== 'loading'
    ) {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  }

  ready();
}.call(void 0));
