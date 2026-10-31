"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";

import {
  chartGenreName,
  chartGenresOf,
  OVERALL_GENRE,
  type ChartGenre,
  type ChartGenreGroup,
  type Store,
} from "@asobeast/shared";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GROUP_LABELS: Record<ChartGenreGroup, string> = {
  apps: "Apps",
  games: "Games",
  family: "Family",
};

function groupsOf(store: Store): Array<[ChartGenreGroup, ChartGenre[]]> {
  const groups = new Map<ChartGenreGroup, ChartGenre[]>();
  for (const genre of chartGenresOf(store)) {
    if (genre.id === OVERALL_GENRE) continue;
    groups.set(genre.group, [...(groups.get(genre.group) ?? []), genre]);
  }
  return [...groups];
}

export function GenreSelect({
  store,
  value,
  onChange,
}: {
  store: Store;
  value: string;
  onChange: (genre: string) => void;
}) {
  const locale = useInterfaceLanguage();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={componentCopy(locale, "Category")}
        className="w-[220px]"
      >
        <SelectValue>
          {value === OVERALL_GENRE
            ? componentCopy(locale, "Overall")
            : (chartGenreName(store, value) ?? value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={OVERALL_GENRE}>
          <LocalizedText en="Overall" />
        </SelectItem>
        {groupsOf(store).map(([group, genres]) => (
          <SelectGroup key={group}>
            <SelectLabel>
              {componentCopy(locale, GROUP_LABELS[group])}
            </SelectLabel>
            {genres.map((genre) => (
              <SelectItem key={genre.id} value={genre.id}>
                {genre.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
