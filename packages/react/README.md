# react

[![NPM](https://img.shields.io/npm/v/@shepherdpro/react.svg)](https://www.npmjs.com/package/@shepherdpro/react)

This is a React wrapper for the [Shepherd](https://github.com/@shepherdpro/react) tour library.
It's mainly a wrapper around the Shepherd library that exposes the tour object and methods to the context object
that can be passed into props for dynamic interactivity.

## Install

Use this simple NPM command or whatever package manager is your favorite.

```bash
npm install --save @shepherdpro/react
```

## Usage

### Via Provider/Context

```tsx
import { Component, useContext } from 'react';
import { ShepherdJourneyProvider, useShepherd } from '@shepherdpro/react';
import newSteps from './steps';

const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    }
  },
  useModalOverlay: true
};

function Button() {
  const shepherd = useShepherd(ShepherdTourContext);
  const tour = shepherd.Tour({
    ...tourOptions,
    steps: newSteps
  });

  return (
    <button className="button dark" onClick={tour.start}>
      Start Tour
    </button>
  );
}

export default function App() {
  return (
    <div>
      <ShepherdJourneyProvider>
        <Button />
      </ShepherdJourneyProvider>
    </div>
  );
}
```

## Configuration

The following configuration options for a tour can be set on the `useShepherd` hook to control the way that Shepherd is used. This is simply a POJO passed to Shepherd to use the options noted in the Shepherd Tour [options](https://shepherdjs.dev/docs/Tour.html). You can also pass an API Key to use [Shepherd Pro](https://shepherdpro.com) features for analytics related events tracking.

### apiKey

`PropTypes.string`
Used to connect your tours to a Pro instance to get additional user information and feedback.

## Steps

The options are the same as Shepherd [options](https://shepherdjs.dev/docs/Step.html).

## License

MIT
