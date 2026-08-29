import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FONTS_DATABASE, FX_EFFECTS } from "./constants";
import type { TextElementState } from "./types";

/** Pannello di editing per un elemento testo (font, colore, dimensione, effetto). */
export function TextFieldEditor({
  title,
  value,
  onChange,
  sizeMin = 8,
  sizeMax = 96,
  multiline,
}: {
  title: string;
  value: TextElementState;
  onChange: (next: TextElementState) => void;
  sizeMin?: number;
  sizeMax?: number;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-3.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-accent">{title}</h3>
      {multiline ? (
        <textarea
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          rows={3}
          className="w-full resize-none rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
        />
      ) : (
        <Input value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} className="text-xs" />
      )}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Font</Label>
          <Select value={value.font} onValueChange={(font) => onChange({ ...value, font })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {FONTS_DATABASE.map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Colore</Label>
          <input
            type="color"
            value={value.color}
            onChange={(e) => onChange({ ...value, color: e.target.value })}
            className="h-8 w-full cursor-pointer rounded border border-border bg-transparent"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Dim. ({value.size}px)</Label>
          <Slider
            min={sizeMin}
            max={sizeMax}
            step={1}
            value={[value.size]}
            onValueChange={([size]) => onChange({ ...value, size: size ?? value.size })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Effetto Stile FX</Label>
        <Select value={value.fx} onValueChange={(fx) => onChange({ ...value, fx: fx as TextElementState["fx"] })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FX_EFFECTS.map((fx) => (
              <SelectItem key={fx.id} value={fx.id}>
                {fx.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
