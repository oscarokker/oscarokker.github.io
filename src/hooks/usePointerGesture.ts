import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";

interface PointerGestureCallbacks<T = Element> {
  onTap?: (event: ReactPointerEvent<T>) => void;
  onDragStart?: (event: ReactPointerEvent<T>) => void;
  onDragEnd?: () => void;
  onPointerDownImmediate?: (event: ReactPointerEvent<T>) => void;
}

interface PointerGestureState {
  startX: number;
  startY: number;
  isDragging: boolean;
  pointerId: number | null;
}

const DRAG_THRESHOLD = 10; // pixels

/**
 * Hook to distinguish pointer taps from drags/scrolls.
 * Only triggers onTap if the pointer hasn't moved more than DRAG_THRESHOLD pixels.
 * Triggers onDragStart when movement exceeds threshold.
 */
export function usePointerGesture<T extends Element = Element>({
  onTap,
  onDragStart,
  onDragEnd,
  onPointerDownImmediate,
}: PointerGestureCallbacks<T>) {
  const gestureState = useRef<PointerGestureState>({
    startX: 0,
    startY: 0,
    isDragging: false,
    pointerId: null,
  });

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (event.button !== 0) return;
      
      gestureState.current = {
        startX: event.clientX,
        startY: event.clientY,
        isDragging: false,
        pointerId: event.pointerId,
      };

      // Capture pointer to track movement even outside element
      event.currentTarget.setPointerCapture?.(event.pointerId);
      
      // Fire immediate callback for visual feedback (e.g., ripples)
      onPointerDownImmediate?.(event);
    },
    [onPointerDownImmediate],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<T>) => {
      const state = gestureState.current;
      if (state.pointerId !== event.pointerId) return;
      if (state.isDragging) return;

      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > DRAG_THRESHOLD) {
        state.isDragging = true;
        onDragStart?.(event);
      }
    },
    [onDragStart],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<T>) => {
      const state = gestureState.current;
      if (state.pointerId !== event.pointerId) return;

      const wasDragging = state.isDragging;
      
      // Reset state
      gestureState.current = {
        startX: 0,
        startY: 0,
        isDragging: false,
        pointerId: null,
      };

      if (wasDragging) {
        onDragEnd?.();
      } else {
        onTap?.(event);
      }
    },
    [onTap, onDragEnd],
  );

  const handlePointerCancel = useCallback(() => {
    const wasDragging = gestureState.current.isDragging;
    
    gestureState.current = {
      startX: 0,
      startY: 0,
      isDragging: false,
      pointerId: null,
    };

    if (wasDragging) {
      onDragEnd?.();
    }
  }, [onDragEnd]);

  return {
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
    isDragging: () => gestureState.current.isDragging,
  };
}
