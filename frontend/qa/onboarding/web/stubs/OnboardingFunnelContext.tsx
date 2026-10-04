import { useState } from 'react';
const w: any = window;
export const useOnboardingFunnel = () => {
  const [, force] = useState(0);
  return {
    answers: w.__answers,
    setV3: (d: any) => { Object.assign(w.__answers, d); force((x) => x + 1); },
    setFirstName: (n: string) => { w.__answers.firstName = n; },
    markStepEntered: () => undefined,
    consumeStepDuration: () => 0,
    markCompleted: async () => undefined,
  };
};
export const readHasCompletedFunnel = async () => true;
