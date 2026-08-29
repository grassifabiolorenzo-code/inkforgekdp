import { type ReactNode, useRef } from "react";

/**
 * Elemento posizionabile a trascinamento libero sopra il canvas copertina.
 * Aggiorna top/left (in px, relativi al contenitore del canvas) tramite pointer events.
 * Se `onResize` è fornito, mostra una maniglia in basso a destra per ridimensionare la larghezza.
 */
export function DraggableBox({
  top,
  left,
  width,
  selected,
  onSelect,
  onMove,
  onResize,
  locked = false,
  className,
  style,
  children,
}: {
  top: number;
  left: number;
  width?: number | string;
  selected: boolean;
  onSelect: () => void;
  onMove: (top: number, left: number) => void;
  onResize?: (width: number) => void;
  /** Se true l'elemento non è né trascinabile né ridimensionabile. */
  locked?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const dragState = useRef<{ startX: number; startY: number; top: number; left: number } | null>(null);
  const resizeState = useRef<{ startX: number; width: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (locked) return;
    const target = e.target as HTMLElement;
    if (["INPUT", "SELECT", "BUTTON", "TEXTAREA"].includes(target.tagName)) return;
    // Evita che il click bubbli fino al canvas, che deselezionerebbe subito l'elemento.
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, top, left };
    onSelect();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (resizeState.current && onResize) {
      const dx = e.clientX - resizeState.current.startX;
      onResize(Math.max(40, resizeState.current.width + dx));
      return;
    }
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    onMove(dragState.current.top + dy, dragState.current.left + dx);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragState.current = null;
    resizeState.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function handleResizeDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    const parent = e.currentTarget.parentElement;
    const currentWidth = typeof width === "number" ? width : (parent?.offsetWidth ?? 0);
    resizeState.current = { startX: e.clientX, width: currentWidth };
    (e.currentTarget.parentElement as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
    onSelect();
  }

  return (
    <div
      className={`absolute touch-none select-none ${locked ? "cursor-default" : "cursor-move"} ${selected ? "outline outline-2 outline-offset-4 outline-accent" : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-accent/60"} ${className ?? ""}`}
      style={{ top, left, width, ...style }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
      {onResize && selected && !locked && (
        <div
          role="presentation"
          onPointerDown={handleResizeDown}
          className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-full border-2 border-background bg-accent"
        />
      )}
    </div>
  );
}
