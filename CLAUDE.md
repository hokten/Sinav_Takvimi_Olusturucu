# Sınav Planlama Sistemi

Üniversite sınav programı hazırlama uygulaması. Yönetici ve bölüm başkanları
sınav takvimlerini yönetir. Real-time senkronizasyon ile tüm değişiklikler
anlık olarak tüm kullanıcılara yansır.

## Tech Stack
- Next.js 15 (App Router, Server Actions)
- TypeScript (strict mode)
- PostgreSQL + Prisma ORM
- Supabase Realtime (WebSocket senkronizasyon)
- NextAuth.js (credential-based auth, role-based access)
- Tailwind CSS + shadcn/ui
- Zod (validation)

## Komutlar
- `npm run dev`: Dev server (port 3000)
- `npx prisma migrate dev`: Migration çalıştır
- `npx prisma studio`: DB GUI aç
- `npx prisma db seed`: Seed data yükle
- `npm run lint`: ESLint
- `npm run build`: Production build

## Proje Yapısı
```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── schedule/              # Sınav programı (Excel-uyumlu belge)
│   │   ├── room-program/          # Salon programı matrisi
│   │   ├── instructor-program/    # Hoca programı matrisi
│   │   ├── sessions/              # Oturum yönetimi (admin)
│   │   ├── room-assignments/      # Sınıf-bölüm atamaları (admin)
│   │   └── requests/              # Talep yönetimi
│   ├── api/auth/[...nextauth]/
│   └── layout.tsx
├── components/
│   ├── ui/                        # shadcn/ui
│   ├── schedule/                  # ScheduleDocument, ExamRow, PrintHeader
│   ├── program/                   # RoomMatrix, InstructorMatrix, ProgramCell
│   └── shared/                    # Header, Sidebar, Modal, Toast, DayTabs
├── lib/
│   ├── auth.ts                    # NextAuth config
│   ├── db.ts                      # Prisma client singleton
│   ├── supabase.ts                # Realtime client
│   ├── permissions.ts             # Yetki fonksiyonları
│   └── validations.ts             # Zod şemaları
├── hooks/
│   ├── useRealtimeExams.ts
│   └── usePermissions.ts
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Veritabanı Modelleri
- **User**: id, name, email, password, role (ADMIN | DEPT_HEAD)
- **Department**: id, name, color
- **UserDepartment**: userId, departmentId, type (MAIN | SIDE)
- **Room**: id, name
- **RoomAssignment**: roomId, departmentId (hangi bölüm hangi sınıfı kullanabilir)
- **Instructor**: id, name, mainDept (departmentId), sideDepts (departmentId[])
- **Course**: id, code, name, section (şube no), grade (sınıf), quota, departmentId, instructorId, adminOnly (boolean)
- **ScheduleDay**: id, date (DD.MM.YYYY), sessions (string[] — o güne özel oturum saatleri)
- **Exam**: id, courseId, date (DD.MM.YYYY), time (HH:MM), roomIds (string[]), supervisorIds (string[]), instructorId, departmentId, createdBy
- **SlotRequest**: id, fromDepartmentId, roomId, date, time, status (PENDING | APPROVED | REJECTED)

## Uygulama Modülleri

### 1. Sınav Programı (📋 Ana Sayfa)
Resmi sınav takvimi Excel şablonuyla BİREBİR aynı formatta belge görünümü.
- Admin tüm bölümleri görebilir (bölüm sekmesiyle geçiş)
- Bölüm başkanı sadece kendi bölümünün programını düzenler

### 2. Salon Programı (🏛️)
Matris görünümü: satırlar = oturum saatleri, sütunlar = tüm salonlar.
- Admin: Tüm salonlar görünür
- Bölüm başkanı: Tüm salonlar görünür (read-only genel bakış)
- Gün sekmesiyle tarih seçilir
- Salon filtresi (arama kutusu)
- Her hücrede: ders kodu, ders adı, hoca, bölüm rengi
- Aynı salonda aynı saatte birden fazla sınav → kırmızı çakışma uyarısı

### 3. Hoca Programı (👤)
Matris görünümü: satırlar = hocalar, sütunlar = o günün oturum saatleri.
- Admin: TÜM hocalar görünür
- Bölüm başkanı: SADECE kendi bölümündeki hocalar (mainDept VEYA sideDepts)
- Gün sekmesiyle tarih seçilir
- Hoca filtresi (arama kutusu)
- Her hocanın yanında ana bölüm etiketi + varsa yan bölüm etiketleri
- Hücrelerde iki tür görev ayrışır:
  - Ders sorumlusu → bölüm rengiyle
  - Gözetmen → sarı kenarlık + "GÖZETİM" etiketi
- Aynı saatte birden fazla görev → kırmızı "⚠ ÇAKIŞMA" uyarısı

### 4. Oturum Yönetimi (⚙️ Sadece Admin)
Yönetici sınav günlerini ve her günün kendine özel oturum saatlerini belirler.
- Her gün için tarih (GG.AA.YYYY) ve o güne ait oturum saatleri
- Her günün oturum sayısı ve saatleri BİRBİRİNDEN FARKLI olabilir
- Örnek: Pazartesi → 09:30, 11:00, 13:00, 14:30, 15:30
- Örnek: Cuma (namaz) → 09:00, 11:00, 14:00, 15:00, 16:00
- Saat ekleme: input'a yazıp Enter, silme: × butonu
- Gün ekleme/silme

### 5. Sınıf Atamaları (🏫 Sadece Admin)
Admin her salona hangi bölümlerin sınav yapabileceğini atar.
- Grid görünümde tüm salonlar
- Her salon için bölüm toggle butonları

### 6. Talep Sistemi (📩)
Bölüm başkanı atanmamış bir sınıfın boş slotunu yöneticiden talep eder.
- Admin: tüm talepler, Onayla/Reddet
- Bölüm başkanı: kendi talepleri ve durumları

## Kritik İş Kuralları — HER ZAMAN UYGULA

### Çakışma Kontrolleri
1. Aynı derslikte aynı tarih+saat'te birden fazla sınav OLAMAZ
   → Exam eklenmeden önce roomIds içindeki her salon için date+time kontrolü
2. Aynı hocanın (ders sorumlusu olarak) aynı tarih+saat'te birden fazla sınav görevi OLAMAZ
   → Exam.instructorId + date + time unique kontrolü
3. Bir sınavda birden fazla derslik olabilir (roomIds: string[])
4. Bir sınavda birden fazla gözetmen olabilir (supervisorIds: string[])
5. Gözetmen çakışması uyarı olarak gösterilir (hard block değil, salon programı ve hoca programında görünür)

### Yetkilendirme
6. ADMIN: Her şeyi görebilir ve düzenleyebilir, tüm modüllere erişir
7. DEPT_HEAD: Sadece kendi bölümünün derslerini ekleyebilir
8. DEPT_HEAD: Sadece bölümüne atanmış sınıflara sınav ekleyebilir
9. adminOnly=true derslerin sınavını SADECE admin düzenleyebilir/silebilir
10. DEPT_HEAD: Tüm sınıfların salon programını görebilir (read-only)

### Hoca Görünürlüğü
11. Her hocanın 1 ana bölümü (mainDept) ve 0+ yan bölümü (sideDepts[]) olabilir
12. DEPT_HEAD → Hoca Programı'nda sadece kendi bölümüne ait hocaları görür
    (mainDept === userDeptId VEYA sideDepts.includes(userDeptId))
13. ADMIN → Hoca Programı'nda TÜM hocaları görür

### Salon Görünürlüğü
14. Salon Programı'nda ADMIN ve DEPT_HEAD tüm salonları görebilir
15. Sınav ekleme yetkisi sadece atanmış salonlarda (RoomAssignment tablosu)

### Oturum Yönetimi
16. Sınav günleri ve oturum saatleri SADECE admin tarafından belirlenir
17. Her günün oturum saatleri bağımsızdır (farklı gün farklı saat olabilir)
18. Sınav eklerken modal'daki oturum saatleri o güne tanımlı oturumlardan gelir
19. Oturum saatleri değiştiğinde mevcut sınavlar etkilenmez (orphan olabilir)

### Talep Sistemi
20. DEPT_HEAD, atanmamış sınıfın boş slotunu admin'den talep edebilir
21. Admin onaylarsa o bölüm o spesifik tarih+saat+salon için sınav ekleyebilir
22. Onay genel değil, spesifik slot içindir

### Real-time Senkronizasyon
23. Exam tablosundaki her INSERT/UPDATE/DELETE Supabase Realtime ile yayınlanmalı
24. Tüm açık istemciler (browser) anında güncellenmeli
25. Yeni sınav eklendiğinde toast bildirimi gösterilmeli
26. Salon ve hoca programları da real-time güncellenmeli

## Sınav Programı Arayüzü (Excel-Uyumlu Belge Formatı)
Arayüz, üniversitenin resmi sınav takvimi şablonuyla BİREBİR aynı formatta.

**Belge Başlığı (her bölüm için ayrı):**
```
T.C.
AMASYA ÜNİVERSİTESİ
Amasya Teknik Bilimler Meslek Yüksekokulu
[Bölüm Adı] Programı
20XX-20XX Eğitim-Öğretim Yılı [Dönem] [Sınav Türü] Sınav Takvimi
```

**Tablo Sütunları:** Tarih | Gün | Saat | Dersin Kodu | Dersin Adı | Dersin Öğretim Elemanı | Derslik | Görevli

**Layout Kuralları:**
- Tarih ve Gün sütunları DİKEY YAZILIR (writing-mode: vertical-lr, rotate 180deg)
- Aynı gündeki tüm satırları dikey merge ile birleştirir (rowspan)
- "ÖĞLE ARASI" satırı öğle öncesi (saat < 12:00) ve sonrası sınavları ayırır
- Bir sınavda birden fazla derslik olabilir (boşlukla ayrılmış: "A-306 İ-4-23")
- Bir sınavda birden fazla gözetmen olabilir (alt alta yazılır)
- Alt bilgide Bölüm Başkanı adı ve unvanı
- Tüm hücrelerde 1.5px solid siyah kenarlık

**Sınav Ekleme Modal'ında:**
- Oturum saati seçimi (o güne tanımlı oturumlardan dropdown)
- Ders seçimi ([KOD] DersAdı Şb.X — HocaAdı formatında dropdown)
- Derslik çoklu seçim (chip toggle, dolu olanlar kırmızı ✕, seçilemez)
- Gözetmen çoklu seçim (chip toggle)

**HTML Yazdırma (Excel export YOK):**
- window.print() ile tarayıcıdan yazdırma
- @media print CSS ile sidebar, toolbar, aksiyon butonları gizlenir
- Sadece belge kalır, kenarlıklar ve arka plan renkleri korunur
- @page { size: landscape; margin: 10mm }
- print-color-adjust: exact ile arka planlar yazdırılır

## Kod Stili
- Fonksiyonel React, class component KULLANMA
- Server Actions tercih et, gereksiz API route oluşturma
- Her form için Zod validasyonu
- Türkçe UI metinleri, İngilizce kod/değişken/fonksiyon isimleri
- Dosya başına tek sorumluluk, 200 satırı geçen dosyaları böl
- Erişim kontrolünü her endpoint'te kontrol et
- Console.log bırakma, try-catch kullan
- Exam ekleme/silme işlemlerinde transaction kullan

## Dikkat
- .env dosyasını ASLA commit etme
- Supabase Realtime subscription'ları component unmount'ta temizle
- Migration'ları her schema değişikliğinde çalıştır
- Oturum saatleri günden güne farklı olabilir, hardcoded saat listesi KULLANMA
- Hoca programında hem ders sorumluluğu hem gözetim görevi ayrı renk/etiketle gösterilmeli
- Salon programında tüm bölümlerin sınavları bölüm renkleriyle ayrışmalı
- Excel import ve export özelliği YOK, yazdırma HTML üzerinden yapılır
