# منصة حجز المواعيد والاستشارات الذكية
# Smart Appointment & Consultation Booking Platform (API & Database)

RESTful API متكامل وقوي لإدارة وحجز الاستشارات والمواعيد الطبية والمهنية، مبني باستخدام **Node.js** و **Express.js** مع قاعدة بيانات **Supabase PostgreSQL**.

---

## 🌟 نظرة عامة على المشروع (Project Overview)

يوفر هذا النظام بنية برمجية متكاملة (Backend API + Database Architecture) لإدارة عمليات حجز المواعيد مع ضمان منع الحجز المزدوج (Double-Booking Prevention) على مستوى محرك قاعدة البيانات نفسه، وتوفير تجربة برمجية موثوقة وسريعة تلبي كافة المعايير الهندسية:

- **كتالوج استشارات مفصل**: استعراض وتصفية الخدمات حسب التخصص والتكلفة والمدة.
- **دليل الأخصائيين المعتمدين**: استعراض ملفات الأطباء والأخصائيين والخدمات التي يقدمها كل أخصائي.
- **جدول التوافر والمواعيد**: استعراض الفترات الزمنية المتاحة والمحجوزة لكل أخصائي في أي يوم محدد.
- **حجز المواعيد الذري (Atomic Booking)**: قفل السطر في قاعدة البيانات (`FOR UPDATE`) لمنع أي حجز مزدوج متزامن.
- **إدارة دورة حياة الحجز**: تحديث الحالات (`Pending`, `Confirmed`, `Completed`, `Cancelled`) مع تحرير الموعد تلقائياً عند الإلغاء.
- **إعادة الجدولة الذرية (Reschedule)**: نقل الحجز إلى فترة أخرى وتحرير الفترة السابقة في عملية ذرية واحدة.
- **توثيق تفاعلي كامل عبر Swagger/OpenAPI**: متاح عبر الرابط المباشر `/api-docs`.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

* **Runtime**: Node.js (v20+ / ES Modules)
* **Web Framework**: Express.js (v4.21+)
* **Database**: PostgreSQL 17.11 عبر Supabase (Free Plan)
* **SDKs & Drivers**: `@supabase/supabase-js`, `pg` (Node Postgres with connection pooling)
* **Data Validation**: Zod (v3.24+)
* **API Documentation**: Swagger UI Express (`swagger-ui-express`)
* **Testing Suite**: Node Native Test Runner (`node:test`, `node:assert`) + `supertest`

---

## 📁 هيكلية المشروع (Project Directory Structure)

```text
smart-appointment-api/
├── src/
│   ├── config/
│   │   └── supabase.js             # إعدادات اتصال Supabase و PostgreSQL Pool
│   ├── controllers/
│   │   ├── services.controller.js  # معالجة طلبات خدمات الاستشارة
│   │   ├── specialists.controller.js# معالجة طلبات الأخصائيين والمواعيد
│   │   └── bookings.controller.js   # معالجة عمليات الحجز والإلغاء والجدولة
│   ├── services/
│   │   ├── services.service.js     # منطق الأعمال واستعلامات الخدمات
│   │   ├── specialists.service.js  # منطق استعلام الأخصائيين والفترات الزمنية
│   │   └── bookings.service.js     # منطق الحجز الذري وعزل العمليات المتزامنة
│   ├── routes/
│   │   ├── services.routes.js      # مسارات الخدمات
│   │   ├── specialists.routes.js   # مسارات الأخصائيين
│   │   └── bookings.routes.js      # مسارات الحجوزات
│   ├── middleware/
│   │   ├── errorHandler.js         # معالج الأخطاء المركزي (Centralized Error Handler)
│   │   └── validateRequest.js      # التحقق من صحة المدخلات عبر Zod
│   ├── validators/
│   │   ├── booking.validator.js    # مخططات التحقق من صحة بيانات الحجز
│   │   └── query.validator.js      # مخططات التحقق من صحة معاملات البحث (Query Params)
│   ├── utils/
│   │   └── apiResponse.js          # القالب الموحد لردود الـ JSON
│   ├── docs/
│   │   └── swagger.js              # مواصفات توثيق OpenAPI 3.0
│   ├── app.js                      # تجميع تطبيق Express والـ Middleware
│   └── server.js                   # نقطة تشغيل الخادم
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql  # الجداول الأساسية والقيود المركبة
│   │   ├── 002_security_and_rls.sql# تفعيل RLS وسياسات الأمان
│   │   └── 003_booking_integrity.sql# الفهرس الجزئي ودوال الحجز الذرية (RPC)
│   └── seed.sql                    # البيانات التجريبية الواقعية
│
├── tests/
│   ├── api.test.js                 # 18 اختباراً شاملاً لكافة مسارات الـ API
│   └── concurrency.test.js         # اختبار الضغط والتسابق لمنع الحجز المزدوج
│
├── .env.example                    # مثال المتغيرات البيئية
├── .gitignore                      # استثناء node_modules و .env
├── package.json                    # تبعيات المشروع وأوامر التشغيل
├── DATABASE_SCHEMA.md              # التوثيق التفصيلي لمخطط قاعدة البيانات
└── README.md                       # هذا الملف
```

