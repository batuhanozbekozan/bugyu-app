import { createContext } from 'react';

export const PlantContext = createContext({
  plants: [],
  addPlant: () => {},
  updatePlant: () => {},
  deletePlant: () => {},
  logCare: () => {},
});
