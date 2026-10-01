import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A horizontally scrollable row that supports finger swipe (touch) and
 * mouse drag, with scroll-snap and hidden scrollbars. Arrow buttons appear
 * on desktop when there is more content to scroll.
 */
export default function SwipeableRow({ children, className = "", itemClassName = "" }) {
  const scrollRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Mouse drag-to-scroll
  const dragState = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateArrows]);

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const onMouseDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = {
      down: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const onMouseMove = (e) => {
    if (!dragState.current.down) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 4) dragState.current.moved = true;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const endDrag = () => { dragState.current.down = false; };

  return (
    <div className={`relative group/row ${className}`}>
      {/* Arrow buttons (desktop only) */}
      {canPrev && (
        <button
          onClick={() => scrollByAmount(-1)}
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass shadow-lg items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-150"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canNext && (
        <button
          onClick={() => scrollByAmount(1)}
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass shadow-lg items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-150"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="scrollbar-hide flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 select-none"
        style={{ cursor: "grab", touchAction: "pan-x" }}
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className={`snap-start flex-shrink-0 ${itemClassName}`}>
                {child}
              </div>
            ))
          : <div className="snap-start flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}