---

## 🌐 تفاصيل مشروع Supabase الحي (Live Supabase Project Details)

* **لوحة تحكم المشروع**: [https://supabase.com/dashboard/project/nmgizsqbqgeeghaifaxm](https://supabase.com/dashboard/project/nmgizsqbqgeeghaifaxm)
* **معرف المشروع (Project Ref)**: `nmgizsqbqgeeghaifaxm`
* **منطقة الخادم (Region)**: `eu-west-1` (Ireland)
* **محرك قاعدة البيانات**: PostgreSQL 17.11
* **خطة الاشتراك**: Free Plan (مجاني 100%)
* **حالة التنفيذ**: كافة ملفات التهجير (001، 002، 003) وملف البيانات التجريبية مطبقة وجاهزة بالكامل.

---

## ⚙️ التثبيت والتشغيل المحلي (Installation & Setup)

### 1. استنساخ المستودع وتثبيت الحزم:
```bash
git clone <repository-url>
cd "smart-appointment-api"
npm install
```

### 2. إعداد المتغيرات البيئية:
قم بإنشاء ملف `.env` في المجلد الرئيسي بناءً على `.env.example`:
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://nmgizsqbqgeeghaifaxm.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# رابط اتصال مجمع الاستعلامات في Supabase (Pooler Connection)
DATABASE_URL=postgresql://postgres.nmgizsqbqgeeghaifaxm:KHkh425410%23@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### 3. تشغيل الخادم:
* **وضع التطوير (Development with auto-reload)**:
  ```bash
  npm run dev
  ```
* **وضع الإنتاج (Production)**:
  ```bash
  npm start
  ```

سيعمل السيرفر على الرابط: `http://localhost:3000`  
ويمكنك تصفح التوثيق التفاعلي فوراً عبر: `http://localhost:3000/api-docs`

---

## 🧪 تشغيل الاختبارات الآلية (Running Automated Tests)

يحتوي المشروع على طاقمين من الاختبارات التلقائية المدمجة للتحقق من سلامة كافة الـ Endpoints ومنع الحجز المزدوج:

```bash
# تشغيل جميع الاختبارات (18 اختباراً للمسارات والوظائف):
npm test

# تشغيل اختبار التسابق والحجز المزدوج المتزامن:
node --test tests/concurrency.test.js
```

### نتائج اختبارات التحقق:
- ✅ 18 من أصل 18 اختباراً نجحت بنسبة **100%**.
- ✅ اختبار التسابق (8 طلبات حجز متزامنة في نفس الميلي ثانية): نجح طلب واحد (201) ورُفضت الـ 7 طلبات الأخرى بـ (409 Conflict).

---

## 🛡️ كيف تم حل مسألة منع الحجز المزدوج (Double-Booking Prevention)؟

تعتمد المنصة حماية متقدمة على 3 طبقات هندسية داخل PostgreSQL:

1. **الفهرس الفريد الجزئي (Engine-Level Partial Unique Index)**:
   ```sql
   CREATE UNIQUE INDEX idx_unique_active_slot_booking
       ON bookings (availability_slot_id)
       WHERE (status IN ('Pending', 'Confirmed'));
   ```
   هذا الفهرس يمنع محرك PostgreSQL رياضياً من السماح بحجزين نشطين لنفس الموعد حتى في حال وصول طلبين في نفس الجزء من الثانية.

2. **قفل السطر في المعاملة الذرية (Transaction Row-Level Locking)**:
   قبل إدراج أي حجز، يتم تشغيل استعلام `SELECT ... FOR UPDATE` لقفل سطر الموعد في جدول `availability_slots`، مما يجبر أي طلب متزامن على الانتظار حتى اكتمال المعاملة الحالية.

3. **المشغل التلقائي (Trigger) والدوال الذرية**:
   يقوم المشغل `trg_sync_slot_availability` بتحديث خانة `is_available` في جدول المواعيد تلقائياً:
   - عند الحجز بـ `Pending` أو `Confirmed` تتحول إلى `false`.
   - عند الإلغاء `Cancelled` تتحول إلى `true` ليصبح الموعد متاحاً للعملاء الآخرين.

---

## 📖 دليل نقاط النهاية للـ API (REST API Endpoints Reference)

### 1. خدمات الاستشارة (Services)
* `GET /api/services`: جلب جميع الخدمات النشطة مع إمكانية التصفية (`?category=Cardiology`).
* `GET /api/services/:id`: جلب تفاصيل خدمة معينة بواسطة الـ UUID.

### 2. دليل الأخصائيين والمواعيد (Specialists & Slots)
* `GET /api/specialists`: جلب الأطباء والأخصائيين النشطين وقائمة الخدمات التي يقدمونها، مع دعم التصفية (`?specialty=Dermatology` أو `?category=General Medicine`).
* `GET /api/specialists/:id/slots?date=YYYY-MM-DD`: جلب مواعيد الطبيب ليوم معين مع بيان حالة كل فترة (`available` أو `booked`).

### 3. إدارة الحجوزات (Bookings Lifecycle)
* `POST /api/bookings`: إنشاء حجز جديد مع منع الحجز المزدوج.
* `GET /api/bookings`: استعراض قائمة الحجوزات مع دعم التصفية (`email`, `phone`, `status`, `specialistId`, `date`) وترقيم الصفحات (`page`, `limit`).
* `PATCH /api/bookings/:id/status`: تحديث حالة الحجز (`Pending`, `Confirmed`, `Completed`, `Cancelled`) مع تحرير الموعد تلقائياً عند الإلغاء.
* `PATCH /api/bookings/:id/reschedule`: إعادة جدولة الموعد إلى فترة زمنية جديدة بأمان وذرية تامة.

---

## 📮 أمثلة للطلبات والردود (Sample Payloads)

### إنشاء حجز جديد (POST /api/bookings):
**الطلب (Request):**
```json
{
  "serviceId": "11111111-1111-1111-1111-111111111101",
  "specialistId": "22222222-2222-2222-2222-222222222201",
  "date": "2026-12-01",
  "timeSlot": "44444444-4444-4444-4444-444444444402",
  "client": {
    "fullName": "Khawlah Al-Mutairi",
    "email": "khawlah@example.com",
    "phone": "+966551234567"
  },
  "notes": "استشارة طبية أولية"
}
```

**الرد الناجح (201 Created):**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": "c62bf5b0-50c7-4608-8029-3fd54d507753",
    "status": "Pending",
    "date": "2026-12-01",
    "notes": "استشارة طبية أولية",
    "created_at": "2026-11-16T12:00:00.000Z",
    "service": {
      "id": "11111111-1111-1111-1111-111111111101",
      "title": "General Medical Consultation",
      "fee": 75,
      "duration_minutes": 30
    },
    "specialist": {
      "id": "22222222-2222-2222-2222-222222222201",
      "full_name": "Dr. Sarah Al-Mansoor",
      "specialty": "General Medicine"
    },
    "client": {
      "fullName": "Khawlah Al-Mutairi",
      "email": "khawlah@example.com"
    }
  }
}
```

**رد التعارض عند محاولة حجز نفس الموعد (409 Conflict):**
```json
{
  "success": false,
  "message": "The requested availability slot is already booked or unavailable.",
  "error": {
    "code": "SLOT_CONFLICT",
    "detail": "Another active booking already occupies this time slot."
  }
}
```

---

## 📊 مخطط العلاقات (Entity-Relationship Diagram)

```mermaid
erDiagram
    services ||--o{ specialist_services : "provided through"
    specialists ||--o{ specialist_services : "offers"
    specialists ||--o{ availability_slots : "schedules"
    specialists ||--o{ bookings : "consults on"
    services ||--o{ bookings : "specifies"
    clients ||--o{ bookings : "schedules"
    availability_slots ||--o{ bookings : "reserves"

    services {
        UUID id PK
        VARCHAR title
        TEXT description
        INTEGER duration_minutes
        NUMERIC fee
        VARCHAR category
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    specialists {
        UUID id PK
        UUID auth_user_id UK
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR phone
        VARCHAR specialty
        TEXT bio
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    clients {
        UUID id PK
        UUID auth_user_id UK
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR phone
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    specialist_services {
        UUID specialist_id PK, FK
        UUID service_id PK, FK
        TIMESTAMPTZ created_at
    }

    availability_slots {
        UUID id PK
        UUID specialist_id FK
        DATE slot_date
        TIME start_time
        TIME end_time
        BOOLEAN is_available
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    bookings {
        UUID id PK
        UUID client_id FK
        UUID specialist_id FK
        UUID service_id FK
        UUID availability_slot_id FK
        VARCHAR status
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
```
