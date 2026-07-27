# إضافة لعبة جديدة إلى ونيس · Adding a New Game

منصّة ونيس مبنية من ألعاب مستقلّة بملف واحد (single-file HTML) تعيش بجانب `index.html`.
هذا الدليل يشرح الطريقة القياسية لإضافة لعبة جديدة بحيث تبدو وتتصرّف مثل بقية الموقع.

## المكوّنات المشتركة (Framework)

| ملف | الغرض |
|-----|-------|
| `game-core.css` | نظام التصميم: نفس ألوان/خطوط/بطاقات/أزرار/نوافذ الموقع (`.wg-*`). |
| `game-core.js` | التشغيل المشترك عبر `window.WG`: صوت، اهتزاز، أفضل نتيجة، حلقة rAF، تسجيل SW. |
| `game-template.html` | قالب جاهز للنسخ — انسخه وابدأ منه. |

استيرادها في رأس اللعبة:

```html
<link rel="stylesheet" href="game-core.css">
...
<script src="game-core.js"></script>
```

## واجهة `window.WG` (الـ hooks القياسية)

```js
WG.initAudio()                 // فعّل الصوت (نادِه عند أول تفاعل)
WG.sfx.good() / bad() / tap()  // مؤثّرات صوتية موحّدة
     / tick() / win() / lose() / levelup()
WG.tone(freq, dur, {type,vol}) // نغمة مخصّصة
WG.vibe(pattern)               // اهتزاز (رقم أو مصفوفة)
WG.loadBest(id) / recordBest(id, score)   // أفضل نتيجة (localStorage)
WG.Loop(step)                  // حلقة rAF: .start() / .stop() ، step(dt,t)
WG.onHidden(cb)                // أوقف اللعبة عند مغادرة التبويب
WG.toast(msg) / WG.ar(n)       // إشعار · تحويل الأرقام لعربية
WG.goHome() / WG.registerSW()  // العودة للرئيسية · تسجيل الـ SW
```

كل لعبة تعرّف **معرّفاً ثابتاً** (`const GAME='...'`) يُستخدم مفتاحاً لأفضل نتيجة.

## خطوات الإضافة (Checklist)

1. **انسخ** `game-template.html` إلى `mygame.html` وابنِ لعبتك داخله.
   استخدم أصناف `.wg-*` للواجهة و`window.WG` للتشغيل — لا تعِد كتابة الصوت/الاهتزاز/الـSW.
2. **بطاقة في الشبكة** — أضف كرتاً في شبكة الألعاب داخل `index.html` (ابحث عن `games-grid`):
   ```html
   <div class="game-page-card" onclick="location.href='mygame.html'">
     <div class="gpc-icon">🎲</div>
     <div class="gpc-body"><h3>اسم اللعبة</h3><p>وصف قصير</p>
       <div class="gpc-badges"><span>فردي</span><span>🔥 جديد</span></div>
       <button class="gpc-btn">العب ▶</button></div>
   </div>
   ```
3. **الكاش** — أضف `'./mygame.html'` إلى مصفوفة `ASSETS` في `sw.js`، وارفع رقم `CACHE`
   (`wanees-vNNN` → التالي) حتى يصل التحديث للمستخدمين.
4. **العدّاد** — حدّث عدد الألعاب (`NN لعبة`) في `index.html` و`manifest.json`.

> نصيحة: `game-core.css` و`game-core.js` مُدرجان أصلاً في كاش الـSW، فلا حاجة لإضافتهما.

## الأونلاين (اختياري)

للألعاب الأونلاين استخدم Firebase Realtime DB بنفس نمط `colors.html` (المرجع الكامل):
غرف تحت `rooms/<prefix><code>` ببادئة حرف فريد يُبقيها خارج متصفّح غرف الأسئلة
(البادئات المستخدمة: `t x c m d k`). المضيف يكتب `startAt` بـ`ServerValue.TIMESTAMP`
لبدء متزامن، وكل لاعب يزامن نقاطه فقط. صلاحيات القاعدة تسمح بالكتابة تحت `rooms/` فقط.

## مبادئ الجودة

- **الأداء**: صوّر مضغوطة (WebP/PNG مُحسّن)، `touch-action:none` على مناطق اللعب، ونظّف
  المؤقّتات/المستمعين عند الانتهاء.
- **الاستجابة**: استخدم `dvh` والوحدات النسبية؛ اختبر على شاشة جوال ضيّقة.
- **الوصولية**: `game-core.css` يحترم `prefers-reduced-motion` ويضيف حلقة تركيز للوحة المفاتيح.
- **الاتّساق**: التزم بأصناف `.wg-*` بدل إعادة تصميم النوافذ والأزرار — هكذا لا «تنجرف» اللعبة
  عن هويّة الموقع.
