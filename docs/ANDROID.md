# عادة على أندرويد — البناء والنشر

مبني على تجربة تطبيق «تقويم» (دليل أندرويد وGoogle Play). **كل ما هنا لم يُشغَّل بعد في CI**: أُعدّ في بيئة بلا شبكة ولا Android SDK. أول تشغيل للـ workflows هو أول اختبار حقيقي، فاقرأ لوجه.

## القرار: Capacitor وليس TWA

التذكيرات في الويب مؤقّت صفحة لا يعمل والتطبيق مقفول (`docs/ARCHITECTURE.md`). غلاف TWA لا يحل ذلك. Capacitor يسلّم المواعيد الثابتة الثلاثة للهاتف كتنبيهات متكررة تعمل والتطبيق مقفول. المنطق (`src/lib/reminders/native-plan.ts`) خالص وبلا Capacitor، والاتصال بالهاتف في `src/lib/native/` فقط، والواجهة تعرف `ReminderScheduler` لا Capacitor.

## `appId` — قرار نهائي قبل أول رفع

`capacitor.config.json` فيه `"appId": "ada.nawy.app"` (ترتيب الدومين لا معكوسًا، كما فعل تقويم بـ `taqweem.nawy.app`). **لا يتغير بعد أول رفع على Play.** غيّره قبل ذلك إن أردت (مثل `app.nawy.ada`)، وعدّل `PKG` في `tools/android/emulator_test.sh` معه. تغيير `appId` يعني تطبيقًا جديدًا جانبيًا.

## كيف يعمل البناء

1. `GH_PAGES=1 bun run build` يكتب الـ SPA الساكن في `.output/public`.
2. `scripts/prepare-native-web.mjs` ينسخه إلى `dist-native/` بلا service worker (داخل التطبيق الملفات مضمّنة، والـ SW مجرد كاش ثانٍ قد يخدم كودًا قديمًا).
3. `npx cap add android` يولّد `android/` (لا يُرفع: `/android/` في `.gitignore`).
4. أيقونات `tools/android/res` تحل محل الافتراضية، و`patch_manifest.py` يضيف أذونات التذكير، و`cap sync` ينسخ الويب.
5. Gradle يبني `assembleDebug` أو `bundleRelease`.

الأيقونات تُولَّد من `brand/icons` بـ `python3 tools/android/make_res.py` (يحتاج Pillow). اللي في المستودع جاهز، أعد التوليد فقط إن تغيّرت الحزمة.

## الـ workflows

| الملف                  | متى                     | ماذا يفعل                                                                        |
| ---------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `android.yml`          | يدوي، أو فرع `native-*` | يبني debug APK وينشره كـ prerelease `android-debug`، ويجرّب بناء AAB بمفتاح مؤقت |
| `android-emulator.yml` | يدوي                    | يشغّل APK في محاكي API 34 و35 ويتحقق من الجدولة والإشعار                         |
| `android-release.yml`  | يدوي                    | يبني AAB موقّعًا كمسودّة release                                                 |
| `lockfile-sync.yml`    | فرع `native-*`          | يحدّث `bun.lock` (احذفه بعد الدمج)                                               |

**قبل الدمج في `main`:** `package.json` أُضيفت له تبعيات Capacitor ولم يُحدَّث `bun.lock`، فـ `bun install --frozen-lockfile` سيفشل. اعمل فرعًا `native-…` ليولّد `lockfile-sync` القفل، ثم ادفع commit فارغًا لأن commits الـ bot لا تشغّل CI.

## أسرار الإصدار (يضيفها المالك)

`ANDROID_KEYSTORE_BASE64` و`ANDROID_KEYSTORE_PASSWORD` و`ANDROID_KEY_ALIAS`. المفتاح PKCS12 بكلمة واحدة:

```sh
keytool -genkeypair -storetype PKCS12 -keystore upload.p12 -alias ada-upload \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.p12   # قيمة ANDROID_KEYSTORE_BASE64
```

احتفظ بنسخة من `.p12` وكلمته خارج المستودع. نعتمد **Play App Signing**: هذا «مفتاح رفع» يمكن استبداله عبر دعم Play. مفتاح debug في `tools/android/debug.keystore` علني عمدًا ولا يُستعمل للمتجر أبدًا، ولا تُعد استعمال مفاتيح تطبيق «تقويم».

## ما يفعله التطبيق على الهاتف

