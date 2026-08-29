import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AI_TONES, type AiToneId } from "@/components/tools/ai/aiStyle";

/** Selettore del tono di voce e del livello di creatività dei testi AI. */
export function AiStyleControls({
  idPrefix,
  tone,
  onToneChange,
  creativity,
  onCreativityChange,
  disabled,
}: {
  idPrefix: string;
  tone: AiToneId;
  onToneChange: (tone: AiToneId) => void;
  creativity: number;
  onCreativityChange: (value: number) => void;
  disabled?: boolean | undefined;
}) {
  return (
    <div className="space-y-4 rounded-md border border-border bg-surface p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-tone`} className="text-xs">
          Tono di voce
        </Label>
        <Select value={tone} onValueChange={(v) => onToneChange(v as AiToneId)} disabled={disabled ?? false}>
          <SelectTrigger id={`${idPrefix}-tone`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_TONES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-creativity`} className="text-xs">
            Livello di creatività
          </Label>
          <span className="text-[11px] text-muted-foreground">{creativity} / 10</span>
        </div>
        <Slider
          id={`${idPrefix}-creativity`}
          min={1}
          max={10}
          step={1}
          value={[creativity]}
          disabled={disabled ?? false}
          onValueChange={(v) => onCreativityChange(v[0] ?? creativity)}
        />
        <p className="text-[11px] text-muted-foreground">
          Valori bassi restano molto aderenti ai contenuti del PDF; valori alti aggiungono immagini e
          ritmo più liberi.
        </p>
      </div>
    </div>
  );
}
