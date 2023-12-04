import ShepherdModal from '../../../src/js/components/shepherd-modal.svelte';
import { stub } from 'sinon';

const classPrefix = '';

describe('components/ShepherdModal', () => {
  const elementMock = {
    getBoundingClientRect() {
        return {
          height: 250,
          x: 20,
          y: 20,
          width: 500
        };
    }
  };
  describe('closeModalOpening()', function() {
    it('sets values back to 0', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      await modalComponent.positionModal(0, 0, null, [elementMock]);

      let modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768ZM20,20a0,0,0,0,0-0,0V270a0,0,0,0,0,0,0H520a0,0,0,0,0,0-0V20a0,0,0,0,0-0-0Z'
      );

      await modalComponent.closeModalOpening();

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      modalComponent.$destroy();
    });
  });

  describe('positionModal()', function() {
    it('sets the correct attributes when positioning modal opening', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      let modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      await modalComponent.closeModalOpening();

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      await modalComponent.positionModal(0, 0, null, [elementMock]);

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768ZM20,20a0,0,0,0,0-0,0V270a0,0,0,0,0,0,0H520a0,0,0,0,0,0-0V20a0,0,0,0,0-0-0Z'
      );

      modalComponent.$destroy();
    });

    it('sets the correct attributes with padding', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      let modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      await modalComponent.positionModal(10, 0, null, [elementMock]);

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768ZM10,10a0,0,0,0,0-0,0V280a0,0,0,0,0,0,0H530a0,0,0,0,0,0-0V10a0,0,0,0,0-0-0Z'
      );

      modalComponent.$destroy();
    });

    it('sets the correct attributes when positioning modal opening with border radius as number', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      let modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      await modalComponent.closeModalOpening();

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      await modalComponent.positionModal(0, 10, null, [elementMock]);

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768ZM30,20a10,10,0,0,0-10,10V260a10,10,0,0,0,10,10H510a10,10,0,0,0,10-10V30a10,10,0,0,0-10-10Z'
      );

      modalComponent.$destroy();
    });

    it('sets the correct attributes when positioning modal opening with border radius as object', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      let modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      await modalComponent.closeModalOpening();

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768Z'
      );

      await modalComponent.positionModal(
        0,
        { topLeft: 1, bottomLeft: 2, bottomRight: 3 },
        null,
        [{
          getBoundingClientRect() {
            return {
              height: 250,
              x: 20,
              y: 20,
              width: 500
            };
          }
        }]
      );

      modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768ZM21,20a1,1,0,0,0-1,1V268a2,2,0,0,0,2,2H517a3,3,0,0,0,3-3V20a0,0,0,0,0-0-0Z'
      );

      modalComponent.$destroy();
    });

    it('sets the correct attributes when target is overflowing from scroll parent', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      await modalComponent.positionModal(
        0,
        0,
        {
          getBoundingClientRect() {
            return {
              height: 250,
              x: 10,
              y: 100,
              width: 500
            };
          }
        },
        [{
          getBoundingClientRect() {
            return {
              height: 500,
              x: 10,
              y: 10,
              width: 500
            };
          }
        }]
      );

      const modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768ZM10,100a0,0,0,0,0-0,0V350a0,0,0,0,0,0,0H510a0,0,0,0,0,0-0V100a0,0,0,0,0-0-0Z'
      );

      modalComponent.$destroy();
    });

    it('sets the correct attributes when target fits inside scroll parent', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      await modalComponent.positionModal(
        0,
        0,
        {
          getBoundingClientRect() {
            return {
              height: 500,
              x: 10,
              y: 10,
              width: 500
            };
          }
        },
        [{
          getBoundingClientRect() {
            return {
              height: 250,
              x: 10,
              y: 100,
              width: 500
            };
          }
        }]
      );

      const modalPath = modalComponent.getElement().querySelector('path');
      expect(modalPath).toHaveAttribute(
        'd',
        'M1024,768H0V0H1024V768ZM10,100a0,0,0,0,0-0,0V350a0,0,0,0,0,0,0H510a0,0,0,0,0,0-0V100a0,0,0,0,0-0-0Z'
      );

      modalComponent.$destroy();
    });
  });

  describe('setupForStep()', function() {
    let hideStub, showStub;

    afterEach(() => {
      hideStub.restore();
      showStub.restore();
    });

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('useModalOverlay: false, hides modal', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      const step = {
        options: {},
        tour: {
          options: {
            useModalOverlay: false
          }
        }
      };
      hideStub = stub(modalComponent, 'hide');
      showStub = stub(modalComponent, 'show');
      await modalComponent.setupForStep(step);

      expect(hideStub.called).toBe(true);
      expect(showStub.called).toBe(false);

      modalComponent.$destroy();
    });

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('useModalOverlay: true, shows modal', async() => {
      const modalComponent = new ShepherdModal({
        target: document.body,
        props: {
          classPrefix
        }
      });

      const step = {
        options: {},
        tour: {
          options: {
            useModalOverlay: true
          }
        }
      };
      hideStub = stub(modalComponent, 'hide');
      showStub = stub(modalComponent, 'show');
      await modalComponent.setupForStep(step);

      expect(hideStub.called).toBe(false);
      expect(showStub.called).toBe(true);

      modalComponent.$destroy();
    });
  });

  describe('show/hide', function() {
    const modalComponent = new ShepherdModal({
      target: document.body,
      props: {
        classPrefix
      }
    });

    it('show adds classes', async() => {
      await modalComponent.show();

      expect(modalComponent.getElement()).toHaveClass(
        'shepherd-modal-is-visible'
      );
    });

    it('hide removes classes', async() => {
      await modalComponent.hide();

      expect(modalComponent.getElement()).not.toHaveClass(
        'shepherd-modal-is-visible'
      );

      modalComponent.$destroy();
    });
  });
});
