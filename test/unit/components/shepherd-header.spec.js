import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { spy } from 'sinon';
import ShepherdHeader from '../../../src/js/components/shepherd-header.svelte';
import { Tour } from '../../../src/js/tour';
import { Step } from '../../../src/js/step';

describe('components/ShepherdHeader', () => {
  beforeEach(cleanup);

  it('cancel icon is added when cancelIcon.enabled === true', () => {
    const step = {
      options: {
        cancelIcon: {
          enabled: true
        }
      }
    };

    const { container } = render(ShepherdHeader, {
      props: {
        step
      }
    });

    const cancelIcon = container.querySelector('.shepherd-cancel-icon');
    expect(cancelIcon).toBeInTheDocument();
    expect(cancelIcon).toHaveAttribute('aria-label', 'Close Tour');
    expect(cancelIcon).toHaveAttribute('type', 'button');
  });

  it('cancel icon is not added when cancelIcon.enabled === false', () => {
    const step = {
      options: {
        cancelIcon: {
          enabled: false
        }
      }
    };

    const { container } = render(ShepherdHeader, {
      props: {
        step
      }
    });

    const cancelIcon = container.querySelector('.shepherd-cancel-icon');

    expect(cancelIcon).not.toBeInTheDocument();
  });

  it('cancel icon aria-label overridden when cancelIcon.label is set', () => {
    const step = {
      options: {
        cancelIcon: {
          enabled: true,
          label: 'Test'
        }
      }
    };

    const { container } = render(ShepherdHeader, {
      props: {
        step
      }
    });

    expect(container.querySelector('.shepherd-cancel-icon')).toHaveAttribute('aria-label', 'Test');
  });

  it('cancel icon cancels the tour', async() => {
    const tour = new Tour();
    const step = new Step(tour, {
      cancelIcon: {
        enabled: true
      }
    });
    const stepCancelSpy = spy(step, 'cancel');

    const { container } = render(ShepherdHeader, {
      props: {
        step
      }
    });

    fireEvent.click(container.querySelector('.shepherd-cancel-icon'));
    expect(stepCancelSpy.called).toBe(true);
  });
});
