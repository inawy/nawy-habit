import { Icon } from "@/components/icon";
import { num } from "@/lib/format/numbers";

/** "3 of 5 today" with a thin bar; calm acknowledgement when everything is done. */
export function TodayProgress({ done, total }: { done: number; total: number }) {
  if (total <= 0) return null;
  const complete = done >= total;
  const percent = Math.min(100, Math.round((done / total) * 100));

  return (
    <div className="mt-3" data-complete={complete}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {complete && <Icon name="check" className="size-4 text-primary" />}
          {complete ? "أتممت عاداتك كلها اليوم" : `${num(done)} من ${num(total)} اليوم`}
        </span>
        <span className="tabular-nums text-muted-foreground">{num(percent)}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="تقدّم عادات اليوم"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(done, total)}
        aria-valuetext={`${num(done)} من ${num(total)}`}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
