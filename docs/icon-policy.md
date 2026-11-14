# Nawy Habit — icon selection policy

The habit picker is designed for a broad Arabic-speaking audience and follows a conservative,
faith-sensitive visual standard.

## Allowed direction

Use simple, respectful, neutral symbols for everyday activities and constructive intentions:
reading, water, walking, exercise, rest, food represented by ordinary cutlery, health, learning,
saving represented by a wallet, giving represented by hands holding a heart, and abstract positive motifs.

The picker uses an explicit allowlist in `src/lib/habits/appearance.ts`. The Zod schema accepts
only those icon identifiers; an arbitrary Material Symbol cannot be selected or saved.

## Do not add

- People or animals, including pictogram figures (walking, running, swimming, meditation poses). Prefer objects, nature and abstract marks.
- Symbols of other religions or practices (for example lotus, meditation or yoga imagery).

Do not add artwork depicting or promoting:

- Pigs or pork.
- Alcohol, wine, beer, liquor, bars, or drinking.
- Gambling, betting, or casinos.
- Sexual content, nudity, or suggestive imagery.
- Occult or satanic imagery, or religiously offensive depictions.
- Graphic violence, profanity, or other imagery unsuitable for a calm family-oriented product.

## Review before adding

1. Inspect the actual SVG artwork, not only its identifier or English label.
2. Check what it communicates in the Arabic UI and in the likely cultural context.
3. Prefer an unambiguous neutral symbol when a concept has multiple interpretations.
4. Keep the curated picker small; do not expose the entire upstream icon library.
5. When in doubt, leave the symbol out and choose a neutral alternative.

Retired symbols: `savings` (pig-shaped bank) and `redeem` (gift box). Existing saved habits and v3 backups using the gift symbol are automatically upgraded to the wallet and hand-with-heart identifiers.

Habit identity symbols are the **filled** Material Symbols variant, vendored in
`src/assets/icons/habit/` and rendered through `src/components/habit-icon.tsx`. Interface controls keep
the outlined set in `src/assets/icons/`. A test checks that the allowlist and the vendored files match.

Current approved picker set (37): `auto_awesome`, `mosque`, `menu_book`, `water_drop`, `wb_twilight`,
`wb_sunny`, `alarm`, `bedtime`, `footprint`, `pedal_bike` (no rider), `waves`, `sports_soccer`,
`fitness_center`, `favorite`, `monitor_heart`, `nutrition`, `restaurant` (cutlery only), `medication`,
`clean_hands`, `dentistry`, `shower`, `school`, `edit_note`, `translate`, `code`, `work`, `timer`,
`lightbulb`, `task_alt`, `emoji_events`, `palette`, `eco`, `cleaning_services`, `family_home`, `call`,
`account_balance_wallet` (wallet), and `volunteer_activism` (hands holding a heart). All artwork was
visually reviewed.

Retired from the picker: `directions_walk` and `self_improvement` (both show a human figure). Stored
habits move to `footprint` and `eco` through the Dexie v6 upgrade, and backups replace them on
import (`replaceLegacyHabitIcon`). The identifiers stay valid in the schema as a safety net.
