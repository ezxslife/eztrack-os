import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (isMounted) {
        setReducedMotion(value);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