- ثلاثة تنبيهات متكررة يوميًا (10:00 و16:00 و20:30)، معرّفاتها 1 و2 و3. تُعاد جدولتها كلها عند فتح التطبيق وعند تغيّر ما تبقى اليوم: إن انتهت كل العادات يبدأ باقي اليوم من الغد، وإن لم تبقَ أي عادة (أرشفة أو حذف) تُلغى كل التنبيهات.
- نص التنبيه عام (لا رقم فيه) لأن الهاتف لا يعرف عادات الغد مسبقًا. إن لم تفتح التطبيق لأيام ستستمر التنبيهات كل يوم.
- بعد `schedule` يُسأل الهاتف عمّا حفظه فعلًا، ويظهر خطأ في الواجهة إن نقص (لا شيء يُبتلع).
- Settings ← «فحص التذكيرات»: الإذن، عدد المجدول، رقم النسخة، وإشعار تجريبي بمهلة 10 ثوانٍ.

**أذونات المانيفست:** `POST_NOTIFICATIONS` و`RECEIVE_BOOT_COMPLETED` فقط. **لا** `USE_EXACT_ALARM` ولا `SCHEDULE_EXACT_ALARM` عمدًا: Play يحصرهما بتطبيقات المنبّه والتقويم ويطلب إقرارًا، ومتتبع عادات لا يحتاج دقة الدقيقة.

**لا `allowWhileIdle`:** جرّبناه فاكتشف المحاكي (API 35) أن إضافة التنبيهات تفتح **شاشة إعدادات الهاتف** لطلب إذن المنبّه الدقيق ولا تجدول شيئًا بدونه (`pending = 0`). لذلك التنبيهات اليومية **غير دقيقة**: قد تتأخر دقائق، وفي وضع Doze العميق قد تتأخر أكثر حتى نافذة الصيانة التالية. لا تعد إضافة `allowWhileIdle` دون إذن دقيق مقبول من Play.

## حدود وأمور لم تُتحقق

- **نسخة احتياطية (تصدير):** الإعدادات تنزّل الملف بـ `<a download>` من blob. أظن أن WebView أندرويد لا يتعامل مع هذا، فقد لا يعمل «حفظ نسخة» داخل التطبيق. **تحقق منه على المحاكي قبل أي نشر.** الحل المرجّح إضافة `@capacitor/filesystem` و`@capacitor/share`، وهذا يتطلب مقارنة بدائل كما في `AGENTS.md`. استرجاع الملف عبر `<input type=file>` يُتوقع أن يعمل لكنه لم يُجرَّب.
- بيانات IndexedDB تعيش مع التطبيق: تُمسح بحذفه أو بـ «مسح البيانات». لذلك النسخة الاحتياطية ضرورية، لا اختيارية.
- سلوك إعادة تشغيل الهاتف، وتوفير بطارية سامسونج وشاومي على المدى الطويل: **لم يُتحقق**. المحاكي يثبت المنطق والجدولة فقط.
- خط Cairo يُحمَّل من Google Fonts (ليس مضمّنًا). يُفضَّل تضمينه قبل الإصدار (انظر `PLAY_LISTING.md`).
- iOS مؤجَّل.

## الاختبار في المحاكي

`android-emulator.yml` يبني APK ويشغّله، ثم `emulator_test.mjs` يقود الواجهة عبر CDP (يضيف عادة، يفتح الإعدادات، يقرأ `data-*` من البطاقة، يضغط الإشعار التجريبي) ويتحقق بـ `dumpsys notification` من عنوان `تجربة عادة`. اقرأ النتيجة من اللوج: `gh run view <id> --log | grep "\[e2e\]"`.

الاختبار يعتمد على: `button[aria-label="إضافة عادة"]` و`#habit-name` و`a[href="/settings"]` و`data-testid` = `reminder-diag` و`reminder-test`. غيّرت أيًّا منها؟ حدّث السكربت.

## أخطاء تعلّمناها في «تقويم» (لا تعدها)

- لا تُرجِع كائن الإضافة من `async`/`.then` (proxy يردّ على `then`): الغلاف في `loadPlugin` واختباره في `reminder-scheduler.test.ts`.
- فكّ المفتاح **بعد** `checkout` وإلا مُسح.
- `/android/` بشرطة أولى في `.gitignore`.
- مفتاح debug ثابت وإلا رُفض كل تحديث بـ «App not installed».
- صفحة ساكنة جديدة قد يبتلعها الـ SW: `privacy.html` مغطاة بفحص في `scripts/smoke-pages.mjs`.
