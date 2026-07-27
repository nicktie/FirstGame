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
2. **سجّلها** — أضف سطراً واحداً في `games.js` (السجلّ المصدر الوحيد):
   ```js
   { id:'mygame', title:'اسم اللعبة', icon:'🎲', launch:{ href:'mygame.html' }, file:'./mygame.html' },
   ```
   بهذا يلتقطها الـservice worker **تلقائياً** في الكاش (لا تعديل يدوي في `sw.js`)،
   ويصبح عدد الألعاب `WANEES_GAME_COUNT` صحيحاً.
3. **بطاقة في الشبكة** — أضف كرتاً في شبكة الألعاب داخل `index.html` (ابحث عن `games-grid`):
   ```html
   <div class="game-page-card" onclick="location.href='mygame.html'">
     <div class="gpc-icon">🎲</div>
     <div class="gpc-body"><h3>اسم اللعبة</h3><p>وصف قصير</p>
       <div class="gpc-badges"><span>فردي</span><span>🔥 جديد</span></div>
       <button class="gpc-btn">العب ▶</button></div>
   </div>
   ```
4. **ارفع رقم الكاش** — `CACHE = 'wanees-vNNN'` في `sw.js` إلى التالي حتى يصل التحديث،
   وحدّث العدّاد النصّي (`NN لعبة`) في واجهة `index.html` و`manifest.json`.

> السجلّ (`games.js`) هو مصدر الحقيقة لقائمة كاش الألعاب والعدد. `game-core.css/js`
> و`games.js` مُدرجة أصلاً في كاش الـSW.

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
