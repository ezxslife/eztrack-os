/**
 * useWizard — Generic multi-step wizard hook.
 *
 * Unlike EZXS-OS's event-creation-specific wizard, this is a generic
 * step-management hook that any multi-step flow can use (incident creation,
 * dispatch setup, report generation, etc.).
 *
 * Usage:
 *   const steps = ['basics', 'location', 'details', 'review'] as const;
 *   const wizard = useWizard({ steps, validate });
 *   <GlassStepper steps={steps} currentIndex={wizard.currentIndex} />
 *   <Button disabled={!wizard.canProceed} onPress={wizard.goNext} />
 */
import { useCallback, useMemo, useState } from 'react';
import { haptics } from '@/lib/haptics';

interface UseWizardOptions<S extends string> {
  /** Ordered list of step identifiers. */
  steps: readonly S[];
  /** Optional validator — return true if the current step is complete. */
  validate?: (step: S) => boolean;
  /** Called when wizard advances past the last step. */
  onComplete?: () => void;
}

export function useWizard<S extends string>(options: UseWizardOptions<S>) {
  const { steps, validate, onComplete } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<S>>(new Set());

  const currentStep = steps[currentIndex];

  const canProceed = useMemo(() => {
    if (!validate) return true;
    return validate(currentStep);
  }, [currentStep, validate]);

  const goNext = useCallback(() => {
    haptics.light();
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete?.();
    }
  }, [currentIndex, currentStep, steps.length, onComplete]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const goToStep = useCallback(
    (step: S) => {
      const idx = steps.indexOf(step);
      if (idx >= 0) setCurrentIndex(idx);
    },
    [steps],
  );

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setCompletedSteps(new Set());
  }, []);

  return {
    currentStep,
    currentIndex,
    totalSteps: steps.length,
    completedSteps,
    canProceed,
    isFirstStep: currentIndex === 0,
    isLastStep: currentIndex === steps.length - 1,
    goNext,
    goBack,
    goToStep,
    reset,
  };
}
