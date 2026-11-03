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

Retired symbols: `savings` (pig-shaped bank) and `volunteer_activism` (hands holding a heart). Existing saved habits and v3 backups using the gift symbol are automatically upgraded to the wallet and hand-with-heart identifiers.

Current approved picker set: `auto_awesome`, `menu_book`, `water_drop`,
`directions_walk`, `fitness_center`, `self_improvement`, `bedtime`, `restaurant`
(cutlery only), `favorite`, `school`, `account_balance_wallet` (wallet), and `redeem` (gift box).
