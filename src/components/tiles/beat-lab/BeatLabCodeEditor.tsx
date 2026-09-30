"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";

interface BeatLabCodeEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  describedBy?: string;
}

export function BeatLabCodeEditor({
  id,
  value,
  onChange,
  onBlur,
  textareaRef,
  describedBy,
}: BeatLabCodeEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = useMemo(() => Math.max(1, value.split("\n").length), [value]);

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const gutter = gutterRef.current;
    if (!ta || !gutter) return;
    gutter.scrollTop = ta.scrollTop;
  }, [textareaRef]);

  useEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const ta = event.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(next);
      window.requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const lines = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount],
  );

  return (
    <div
      className="beat-lab-editor-stack"
    >
      <div className="beat-lab-editor-row">
        <div
          ref={gutterRef}
          className="beat-lab-editor-gutter"
          aria-hidden
        >
          {lines.map((n) => (
            <span key={n} className="beat-lab-editor-line-num">
              {n}
            </span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          id={id}
          className="beat-lab-editor beat-lab-editor--mono"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          aria-label="Pattern"
          aria-describedby={describedBy}
        />
      </div>
    </div>
  );
}
