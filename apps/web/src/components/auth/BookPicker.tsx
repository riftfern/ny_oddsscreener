import { getVenue, selectableVenues } from '@ny-sharp-edge/shared';

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

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(selected.filter((b) => b !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="label mb-2">{group.label}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.ids.filter((id) => known.has(id)).map((id) => {
              const venue = getVenue(id);
              const on = selectedSet.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={`text-left px-3 py-3 border ${
                    on
                      ? 'bg-moss text-ink border-moss'
                      : 'bg-transparent text-ink border-line hover:border-moss'
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
