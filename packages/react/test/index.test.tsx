import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ShepherdJourneyProvider, useShepherd } from '../src/index.tsx';

const steps = [
  {
    id: 'welcome',
    text: [
      `
      Shepherd is a JavaScript library for guiding users through your app.
      It uses <a href="https://atomiks.github.io/tippyjs//">Tippy.js</a>,
      another open source library, to render dialogs for each tour "step".
    `,
      `
      Among many things, Tippy makes sure your steps never end up off screen or cropped by an overflow.
      Try resizing your browser to see what we mean.
    `
    ],
    classes: 'shepherd shepherd-welcome',
    buttons: [
      {
        type: 'cancel',
        classes: 'shepherd-button-secondary',
        text: 'Exit'
      },
      {
        type: 'next',
        text: 'Next'
      }
    ]
  }
];
const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    }
  },
  useModalOverlay: true
};

describe('<ShepherdTour />', () => {
  it('exists', () => {
    expect(ShepherdJourneyProvider).toBeTruthy();
  });

  it('renders the component, creates the Tour, and it can be started', async () => {
    const Button = () => {
      const shepherd = useShepherd();
      const tour = new shepherd.Tour(tourOptions);
      tour.addSteps(steps);

      return (
        <button className='button dark' type='button' onClick={tour.start}>
          Start Tour
        </button>
      );
    };
    const TestApp = () => (
      <ShepherdJourneyProvider apiKey={'sh_thisIsAnAmazingKey123'}>
        <Button />
      </ShepherdJourneyProvider>
    );

    const container = render(<TestApp />);
    await fireEvent.click(container.getByText(/Start Tour/));

    const cancelBtn = await container.findByText('Exit');
    const nextBtn = await container.findByText('Next');

    expect(cancelBtn).toBeTruthy();
    expect(nextBtn).toBeTruthy();
  });
});
