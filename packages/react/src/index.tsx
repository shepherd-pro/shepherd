import { createContext, FC, useContext, type ReactNode } from 'react';

import ShepherdPro from '@shepherdpro/pro-js';

interface ShepherdProviderProps {
  apiKey?: string;
  children?: ReactNode;
}

interface ShepherdContextType {
  Shepherd: ShepherdPro;
}

const ShepherdJourneyContext = createContext<ShepherdContextType | undefined>(
  undefined
);
const ShepherdJourneyContextConsumer = ShepherdJourneyContext.Consumer;

export const useShepherd = (): ShepherdPro => {
  const context = useContext(ShepherdJourneyContext);
  if (!context) {
    throw new Error(
      'useShepherd must be used within a ShepherdJourneyProvider'
    );
  }

  const { Shepherd: shepherd } = context;

  return shepherd;
};

export const ShepherdJourneyProvider: FC<ShepherdProviderProps> = ({
  apiKey,
  children
}: ShepherdProviderProps) => {
  const shepherdInstance = ShepherdPro.init(apiKey);

  return (
    <ShepherdJourneyContext.Provider value={{ Shepherd: shepherdInstance }}>
      {children}
    </ShepherdJourneyContext.Provider>
  );
};

// For backwards compatibility, we're also exporting consumer and context
export {
  ShepherdJourneyContextConsumer as JourneyMethods,
  ShepherdJourneyContext
};
