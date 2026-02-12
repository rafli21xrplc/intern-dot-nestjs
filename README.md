## 🏗️ Architecture & Design Pattern

Project ini dibangun di atas framework **NestJS** dan menerapkan **Modular Architecture** yang dipadukan dengan **Repository Pattern**. Pendekatan ini dipilih untuk memastikan *codebase* tetap bersih, mudah di-maintain (maintainable), dan siap untuk skala yang lebih besar (scalable).

Berikut adalah alasan mengapa pattern ini digunakan:

### 1. Modular Architecture (Pemisahan per Fitur)
Alih-alih menyatukan semua kode dalam satu tempat, aplikasi ini dibagi menjadi beberapa modul independen berdasarkan domain bisnisnya (contoh: `AuthModule`, `UsersModule`, `ProjectsModule`, `ActivitiesModule`).
* **Mengapa?** Memudahkan navigasi kode, mencegah konflik antar tim jika dikerjakan bersama (collaboration-friendly), dan memungkinkan fitur tertentu untuk diisolasi atau di-*scale* secara terpisah (Microservices readiness).

### 2. Separation of Concerns (Controller & Service Layer)
Project ini secara ketat memisahkan antara *Routing/HTTP layer* dan *Business Logic layer*.
* **Controllers (`*.controller.ts`)**: Hanya bertugas menerima HTTP Request, memanggil Service yang tepat, dan mengembalikan HTTP Response. Tidak ada logika bisnis di sini.
* **Services (`*.service.ts`)**: Bertindak sebagai main logic aplikasi. Semua perhitungan, logika bisnis, dan validasi aturan (business rules) terjadi di layer ini.
* **Mengapa?** Jika suatu saat kita ingin mengubah antarmuka (misalnya dari REST API ke GraphQL atau WebSockets), kita hanya perlu membuat Controller baru tanpa perlu menyentuh ulang logika bisnis di Service.

### 3. Repository Pattern (Data Access Layer)
Aplikasi tidak berinteraksi langsung dengan database di dalam Service, melainkan menggunakan `Repository` dari TypeORM.
* **Mengapa?** Memisahkan logika bisnis dari query database. Hal ini membuat *mocking* data saat melakukan Unit Testing menjadi sangat mudah. Selain itu, jika terjadi migrasi database (misal dari PostgreSQL ke MySQL), perubahan *query* terisolasi hanya pada layer data, tidak merusak alur logika bisnis.

### 4. Data Transfer Object (DTO) & Validation
Setiap data yang masuk melalui body request (POST/PATCH/PUT) akan difilter menggunakan class DTO (`*.dto.ts`) dan divalidasi menggunakan `class-validator`.
* **Mengapa?** Keamanan (Security) dan Prediktabilitas. Sistem akan menolak request kotor atau *malicious payloads* sebelum menyentuh logika bisnis. Ini memastikan Service hanya menerima data dengan struktur yang sudah pasti benar.

### 5. Automated E2E Testing
Project ini dilengkapi dengan *End-to-End (E2E) Testing* yang komprehensif untuk menguji skenario nyata mulai dari Request HTTP masuk hingga perubahan data di Database.
* **Mengapa?** Memberikan jaminan kualitas (Quality Assurance) bahwa setiap endpoint API, sistem autentikasi (JWT), dan validasi otorisasi (Role-Based Access) berfungsi secara harmonis dan tidak ada *bug* regresi saat ada penambahan fitur baru.