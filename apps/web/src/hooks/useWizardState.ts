"use client";

import { useState, useCallback } from "react";

interface WizardStep {
  id: string;
  label: string;
}

interface UseWizardStateOptions {
  steps: WizardStep[];
  onComplete?: (data: Record<string, unknown>) => void;
}

/**
 * Multi-step wizard state management.
 * Tracks current step, accumulated data across steps,
 * and provides navigation with optional validation gates.
 *
 * Usage:
 *   const wizard = useWizardState({
 *     steps: [{ id: 'type', label: 'Classification' }, ...],
 *   });
 *
 *   wizard.setStepData({ incidentType: 'Medical' });
 *   wizard.next(); // or wizard.back();
 */
export function useWizardState({ steps, onComplete }: UseWizardStateOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>({});

  const currentStep = steps[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const setStepData = useCallback(
    (stepData: Record<string, unknown>) => {
      setData((prev) => ({ ...prev, ...stepData }));
    },
    []
  );

  const next = useCallback(() => {
    if (isLastStep) {
      onComplete?.(data);
      return;
    }
    setCurrentIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [isLastStep, data, onComplete, steps.length]);

  const back = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        setCurrentIndex(index);
      }
    },
    [steps.length]
  );

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setData({});
  }, []);

  return {
    currentStep,
    currentIndex,
    steps,
    data,
    isFirstStep,
    isLastStep,
    progress,
    setStepData,
    next,
    back,
    goTo,
    reset,
  } as const;
}
