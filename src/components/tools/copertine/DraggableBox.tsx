import { type ReactNode, useRef } from "react";

/**
 * Elemento posizionabile a trascinamento libero sopra il canvas copertina.
 * Aggiorna top/left (in px, relativi al contenitore del canvas) tramite pointer events.
 */
export function DraggableBox({
  top,
  left,
  width,
  selected,
  onSelect,
  onMove,
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
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const dragState = useRef<{ startX: number; startY: number; top: number; left: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (["INPUT", "SELECT", "BUTTON", "TEXTAREA"].includes(target.tagName)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, top, left };
    onSelect();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    onMove(dragState.current.top + dy, dragState.current.left + dx);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragState.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={`absolute cursor-move touch-none select-none ${selected ? "outline outline-2 outline-offset-4 outline-accent" : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-accent/60"} ${className ?? ""}`}
      style={{ top, left, width, ...style }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  );
}
