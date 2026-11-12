# Nawy Habit

متتبع عادات يومي ضمن منظومة ناوي. يعمل محليًا أولًا، ويدعم الاستخدام دون اتصال بعد تحميل التطبيق، ولا يحتاج إلى حساب أو Backend لتسجيل العادات.

## Development

المشروع يستخدم Bun وملف `bun.lock` المقفل. ثبّت Bun ثم نفّذ:

```sh
git clone https://github.com/inawy/nawy-habit.git
cd nawy-habit
bun install --frozen-lockfile
bun run dev
```

## Quality checks

```sh
bun run lint
bun run typecheck
bun run test
bun run build
# أو lint + typecheck + tests
bun run check
```

## Architecture notes

- التطبيق مبني حاليًا على TanStack Start v1 + React 19 + TypeScript + Vite.
- بيانات العادات وسجلات الإنجاز في IndexedDB عبر Dexie.
- التحقق من البيانات والاستيراد/التصدير عبر Zod.
- لا يوجد حساب أو Backend أو مزامنة سحابية في الوظائف الأساسية.
- تفاصيل الاختيارات والقيود موثقة في [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Nawy design system

الهوية المرئية تتبع مستودع [Nawy Design System](https://github.com/inawy/design-system):
- Nawy Blue: `#3D7BFF`
- Arabic type: Cairo
- UI icons: local Google Material Symbols — Outlined SVG

راجع [AGENTS.md](AGENTS.md) قبل مهام التطوير. CI يشغّل lint وtypecheck والاختبارات وproduction build.
