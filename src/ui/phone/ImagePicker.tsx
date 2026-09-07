/**
 * A photo, framed for the phone.
 *
 * The same machinery as the headshot picker in character creation, pointed at
 * a different shape. A player brings whatever photo they have and it comes out
 * as one picture of one size, re-encoded small enough to live in a save: a
 * sixteen by nine thumbnail, a nine by sixteen cover for a short, a square for
 * a channel's circle, or a wide one for the top of a channel page.
 *
 * The photo is never stored as it arrived. It is drawn into the frame and
 * re-encoded, which fits it, strips whatever the camera wrote into it, and
 * stops a nine thousand pixel phone picture from turning a save into something
 * that will not fit in storage.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CANNOT_DECODE, CANNOT_ENCODE, CENTRED, MAX_ZOOM, clampPlacement, dataUrlBytes, describeRejection, drawRect,
  type Placement,
} from '@/ui/creation/portrait';

/** The shapes the phone needs, and how big each is stored. */
export const FRAMES = {
  thumbnail: { width: 480, height: 270, label: 'Thumbnail' },
  short: { width: 270, height: 480, label: 'Cover' },
  avatar: { width: 240, height: 240, label: 'Picture' },
  banner: { width: 720, height: 180, label: 'Banner' },
} as const;

export type FrameName = keyof typeof FRAMES;

/**
 * What to re-encode at. A thumbnail is seen at postage stamp size in a feed
 * and full width on a watch page, and 0.78 holds up at both while keeping a
 * hundred of them well under a megabyte between them.
 */
const JPEG_QUALITY = 0.78;

export function ImagePicker({
  frame, image, label, onChange,
}: {
  frame: FrameName;
  image: string | undefined;
  label: string;
  onChange: (image: string | undefined) => void;
}) {
  const { width, height } = FRAMES[frame];
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [placement, setPlacement] = useState<Placement>(CENTRED);
  const [problem, setProblem] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragFrom = useRef<{ x: number; y: number; placement: Placement } | null>(null);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const rect = drawRect(source.naturalWidth, source.naturalHeight, placement, width, height);
    context.drawImage(source, rect.x, rect.y, rect.width, rect.height);
  }, [source, placement, width, height]);

  useEffect(() => { paint(); }, [paint]);

  const commit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    try {
      onChange(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    } catch {
      setProblem(CANNOT_ENCODE);
    }
  }, [onChange, source]);

  useEffect(() => { if (source) commit(); }, [source, placement, commit]);

  const accept = useCallback((file: File) => {
    const rejection = describeRejection(file);
    if (rejection) { setProblem(rejection); return; }
    setProblem(undefined);
    setBusy(true);
    const url = URL.createObjectURL(file);
    const picture = new Image();
    picture.onload = () => {
      URL.revokeObjectURL(url);
      setSource(picture);
      setPlacement(CENTRED);
      setBusy(false);
    };
    picture.onerror = () => {
      URL.revokeObjectURL(url);
      setProblem(CANNOT_DECODE);
      setBusy(false);
    };
    picture.src = url;
  }, []);

  // Dragging inside the frame moves the photo within it.
  const onPointerDown = (event: React.PointerEvent) => {
    if (!source) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragFrom.current = { x: event.clientX, y: event.clientY, placement };
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const from = dragFrom.current;
    if (!from || !source) return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPlacement(clampPlacement({
      zoom: from.placement.zoom,
      offsetX: from.placement.offsetX + ((event.clientX - from.x) / Math.max(1, box.width)) * 2,
      offsetY: from.placement.offsetY + ((event.clientY - from.y) / Math.max(1, box.height)) * 2,
    }));
  };
  const endDrag = () => { dragFrom.current = null; };

  const clear = () => {
    setSource(null);
    setPlacement(CENTRED);
    setProblem(undefined);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  const bytes = image ? dataUrlBytes(image) : 0;

  return (
    <div className="ph-picker">
      <div
        className="ph-picker-frame"
        style={{ aspectRatio: `${width} / ${height}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) accept(file); }}
        title={source ? 'Drag to move the photo inside the frame' : undefined}
      >
        <canvas ref={canvasRef} width={width} height={height} hidden={!source} aria-label={source ? label : undefined} />
        {!source && image && <img src={image} alt={label} />}
        {!source && !image && (
          <button type="button" className="ph-picker-empty" onClick={() => inputRef.current?.click()}>
            {busy ? 'Opening…' : `Add A ${FRAMES[frame].label}`}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { const file = e.target.files?.[0]; if (file) accept(file); }}
      />

      <div className="ph-actions" style={{ padding: '8px 0 0' }}>
        <button type="button" className="ph-pill" onClick={() => inputRef.current?.click()}>
          {image || source ? 'Change Photo' : 'Choose A Photo'}
        </button>
        {source && (
          <>
            <button
              type="button"
              className="ph-pill"
              onClick={() => setPlacement((current) => clampPlacement({ ...current, zoom: current.zoom * 1.25 }))}
            >
              Zoom In
            </button>
            <button
              type="button"
              className="ph-pill"
              onClick={() => setPlacement((current) => clampPlacement({ ...current, zoom: current.zoom / 1.25 }))}
              disabled={placement.zoom <= 1}
            >
              Zoom Out
            </button>
          </>
        )}
        {(image || source) && (
          <button type="button" className="ph-pill" onClick={clear}>Remove</button>
        )}
      </div>

      {problem && <p className="ph-card-meta" style={{ color: 'var(--ph-red)' }}>{problem}</p>}
      {bytes > 0 && !problem && (
        <p className="ph-card-meta">
          {Math.round(bytes / 1024)} KB, framed to {width} by {height}.
          {placement.zoom > 1 && ` Zoomed ${placement.zoom.toFixed(1)}×, and it will not go past ${MAX_ZOOM}×.`}
        </p>
      )}
    </div>
  );
}
