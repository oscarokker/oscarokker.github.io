import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

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

  const cleanup = useRef<(() => void) | null>(null);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (event.button !== 0) return;
      
      const pointerId = event.pointerId;
      
      gestureState.current = {
        startX: event.clientX,
        startY: event.clientY,
        isDragging: false,
        pointerId,
      };

      // Fire immediate callback for visual feedback (e.g., ripples)
      onPointerDownImmediate?.(event);

      // Track move/up/cancel via window listeners in capture phase
      // so we see movement even if finger leaves the tile, without capturing
      const handleWindowPointerMove = (e: PointerEvent) => {
        const state = gestureState.current;
        if (state.pointerId !== e.pointerId) return;
        if (state.isDragging) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > DRAG_THRESHOLD) {
          state.isDragging = true;
          // Create a synthetic React event-like object for the callback
          onDragStart?.({ ...e, currentTarget: event.currentTarget } as any);
        }
      };

      const handleWindowPointerUp = (e: PointerEvent) => {
        const state = gestureState.current;
        if (state.pointerId !== e.pointerId) return;

        const wasDragging = state.isDragging;
        
        // Reset state
        gestureState.current = {
          startX: 0,
          startY: 0,
          isDragging: false,
          pointerId: null,
        };

        // Remove listeners
        cleanup.current?.();
        cleanup.current = null;

        if (wasDragging) {
          onDragEnd?.();
        } else {
          // Create a synthetic React event-like object for the callback
          onTap?.({ ...e, currentTarget: event.currentTarget } as any);
        }
      };

      const handleWindowPointerCancel = (e: PointerEvent) => {
        if (gestureState.current.pointerId !== e.pointerId) return;

        const wasDragging = gestureState.current.isDragging;
        
        gestureState.current = {
          startX: 0,
          startY: 0,
          isDragging: false,
          pointerId: null,
        };

        // Remove listeners
        cleanup.current?.();
        cleanup.current = null;

        if (wasDragging) {
          onDragEnd?.();
        }
      };

      window.addEventListener('pointermove', handleWindowPointerMove, { capture: true });
      window.addEventListener('pointerup', handleWindowPointerUp, { capture: true });
      window.addEventListener('pointercancel', handleWindowPointerCancel, { capture: true });

      cleanup.current = () => {
        window.removeEventListener('pointermove', handleWindowPointerMove, { capture: true });
        window.removeEventListener('pointerup', handleWindowPointerUp, { capture: true });
        window.removeEventListener('pointercancel', handleWindowPointerCancel, { capture: true });
      };
    },
    [onPointerDownImmediate, onTap, onDragStart, onDragEnd],
  );

  // Cleanup window listeners on unmount
  useEffect(() => {
    return () => {
      cleanup.current?.();
    };
  }, []);

  return {
    pointerHandlers: {
      onPointerDown: handlePointerDown,
    },
    isDragging: () => gestureState.current.isDragging,
  };
}
