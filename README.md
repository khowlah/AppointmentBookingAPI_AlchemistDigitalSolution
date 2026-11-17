# Smart Appointment & Consultation Booking Platform
## منصة حجز المواعيد والاستشارات الذكية

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21+-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.11-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black)](http://localhost:3000/api-docs)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A high-performance, scalable RESTful API and relational database architecture for managing consultation services, specialist directories, calendar availability windows, and appointment bookings with **engine-level double-booking prevention**.

منصة متكاملة بنظام RESTful API ومعمارية قاعدة بيانات علائقية متقدمة لإدارة وحجز الاستشارات والمواعيد مع ضمان **منع الحجز المزدوج على مستوى محرك قاعدة البيانات نفسه**.

---

## 🌐 Table of Contents / فهرس المحتويات
1. [English Documentation](#-english-documentation)
   - [Project Overview](#1-project-overview)
   - [Key Architectural Features](#2-key-architectural-features)
   - [Tech Stack](#3-tech-stack)
   - [Database Schema & ERD](#4-database-schema--erd)
   - [Double-Booking Prevention](#5-double-booking-prevention-critical)
   - [Project Structure](#6-project-structure)
   - [Installation & Environment Setup](#7-installation--environment-setup)
   - [API Endpoints Reference](#8-api-endpoints-reference)
   - [Automated Testing Suite](#9-automated-testing-suite)
   - [Live Supabase Project](#10-live-supabase-project)
2. [النسخة العربية (Arabic Documentation)](#-النسخة-العربية-arabic-documentation)
   - [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
   - [المعمارية والتقنيات المستخدمة](#2-المعمارية-والتقنيات-المستخدمة)
   - [مخطط العلاقات وقاعدة البيانات](#3-مخطط-العلاقات-وقاعدة-البيانات-erd)
   - [حل مشكلة منع الحجز المزدوج](#4-حل-مشكلة-منع-الحجز-المزدوج)
   - [طريقة التثبيت والتشغيل المحلي](#5-طريقة-التثبيت-والتشغيل-المحلي)
   - [دليل مسارات الـ API](#6-دليل-مسارات-الـ-api-endpoints)
   - [الاختبارات الآلية](#7-الاختبارات-الآلية)

---

# 🇬🇧 English Documentation

## 1. Project Overview

The **Smart Appointment & Consultation Booking Platform** is engineered to deliver zero-downtime, concurrency-safe consultation scheduling. Built with **Node.js**, **Express.js**, and **Supabase PostgreSQL**, it addresses the classic distributed systems challenge of appointment scheduling: **race conditions and simultaneous double-booking**.

### Core Capabilities:
- **Consultation Services Catalog**: Categorized consultation services with active/inactive statuses, durations, and pricing.
- **Specialist Management**: Verified specialist profiles linked to allowed service certifications.
- **Availability Windows**: Granular calendar availability slots for specialists with conflict exclusion.
- **Atomic Booking Engine**: Thread-safe reservation workflow with row-level locks and partial unique indexing.
- **Lifecycle Management**: Status management (`Pending`, `Confirmed`, `Completed`, `Cancelled`) with automatic slot recovery on cancellation.
- **Atomic Rescheduling**: Seamless slot swap within a single atomic database transaction.
- **Interactive Documentation**: Full OpenAPI 3.0 specification rendered via Swagger UI at `/api-docs`.

---

## 2. Key Architectural Features

- **Strict 3NF Relational Normalization**: Minimizes data duplication and eliminates update/delete anomalies.
- **Multi-Level Compound Foreign Keys**:
  - `(specialist_id, service_id)` in `bookings` references `specialist_services(specialist_id, service_id)` to guarantee a specialist can only be booked for services they actually offer.
  - `(availability_slot_id, specialist_id)` references `availability_slots(id, specialist_id)` to guarantee a slot cannot be booked under the wrong specialist.
- **PostgreSQL Extension (`btree_gist`) Exclusion Constraint**: Prevents specialists from having overlapping time slots created on the same calendar date.
- **Row-Level Security (RLS)**: Enforced across all 6 domain tables protecting client privacy while maintaining public catalog browsing.

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js (v20+ ES Modules) | High-performance asynchronous execution |
| **Framework** | Express.js (v4.21+) | Minimalist and fast HTTP routing engine |
| **Database** | PostgreSQL 17.11 (Supabase) | ACID-compliant relational persistence |
| **Database Drivers** | `pg` + `@supabase/supabase-js` | Connection pooling & Supabase ecosystem |
| **Validation** | Zod (v3.24+) | Runtime schema validation & sanitization |
| **API Docs** | Swagger UI (`swagger-ui-express`) | Interactive OpenAPI 3.0 API explorer |
| **Test Suite** | Native Node Test Runner + `supertest` | End-to-end integration & concurrency testing |

---

## 4. Database Schema & ERD

```mermaid
erDiagram
    services ||--o{ specialist_services : "offered through"
    specialists ||--o{ specialist_services : "provides"
    specialists ||--o{ availability_slots : "schedules"
    specialists ||--o{ bookings : "consults on"
    services ||--o{ bookings : "specifies"
    clients ||--o{ bookings : "reserves"
    availability_slots ||--o{ bookings : "occupies"

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

---

## 5. Double-Booking Prevention (Critical)

To prevent simultaneous concurrent bookings from creating duplicate reservations, the architecture incorporates 3 distinct defense layers:

### Layer 1: Partial Unique Index (PostgreSQL Engine Level)
```sql
CREATE UNIQUE INDEX idx_unique_active_slot_booking 
ON bookings (availability_slot_id) 
WHERE (status IN ('Pending', 'Confirmed'));
```
- Only active reservations (`Pending`, `Confirmed`) occupy index slots.
- Any concurrent attempt to insert or update a second booking for the same slot is instantly rejected with error code `23505` (`unique_violation`).
- Cancelled bookings drop out of the partial index, automatically releasing the slot.

### Layer 2: Transactional Row-Level Locking (`FOR UPDATE`)
```javascript
await dbClient.query('BEGIN');
const lock = await dbClient.query(
  'SELECT id, is_available FROM availability_slots WHERE id = $1 FOR UPDATE;',
  [timeSlot]
);
if (!lock.rows[0].is_available) {
  await dbClient.query('ROLLBACK');
  throw new ConflictError('Slot already booked');
}
await dbClient.query('INSERT INTO bookings (...) VALUES (...)');
await dbClient.query('UPDATE availability_slots SET is_available = false WHERE id = $1;', [timeSlot]);
await dbClient.query('COMMIT');
```

### Layer 3: Automatic Database Trigger
Trigger `trg_sync_slot_availability` automatically synchronizes `availability_slots.is_available` upon insert, reschedule, or cancellation.

---

## 6. Project Structure

```text
smart-appointment-api/
├── src/
│   ├── config/
│   │   └── supabase.js             # PostgreSQL Pool & Supabase configuration
│   ├── controllers/
│   │   ├── services.controller.js  # Services request handlers
│   │   ├── specialists.controller.js# Specialists and slots request handlers
│   │   └── bookings.controller.js   # Booking lifecycle request handlers
│   ├── services/
│   │   ├── services.service.js     # Services business logic & queries
│   │   ├── specialists.service.js  # Specialists business logic & queries
│   │   └── bookings.service.js     # Atomic reservation & concurrency logic
│   ├── routes/
│   │   ├── services.routes.js      # Services endpoint definitions
│   │   ├── specialists.routes.js   # Specialists endpoint definitions
│   │   └── bookings.routes.js      # Bookings endpoint definitions
│   ├── middleware/
│   │   ├── errorHandler.js         # Centralized error handler & status mapper
│   │   └── validateRequest.js      # Generic Zod validation middleware
│   ├── validators/
│   │   ├── booking.validator.js    # Zod schemas for booking requests
│   │   └── query.validator.js      # Zod schemas for query parameters
│   ├── utils/
│   │   └── apiResponse.js          # Uniform JSON response structure
│   ├── docs/
│   │   └── swagger.js              # OpenAPI 3.0 specification
│   ├── app.js                      # Express application assembly
│   └── server.js                   # Server initialization
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql  # Tables, constraints, and btree_gist
│   │   ├── 002_security_and_rls.sql# Row-Level Security policies
│   │   └── 003_booking_integrity.sql# Partial index, triggers, and RPCs
│   └── seed.sql                    # Realistic demonstration seed data
│
├── tests/
│   ├── api.test.js                 # 18 functional integration tests
│   └── concurrency.test.js         # Simultaneous race condition stress tests
│
├── .env.example                    # Environment configuration template
├── .gitignore                      # Security exclusions (node_modules, .env)
├── package.json                    # Project metadata and dependencies
├── DATABASE_SCHEMA.md              # Detailed schema specification
└── README.md                       # Documentation (English & Arabic)
```

---

## 7. Installation & Environment Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/khowlah/AppointmentBookingAPI_AlchemistDigitalSolution.git
cd AppointmentBookingAPI_AlchemistDigitalSolution
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase credentials:
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://nmgizsqbqgeeghaifaxm.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# PostgreSQL Connection Pooler URL (IPv4 / Port 6543)
DATABASE_URL=postgresql://postgres.nmgizsqbqgeeghaifaxm:KHkh425410%23@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### 3. Launch the Application
```bash
# Development mode (Hot-reload enabled):
npm run dev

# Production mode:
npm start
```
- Server URL: `http://localhost:3000`
- Swagger Interactive Explorer: `http://localhost:3000/api-docs`

---

## 8. API Endpoints Reference

### Services
* `GET /api/services`: List active services. Filter with `?category=Cardiology`.
* `GET /api/services/:id`: Retrieve single service by UUID.

### Specialists & Slots
* `GET /api/specialists`: List specialists with certified services. Filter with `?specialty=Dermatology` or `?category=General Medicine`.
* `GET /api/specialists/:id/slots?date=YYYY-MM-DD`: Retrieve day availability with clear `available` / `booked` status.

### Bookings
* `POST /api/bookings`: Atomically create appointment. Rejects double-booking with `409 Conflict`.
* `GET /api/bookings`: Retrieve bookings with pagination (`page`, `limit`) and filters (`email`, `phone`, `status`, `specialistId`, `date`).
* `PATCH /api/bookings/:id/status`: Update status (`Pending`, `Confirmed`, `Completed`, `Cancelled`). Cancelling auto-releases slot.
* `PATCH /api/bookings/:id/reschedule`: Atomically swap old slot for new slot.

#### Sample Request: `POST /api/bookings`
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
  "notes": "Initial medical consultation"
}
```

#### Sample Response: `201 Created`
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": "c62bf5b0-50c7-4608-8029-3fd54d507753",
    "status": "Pending",
    "date": "2026-12-01",
    "service": { "title": "General Medical Consultation", "fee": 75 },
    "specialist": { "full_name": "Dr. Sarah Al-Mansoor", "specialty": "General Medicine" },
    "client": { "fullName": "Khawlah Al-Mutairi", "email": "khawlah@example.com" }
  }
}
```

---

## 9. Automated Testing Suite

The repository includes comprehensive automated test suites connected to the live database:

```bash
# Run all 18 functional integration tests:
npm test

# Run high-concurrency race condition stress test:
node --test tests/concurrency.test.js
```

### Verified Test Results:
* **Functional Integration Suite**: 18 of 18 tests passed (`100%`).
* **Concurrency Stress Test**: 8 simultaneous requests fired in the same millisecond:
  ```text
  Concurrency Test Results: 1 succeeded (201), 7 rejected (409 Conflict)
  ```

---

## 10. Live Supabase Project

* **Project Dashboard**: [https://supabase.com/dashboard/project/nmgizsqbqgeeghaifaxm](https://supabase.com/dashboard/project/nmgizsqbqgeeghaifaxm)
* **Project Reference**: `nmgizsqbqgeeghaifaxm`
* **Region**: `eu-west-1` (AWS Ireland)
* **Engine**: PostgreSQL 17.11 (Free Plan)

---

# 🇸🇦 النسخة العربية (Arabic Documentation)

## 1. نظرة عامة على المشروع

**منصة حجز المواعيد والاستشارات الذكية (Smart Appointment & Consultation Booking Platform)** هي نظام خلفي متكامل (RESTful Backend API) مبني باستخدام **Node.js** و **Express.js** ومتصل بقاعدة بيانات سحابية **PostgreSQL** عبر **Supabase**.

تم تصميم النظام لحل أكبر معضلة في أنظمة الحجوزات: **الحجز المزدوج المتزامن (Race Conditions & Double-Booking)** عبر حماية صارمة على مستوى محرك قاعدة البيانات نفسه.

---

## 2. المعمارية والتقنيات المستخدمة

تم اعتماد معمارية برمجية ثلاثية الطبقات (3-Tier Architecture):
1. **Routes (المسارات)**: توجيه الطلبات حسب العنوان ونوع العملية (`GET`, `POST`, `PATCH`).
2. **Controllers (المتحكمات)**: استلام البيانات، والتواصل مع الخدمات، والرد بصيغ JSON موحدة.
3. **Services (الخدمات)**: تنفيذ منطق الأعمال، وحساب الفترات، وإجراء المعاملات الذرية في قاعدة البيانات.
4. **Validators (التحقق)**: التأكد من صحة المدخلات والبريد والتواريخ ومعرفات UUID عبر مكتبة `Zod`.
5. **Database (قاعدة البيانات)**: جداول مطبعة بالكامل (3NF) في Supabase PostgreSQL.

---

## 3. مخطط العلاقات وقاعدة البيانات (ERD)

تحتوي قاعدة البيانات على 6 جداول رئيسية:
* **`services`**: كتالوج الخدمات الاستشارية وتكلفتها ومدتها وتصنيفها.
* **`specialists`**: الملفات المهنية للأطباء والاستشاريين وتخصصاتهم.
* **`clients`**: بيانات العملاء والمستفيدين من الاستشارات.
* **`specialist_services`**: جدول الوسيط يحدد الخدمات المصرح لكل أخصائي بتقديمها.
* **`availability_slots`**: الفترات الزمنية المتاحة للأخصائيين مع قيد منع التداخل.
* **`bookings`**: سجلات الحجوزات وحالاتها المختلفة (`Pending`, `Confirmed`, `Completed`, `Cancelled`).

---

## 4. حل مشكلة منع الحجز المزدوج

تم بناء الحماية من الحجز المزدوج على 3 طبقات:
1. **الفهرس الجزئي الفريد (Partial Unique Index)**:
   يمنع محرك PostgreSQL رياضياً وجود حجزين بحالة `Pending` أو `Confirmed` لنفس الموعد.
2. **قفل السطر في المعاملة الذرية (Row Lock - FOR UPDATE)**:
   عند الحجز، يُقفل سطر الموعد لمنع أي طلب متزامن في نفس الجزء من الثانية.
3. **المشغل التلقائي (Automatic Sync Trigger)**:
   يغير حالة الموعد إلى `is_available = false` فور الحجز، ويعيدها إلى `true` تلقائياً فور الإلغاء.

---

## 5. طريقة التثبيت والتشغيل المحلي

```bash
# 1. تثبيت الحزم:
npm install

# 2. تشغيل السيرفر في وضع التطوير:
npm run dev

# 3. تشغيل الاختبارات:
npm test
```

* **رابط السيرفر**: `http://localhost:3000`
* **رابط توثيق Swagger التفاعلي**: `http://localhost:3000/api-docs`

---

## 6. دليل مسارات الـ API (Endpoints)

| المسار | الطريقة | الوظيفة |
|---|---|---|
| `/api/services` | `GET` | استعراض الخدمات النشطة مع إمكانية الفلترة بالتصنيف |
| `/api/services/:id` | `GET` | جلب تفاصيل خدمة معينة |
| `/api/specialists` | `GET` | استعراض الأطباء والخدمات المقدمة مع فلترة التخصص |
| `/api/specialists/:id/slots` | `GET` | جلب مواعيد الطبيب ليوم معين مع بيان حالة كل فترة |
| `/api/bookings` | `POST` | إنشاء حجز جديد مع منع الحجز المزدوج |
| `/api/bookings` | `GET` | استعراض الحجوزات مع الفلترة وترقيم الصفحات |
| `/api/bookings/:id/status` | `PATCH` | تحديث حالة الحجز (وتحرير الموعد تلقائياً عند الإلغاء) |
| `/api/bookings/:id/reschedule` | `PATCH` | إعادة جدولة الموعد إلى فترة جديدة ذرياً |

---

## 7. الاختبارات الآلية

- **اختبارات المسارات الوظيفية (`tests/api.test.js`)**: 18 اختباراً شاملاً نجحت بنسبة **100%**.
- **اختبار التسابق المتزامن (`tests/concurrency.test.js`)**: إرسال 8 طلبات حجز في نفس الميلي ثانية أثبت نجاح طلب واحد فقط ورفض الـ 7 الباقين برمز `409 Conflict`.
