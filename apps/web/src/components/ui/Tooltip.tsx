"use client";

import { type ReactNode, useState, useRef, useEffect } from "react";
import clsx from "clsx";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: string;
  position?: TooltipPosition;
  children: ReactNode;
}

const positionStyles: Record<
  TooltipPosition,
  { container: string; arrow: string }
> = {
  top: {
    container: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    arrow:
      "top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent",
  },
  bottom: {
    container: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    arrow:
      "bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent",
  },
  left: {
    container: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    arrow:
      "left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent",
  },
  right: {
    container: "left-full top-1/2 -translate-y-1/2 ml-1.5",
    arrow:
      "right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent",
  },
};

export function Tooltip({
  content,
  position = "top",
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = () => {
    clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => {
      setVisible(true);
      setShow(true);
    }, 200);
  };

  const handleLeave = () => {
    clearTimeout(enterTimer.current);
    setShow(false);
    leaveTimer.current = setTimeout(() => {
      setVisible(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      clearTimeout(enterTimer.current);
      clearTimeout(leaveTimer.current);
    };
  }, []);

  const pos = positionStyles[position];

  // Inverted colors: dark bg in light, light bg in dark
  const bgClass = "bg-[#18181b] dark:bg-[#f4f4f5]";
  const textClass = "text-[#f4f4f5] dark:text-[#18181b]";
  const arrowBorderColor: Record<TooltipPosition, string> = {
    top: "border-t-[#18181b] dark:border-t-[#f4f4f5]",
    bottom: "border-b-[#18181b] dark:border-b-[#f4f4f5]",
    left: "border-l-[#18181b] dark:border-l-[#f4f4f5]",
    right: "border-r-[#18181b] dark:border-r-[#f4f4f5]",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={clsx(
            "absolute z-50 pointer-events-none whitespace-nowrap",
            "px-2 py-1 rounded-md",
            "text-[11px] font-medium leading-tight",
            bgClass,
            textClass,
            pos.container,
            show ? "opacity-100" : "opacity-0",
            "transition-opacity duration-100"
          )}
        >
          {content}
          <span
            className={clsx(
              "absolute w-0 h-0",
              pos.arrow,
              arrowBorderColor[position]
            )}
          />
        </div>
      )}
    </div>
  );
}
