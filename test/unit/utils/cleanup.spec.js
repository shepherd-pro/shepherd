import { cleanupSteps } from '../../../shepherd.js/src/utils/cleanup';

describe('Cleanup Utils', function () {
  // Create some elements to use to attach to
  const firstAttachElement = document.createElement('div');
  firstAttachElement.classList.add('first-attach-to');
  firstAttachElement.classList.add('shepherd-target-click-disabled');
  document.body.appendChild(firstAttachElement);

  const secondAttachElement = document.createElement('div');
  secondAttachElement.classList.add('second-attach-to');
  secondAttachElement.classList.add('shepherd-target-click-disabled');
  document.body.appendChild(secondAttachElement);

  // Element with extra highlights
  const thirdAttachElement = document.createElement('div');
  thirdAttachElement.classList.add('third-attach-to');
  thirdAttachElement.classList.add('shepherd-target-click-disabled');
  document.body.appendChild(thirdAttachElement);

  // Extra highlight elements for the third step
  const extraHighlightElement = document.createElement('div');
  extraHighlightElement.classList.add('extra-highlight');
  extraHighlightElement.classList.add('shepherd-target-click-disabled');
  document.body.appendChild(extraHighlightElement);
  const extraHighlightElement2 = document.createElement('div');
  extraHighlightElement2.classList.add('extra-highlight');
  extraHighlightElement2.classList.add('shepherd-target-click-disabled');
  document.body.appendChild(extraHighlightElement2);

  const mockedTour = {
    steps: [
      {
        options: {
          attachTo: {
            element: '.first-attach-to',
            on: 'bottom'
          },
          canClickTarget: false
        },
        // Manually add the target. The tour would do this, if it were a real tour
        target: firstAttachElement
      },
      {
        options: {
          attachTo: {
            element: '.second-attach-to',
            on: 'bottom'
          },
          canClickTarget: false
        },
        // Manually add the target. The tour would do this, if it were a real tour
        target: secondAttachElement
      },
      {
        options: {
          attachTo: {
            element: '.third-attach-to',
            on: 'bottom'
          },
          canClickTarget: false
        },
        // Manually add the target. The tour would do this, if it were a real tour
        target: thirdAttachElement,
        // Add extra highlights
        _resolvedExtraHighlightElements: [
          extraHighlightElement,
          extraHighlightElement2
        ]
      }
    ]
  };

  describe('cleanupSteps', function () {
    it('cleans up steps and removes shepherd-target-click-disabled class', () => {
      expect(firstAttachElement).toHaveClass('shepherd-target-click-disabled');
      expect(secondAttachElement).toHaveClass('shepherd-target-click-disabled');
      expect(thirdAttachElement).toHaveClass('shepherd-target-click-disabled');
      expect(extraHighlightElement).toHaveClass(
        'shepherd-target-click-disabled'
      );
      expect(extraHighlightElement2).toHaveClass(
        'shepherd-target-click-disabled'
      );

      cleanupSteps(mockedTour);

      expect(firstAttachElement).not.toHaveClass(
        'shepherd-target-click-disabled'
      );
      expect(secondAttachElement).not.toHaveClass(
        'shepherd-target-click-disabled'
      );
      expect(thirdAttachElement).not.toHaveClass(
        'shepherd-target-click-disabled'
      );
      expect(extraHighlightElement).not.toHaveClass(
        'shepherd-target-click-disabled'
      );
      expect(extraHighlightElement2).not.toHaveClass(
        'shepherd-target-click-disabled'
      );
    });
  });
});
