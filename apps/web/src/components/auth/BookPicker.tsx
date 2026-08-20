import { getVenue, matchingRegion, REGION_PRESETS, selectableVenues } from '@ny-sharp-edge/shared';
import Chip from '@/components/common/Chip';

const GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'US books',
    ids: [
      'fanduel',
      'draftkings',
      'betmgm',
      'caesars',
      'betrivers',
      'fanatics',
      'espnbet',
      'hardrockbet',
      'thescore',
      'ballybet',
      'betparx',
      'bet365',
    ],
  },
  { label: 'Also', ids: ['bovada', 'betonlineag', 'pinnacle'] },
  { label: 'Exchanges', ids: ['kalshi', 'polymarket'] },
];

interface BookPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function BookPicker({ selected, onChange }: BookPickerProps) {
  const selectedSet = new Set(selected);
  const known = new Set(selectableVenues().map((v) => v.id));
  const region = matchingRegion(selected);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(selected.filter((b) => b !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label mb-2">Where do you bet?</p>
        <p className="font-mono text-[12px] text-ink-dim mb-2 leading-snug">
          A state just fills the shops you can open there. Drop any you don&apos;t have.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {REGION_PRESETS.map((preset) => (
            <Chip
              key={preset.id}
              active={region?.id === preset.id}
              onClick={() => onChange([...preset.books])}
            >
              {preset.shortLabel}
            </Chip>
          ))}
        </div>
      </div>

      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="label mb-2">{group.label}</p>
          <div className="grid grid-cols-2 gap-2">
            {group.ids.filter((id) => known.has(id)).map((id) => {
              const venue = getVenue(id);
              const on = selectedSet.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={`text-left px-3 py-3 rounded-2xl border min-w-0 ${
                    on
                      ? 'bg-moss text-[#eef2fb] border-line'
                      : 'bg-[#eef2fb] text-ink border-line'
                  }`}
                >
                  <span className="block font-display font-semibold text-[15px] leading-tight">
                    {venue.name}
                  </span>
                  <span className="block font-mono text-[11px] text-ink-dim mt-1">
                    {venue.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
