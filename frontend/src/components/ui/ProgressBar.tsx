export interface ProgressSegment {
  value: number;
  colorClass: string;
  label?: string;
}

export interface ProgressBarProps {
  segments: ProgressSegment[];
  max: number;
  heightClass?: string;
  markerPercent?: number;
  markerLabel?: string;
}

export function ProgressBar({
  segments,
  max,
  heightClass = 'h-2.5',
  markerPercent,
  markerLabel,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;

  const computedSegments = segments.reduce<Array<{ widthPct: number; colorClass: string; label?: string }>>(
    (acc, segment) => {
      const used = acc.reduce((sum, item) => sum + item.widthPct, 0);
      const rawPct = Math.max(0, (segment.value / safeMax) * 100);
      const clampedPct = Math.min(rawPct, Math.max(0, 100 - used));
      acc.push({
        widthPct: clampedPct,
        colorClass: segment.colorClass,
        label: segment.label,
      });
      return acc;
    },
    [],
  );

  return (
    <div className="relative w-full">
      <div
        className={[
          'w-full rounded-full bg-botanical-surface overflow-hidden flex',
          heightClass,
        ].join(' ')}
      >
        {computedSegments.map((segment, index) => {
          if (segment.widthPct <= 0) return null;
          return (
            <div
              key={`${segment.label ?? 'seg'}-${index}`}
              title={segment.label}
              style={{ width: `${segment.widthPct}%` }}
              className={['h-full transition-all duration-300', segment.colorClass].join(' ')}
            />
          );
        })}
      </div>
      {typeof markerPercent === 'number' && markerPercent > 0 && markerPercent < 100 ? (
        <div
          title={markerLabel}
          style={{ left: `${markerPercent}%` }}
          className="absolute -top-1 -bottom-1 w-0.5 bg-botanical-text/45 pointer-events-none"
        />
      ) : null}
    </div>
  );
}
