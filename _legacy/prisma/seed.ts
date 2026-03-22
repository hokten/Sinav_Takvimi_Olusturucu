import { PrismaClient, Role, UserProgramType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── DEPARTMENTS (7) ──────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { id: "dept-biltek",  name: "Bilgisayar Teknolojileri Bölümü" },
  { id: "dept-elektrik", name: "Elektrik-Elektronik Teknolojileri Bölümü" },
  { id: "dept-makine",  name: "Makine ve Metal Teknolojileri Bölümü" },
  { id: "dept-insaat",  name: "İnşaat Teknolojisi Bölümü" },
  { id: "dept-kimya",   name: "Kimya ve Kimyasal İşleme Teknolojileri Bölümü" },
  { id: "dept-gida",    name: "Gıda ve Tarım Bölümü" },
  { id: "dept-turizm",  name: "Turizm ve Otelcilik Bölümü" },
];

// ─── PROGRAMS (10) ────────────────────────────────────────────────────────────
const PROGRAMS = [
  { id: "prog-bp", name: "Bilgisayar Programcılığı",     color: "#3B82F6", departmentId: "dept-biltek"  },
  { id: "prog-wt", name: "Web Tasarımı ve Kodlama",      color: "#06B6D4", departmentId: "dept-biltek"  },
  { id: "prog-el", name: "Elektronik Teknolojisi",       color: "#10B981", departmentId: "dept-elektrik"},
  { id: "prog-ek", name: "Elektrik",                     color: "#059669", departmentId: "dept-elektrik"},
  { id: "prog-mk", name: "Makine",                       color: "#F59E0B", departmentId: "dept-makine"  },
  { id: "prog-me", name: "Mekatronik",                   color: "#D97706", departmentId: "dept-makine"  },
  { id: "prog-in", name: "İnşaat",                       color: "#EF4444", departmentId: "dept-insaat"  },
  { id: "prog-km", name: "Kimya Teknolojisi",            color: "#8B5CF6", departmentId: "dept-kimya"   },
  { id: "prog-gd", name: "Gıda Teknolojisi",             color: "#EC4899", departmentId: "dept-gida"    },
  { id: "prog-as", name: "Aşçılık",                      color: "#F97316", departmentId: "dept-turizm"  },
];

// ─── ROOMS (30) ───────────────────────────────────────────────────────────────
const ROOMS = [
  // A Blok
  { id: "room-a101", name: "A-101", capacity: 40 },
  { id: "room-a102", name: "A-102", capacity: 40 },
  { id: "room-a103", name: "A-103", capacity: 35 },
  { id: "room-a104", name: "A-104", capacity: 35 },
  { id: "room-a105", name: "A-105", capacity: 30 },
  { id: "room-a106", name: "A-106", capacity: 30 },
  // B Blok
  { id: "room-b101", name: "B-101", capacity: 40 },
  { id: "room-b102", name: "B-102", capacity: 40 },
  { id: "room-b103", name: "B-103", capacity: 35 },
  { id: "room-b104", name: "B-104", capacity: 35 },
  { id: "room-b105", name: "B-105", capacity: 30 },
  { id: "room-b106", name: "B-106", capacity: 30 },
  // C Blok
  { id: "room-c101", name: "C-101", capacity: 40 },
  { id: "room-c102", name: "C-102", capacity: 40 },
  { id: "room-c103", name: "C-103", capacity: 35 },
  { id: "room-c104", name: "C-104", capacity: 35 },
  { id: "room-c105", name: "C-105", capacity: 30 },
  { id: "room-c106", name: "C-106", capacity: 30 },
  // D Blok
  { id: "room-d101", name: "D-101", capacity: 40 },
  { id: "room-d102", name: "D-102", capacity: 40 },
  { id: "room-d103", name: "D-103", capacity: 35 },
  { id: "room-d104", name: "D-104", capacity: 35 },
  { id: "room-d105", name: "D-105", capacity: 30 },
  { id: "room-d106", name: "D-106", capacity: 30 },
  // E Blok
  { id: "room-e101", name: "E-101", capacity: 40 },
  { id: "room-e102", name: "E-102", capacity: 40 },
  { id: "room-e103", name: "E-103", capacity: 35 },
  { id: "room-e104", name: "E-104", capacity: 35 },
  { id: "room-e105", name: "E-105", capacity: 30 },
  { id: "room-e106", name: "E-106", capacity: 30 },
];

// ─── ROOM ASSIGNMENTS (3 per program = 30 total) ──────────────────────────────
const ROOM_ASSIGNMENTS = [
  // prog-bp: A-101, A-102, A-103
  { roomId: "room-a101", programId: "prog-bp" },
  { roomId: "room-a102", programId: "prog-bp" },
  { roomId: "room-a103", programId: "prog-bp" },
  // prog-wt: A-104, A-105, A-106
  { roomId: "room-a104", programId: "prog-wt" },
  { roomId: "room-a105", programId: "prog-wt" },
  { roomId: "room-a106", programId: "prog-wt" },
  // prog-el: B-101, B-102, B-103
  { roomId: "room-b101", programId: "prog-el" },
  { roomId: "room-b102", programId: "prog-el" },
  { roomId: "room-b103", programId: "prog-el" },
  // prog-ek: B-104, B-105, B-106
  { roomId: "room-b104", programId: "prog-ek" },
  { roomId: "room-b105", programId: "prog-ek" },
  { roomId: "room-b106", programId: "prog-ek" },
  // prog-mk: C-101, C-102, C-103
  { roomId: "room-c101", programId: "prog-mk" },
  { roomId: "room-c102", programId: "prog-mk" },
  { roomId: "room-c103", programId: "prog-mk" },
  // prog-me: C-104, C-105, C-106
  { roomId: "room-c104", programId: "prog-me" },
  { roomId: "room-c105", programId: "prog-me" },
  { roomId: "room-c106", programId: "prog-me" },
  // prog-in: D-101, D-102, D-103
  { roomId: "room-d101", programId: "prog-in" },
  { roomId: "room-d102", programId: "prog-in" },
  { roomId: "room-d103", programId: "prog-in" },
  // prog-km: D-104, D-105, D-106
  { roomId: "room-d104", programId: "prog-km" },
  { roomId: "room-d105", programId: "prog-km" },
  { roomId: "room-d106", programId: "prog-km" },
  // prog-gd: E-101, E-102, E-103
  { roomId: "room-e101", programId: "prog-gd" },
  { roomId: "room-e102", programId: "prog-gd" },
  { roomId: "room-e103", programId: "prog-gd" },
  // prog-as: E-104, E-105, E-106
  { roomId: "room-e104", programId: "prog-as" },
  { roomId: "room-e105", programId: "prog-as" },
  { roomId: "room-e106", programId: "prog-as" },
];

// ─── INSTRUCTORS (≥5 per department, 38 total) ────────────────────────────────
// dept-biltek (6): prog-bp×3 + prog-wt×3
// dept-elektrik (6): prog-el×3 + prog-ek×3
// dept-makine (6): prog-mk×3 + prog-me×3
// dept-insaat (5): prog-in×5
// dept-kimya (5): prog-km×5
// dept-gida (5): prog-gd×5
// dept-turizm (5): prog-as×5
const INSTRUCTORS = [
  // Bilgisayar Programcılığı
  { id: "inst-bp1", name: "Dr. Ahmet Yılmaz",         mainProgramId: "prog-bp", sideProgramIds: [] },
  { id: "inst-bp2", name: "Dr. Mehmet Kaya",           mainProgramId: "prog-bp", sideProgramIds: [] },
  { id: "inst-bp3", name: "Öğr. Gör. Ali Çelik",       mainProgramId: "prog-bp", sideProgramIds: [] },
  // Web Tasarımı ve Kodlama
  { id: "inst-wt1", name: "Öğr. Gör. Zeynep Arslan",   mainProgramId: "prog-wt", sideProgramIds: [] },
  { id: "inst-wt2", name: "Dr. Emre Doğan",            mainProgramId: "prog-wt", sideProgramIds: [] },
  { id: "inst-wt3", name: "Öğr. Gör. Selin Yıldız",    mainProgramId: "prog-wt", sideProgramIds: [] },
  // Elektronik Teknolojisi
  { id: "inst-el1", name: "Dr. Ayşe Demir",            mainProgramId: "prog-el", sideProgramIds: [] },
  { id: "inst-el2", name: "Öğr. Gör. Murat Şahin",     mainProgramId: "prog-el", sideProgramIds: [] },
  { id: "inst-el3", name: "Dr. Hasan Özkan",           mainProgramId: "prog-el", sideProgramIds: [] },
  // Elektrik
  { id: "inst-ek1", name: "Öğr. Gör. Fatma Polat",     mainProgramId: "prog-ek", sideProgramIds: [] },
  { id: "inst-ek2", name: "Dr. Serkan Türk",           mainProgramId: "prog-ek", sideProgramIds: [] },
  { id: "inst-ek3", name: "Öğr. Gör. Elif Koca",       mainProgramId: "prog-ek", sideProgramIds: [] },
  // Makine
  { id: "inst-mk1", name: "Dr. Ömer Aydın",            mainProgramId: "prog-mk", sideProgramIds: [] },
  { id: "inst-mk2", name: "Öğr. Gör. Bülent Güneş",    mainProgramId: "prog-mk", sideProgramIds: [] },
  { id: "inst-mk3", name: "Öğr. Gör. Tuba Erdoğan",    mainProgramId: "prog-mk", sideProgramIds: [] },
  // Mekatronik
  { id: "inst-me1", name: "Dr. Cengiz Kaplan",         mainProgramId: "prog-me", sideProgramIds: [] },
  { id: "inst-me2", name: "Öğr. Gör. Deniz Yılmaz",    mainProgramId: "prog-me", sideProgramIds: [] },
  { id: "inst-me3", name: "Dr. Osman Kara",            mainProgramId: "prog-me", sideProgramIds: [] },
  // İnşaat
  { id: "inst-in1", name: "Dr. Hüseyin Toprak",        mainProgramId: "prog-in", sideProgramIds: [] },
  { id: "inst-in2", name: "Öğr. Gör. Nurcan Aktaş",    mainProgramId: "prog-in", sideProgramIds: [] },
  { id: "inst-in3", name: "Dr. Recep Güler",           mainProgramId: "prog-in", sideProgramIds: [] },
  { id: "inst-in4", name: "Öğr. Gör. Sibel Koç",       mainProgramId: "prog-in", sideProgramIds: [] },
  { id: "inst-in5", name: "Dr. Yusuf Çetin",           mainProgramId: "prog-in", sideProgramIds: [] },
  // Kimya Teknolojisi
  { id: "inst-km1", name: "Dr. Leyla Özdemir",         mainProgramId: "prog-km", sideProgramIds: [] },
  { id: "inst-km2", name: "Öğr. Gör. Kemal Uçar",      mainProgramId: "prog-km", sideProgramIds: [] },
  { id: "inst-km3", name: "Dr. Pınar Arslan",          mainProgramId: "prog-km", sideProgramIds: [] },
  { id: "inst-km4", name: "Öğr. Gör. Barış Şen",       mainProgramId: "prog-km", sideProgramIds: [] },
  { id: "inst-km5", name: "Dr. Gülşen Akın",           mainProgramId: "prog-km", sideProgramIds: [] },
  // Gıda Teknolojisi
  { id: "inst-gd1", name: "Dr. Serap Kılıç",           mainProgramId: "prog-gd", sideProgramIds: [] },
  { id: "inst-gd2", name: "Öğr. Gör. Taner Duran",     mainProgramId: "prog-gd", sideProgramIds: [] },
  { id: "inst-gd3", name: "Dr. Filiz Yurt",            mainProgramId: "prog-gd", sideProgramIds: [] },
  { id: "inst-gd4", name: "Öğr. Gör. Cenk Aydın",      mainProgramId: "prog-gd", sideProgramIds: [] },
  { id: "inst-gd5", name: "Dr. Hatice Özcan",          mainProgramId: "prog-gd", sideProgramIds: [] },
  // Aşçılık
  { id: "inst-as1", name: "Öğr. Gör. Mustafa Doğan",   mainProgramId: "prog-as", sideProgramIds: [] },
  { id: "inst-as2", name: "Dr. Şerife Yılmaz",         mainProgramId: "prog-as", sideProgramIds: [] },
  { id: "inst-as3", name: "Öğr. Gör. Cem Kaya",        mainProgramId: "prog-as", sideProgramIds: [] },
  { id: "inst-as4", name: "Dr. Rukiye Çelik",          mainProgramId: "prog-as", sideProgramIds: [] },
  { id: "inst-as5", name: "Öğr. Gör. Adnan Polat",     mainProgramId: "prog-as", sideProgramIds: [] },
];

// ─── COURSES (20 per program = 200 total) ─────────────────────────────────────
// 3-instructor programs: round-robin → inst1:7, inst2:7, inst3:6
// 5-instructor programs: round-robin → each gets 4
const COURSES = [
  // ── Bilgisayar Programcılığı (BPR) ──────────────────────────────────────
  { id: "c-bpr101", code: "BPR101", name: "Programlamaya Giriş",              section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp1" },
  { id: "c-bpr102", code: "BPR102", name: "Nesne Yönelimli Programlama",       section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp2" },
  { id: "c-bpr103", code: "BPR103", name: "Web Programlama I",                 section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp3" },
  { id: "c-bpr104", code: "BPR104", name: "Bilgisayar Donanımı",               section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp1" },
  { id: "c-bpr105", code: "BPR105", name: "Matematik I",                       section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp2" },
  { id: "c-bpr106", code: "BPR106", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp3" },
  { id: "c-bpr107", code: "BPR107", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp1" },
  { id: "c-bpr108", code: "BPR108", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp2" },
  { id: "c-bpr109", code: "BPR109", name: "Temel Elektronik",                  section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp3" },
  { id: "c-bpr110", code: "BPR110", name: "İşletim Sistemleri",                section: 1, grade: 1, quota: 30, programId: "prog-bp", instructorId: "inst-bp1" },
  { id: "c-bpr201", code: "BPR201", name: "Veri Tabanı Yönetim Sistemleri",    section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp2" },
  { id: "c-bpr202", code: "BPR202", name: "Algoritma ve Veri Yapıları",        section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp3" },
  { id: "c-bpr203", code: "BPR203", name: "Web Programlama II",                section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp1" },
  { id: "c-bpr204", code: "BPR204", name: "Sistem Analizi ve Tasarımı",        section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp2" },
  { id: "c-bpr205", code: "BPR205", name: "Mobil Uygulama Geliştirme",         section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp3" },
  { id: "c-bpr206", code: "BPR206", name: "Bilgisayar Ağları",                 section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp1" },
  { id: "c-bpr207", code: "BPR207", name: "Yazılım Mühendisliği",              section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp2" },
  { id: "c-bpr208", code: "BPR208", name: "Siber Güvenlik",                    section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp3" },
  { id: "c-bpr209", code: "BPR209", name: "Yapay Zeka Temelleri",              section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp1" },
  { id: "c-bpr210", code: "BPR210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-bp", instructorId: "inst-bp2" },

  // ── Web Tasarımı ve Kodlama (WTK) ────────────────────────────────────────
  { id: "c-wtk101", code: "WTK101", name: "HTML ve CSS Temelleri",             section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt1" },
  { id: "c-wtk102", code: "WTK102", name: "JavaScript I",                      section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt2" },
  { id: "c-wtk103", code: "WTK103", name: "Grafik Tasarım Temelleri",          section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt3" },
  { id: "c-wtk104", code: "WTK104", name: "Kullanıcı Arayüzü Tasarımı",        section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt1" },
  { id: "c-wtk105", code: "WTK105", name: "Matematik I",                       section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt2" },
  { id: "c-wtk106", code: "WTK106", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt3" },
  { id: "c-wtk107", code: "WTK107", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt1" },
  { id: "c-wtk108", code: "WTK108", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt2" },
  { id: "c-wtk109", code: "WTK109", name: "Renk ve Kompozisyon",               section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt3" },
  { id: "c-wtk110", code: "WTK110", name: "Tipografi",                         section: 1, grade: 1, quota: 30, programId: "prog-wt", instructorId: "inst-wt1" },
  { id: "c-wtk201", code: "WTK201", name: "JavaScript II",                     section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt2" },
  { id: "c-wtk202", code: "WTK202", name: "React Framework",                   section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt3" },
  { id: "c-wtk203", code: "WTK203", name: "Backend Geliştirme",                section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt1" },
  { id: "c-wtk204", code: "WTK204", name: "Responsive Web Tasarımı",           section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt2" },
  { id: "c-wtk205", code: "WTK205", name: "SEO ve Dijital Pazarlama",          section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt3" },
  { id: "c-wtk206", code: "WTK206", name: "Animasyon Temelleri",               section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt1" },
  { id: "c-wtk207", code: "WTK207", name: "E-Ticaret Sistemleri",              section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt2" },
  { id: "c-wtk208", code: "WTK208", name: "İçerik Yönetim Sistemleri",         section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt3" },
  { id: "c-wtk209", code: "WTK209", name: "Web Güvenliği",                     section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt1" },
  { id: "c-wtk210", code: "WTK210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-wt", instructorId: "inst-wt2" },

  // ── Elektronik Teknolojisi (ETK) ──────────────────────────────────────────
  { id: "c-etk101", code: "ETK101", name: "Temel Elektronik",                  section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el1" },
  { id: "c-etk102", code: "ETK102", name: "Devre Analizi",                     section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el2" },
  { id: "c-etk103", code: "ETK103", name: "Dijital Elektronik",                section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el3" },
  { id: "c-etk104", code: "ETK104", name: "Elektronik Malzemeler",             section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el1" },
  { id: "c-etk105", code: "ETK105", name: "Matematik I",                       section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el2" },
  { id: "c-etk106", code: "ETK106", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el3" },
  { id: "c-etk107", code: "ETK107", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el1" },
  { id: "c-etk108", code: "ETK108", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el2" },
  { id: "c-etk109", code: "ETK109", name: "Fizik I",                           section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el3" },
  { id: "c-etk110", code: "ETK110", name: "Mesleki Güvenlik",                  section: 1, grade: 1, quota: 30, programId: "prog-el", instructorId: "inst-el1" },
  { id: "c-etk201", code: "ETK201", name: "Mikrodenetleyiciler",               section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el2" },
  { id: "c-etk202", code: "ETK202", name: "Analog Elektronik",                 section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el3" },
  { id: "c-etk203", code: "ETK203", name: "Güç Elektroniği",                   section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el1" },
  { id: "c-etk204", code: "ETK204", name: "Haberleşme Elektroniği",            section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el2" },
  { id: "c-etk205", code: "ETK205", name: "Otomasyon Sistemleri",              section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el3" },
  { id: "c-etk206", code: "ETK206", name: "PCB Tasarımı",                      section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el1" },
  { id: "c-etk207", code: "ETK207", name: "Sensörler ve Transdüserler",        section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el2" },
  { id: "c-etk208", code: "ETK208", name: "Endüstriyel Elektronik",            section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el3" },
  { id: "c-etk209", code: "ETK209", name: "Robot Teknolojisi",                 section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el1" },
  { id: "c-etk210", code: "ETK210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-el", instructorId: "inst-el2" },

  // ── Elektrik (ELK) ────────────────────────────────────────────────────────
  { id: "c-elk101", code: "ELK101", name: "Elektrik Devre Analizi",            section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek1" },
  { id: "c-elk102", code: "ELK102", name: "Elektronik Temelleri",              section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek2" },
  { id: "c-elk103", code: "ELK103", name: "Elektrik Makineleri I",             section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek3" },
  { id: "c-elk104", code: "ELK104", name: "Elektrik Malzemeleri",              section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek1" },
  { id: "c-elk105", code: "ELK105", name: "Matematik I",                       section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek2" },
  { id: "c-elk106", code: "ELK106", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek3" },
  { id: "c-elk107", code: "ELK107", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek1" },
  { id: "c-elk108", code: "ELK108", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek2" },
  { id: "c-elk109", code: "ELK109", name: "Fizik I",                           section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek3" },
  { id: "c-elk110", code: "ELK110", name: "İş Güvenliği",                      section: 1, grade: 1, quota: 30, programId: "prog-ek", instructorId: "inst-ek1" },
  { id: "c-elk201", code: "ELK201", name: "Elektrik Makineleri II",            section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek2" },
  { id: "c-elk202", code: "ELK202", name: "Güç Sistemleri",                    section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek3" },
  { id: "c-elk203", code: "ELK203", name: "Elektrik Tesisatı",                 section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek1" },
  { id: "c-elk204", code: "ELK204", name: "Aydınlatma Tekniği",                section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek2" },
  { id: "c-elk205", code: "ELK205", name: "Enerji Verimliliği",                section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek3" },
  { id: "c-elk206", code: "ELK206", name: "PLC Programlama",                   section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek1" },
  { id: "c-elk207", code: "ELK207", name: "Yüksek Gerilim Tekniği",            section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek2" },
  { id: "c-elk208", code: "ELK208", name: "Alternatif Enerji Kaynakları",      section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek3" },
  { id: "c-elk209", code: "ELK209", name: "Akıllı Bina Sistemleri",            section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek1" },
  { id: "c-elk210", code: "ELK210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-ek", instructorId: "inst-ek2" },

  // ── Makine (MAK) ──────────────────────────────────────────────────────────
  { id: "c-mak101", code: "MAK101", name: "Teknik Resim I",                    section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk1" },
  { id: "c-mak102", code: "MAK102", name: "Malzeme Bilgisi",                   section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk2" },
  { id: "c-mak103", code: "MAK103", name: "Statik",                            section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk3" },
  { id: "c-mak104", code: "MAK104", name: "Mühendislik Matematiği I",          section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk1" },
  { id: "c-mak105", code: "MAK105", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk2" },
  { id: "c-mak106", code: "MAK106", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk3" },
  { id: "c-mak107", code: "MAK107", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk1" },
  { id: "c-mak108", code: "MAK108", name: "Fizik I",                           section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk2" },
  { id: "c-mak109", code: "MAK109", name: "Kimya",                             section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk3" },
  { id: "c-mak110", code: "MAK110", name: "İş Güvenliği",                      section: 1, grade: 1, quota: 30, programId: "prog-mk", instructorId: "inst-mk1" },
  { id: "c-mak201", code: "MAK201", name: "Teknik Resim II",                   section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk2" },
  { id: "c-mak202", code: "MAK202", name: "Dinamik",                           section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk3" },
  { id: "c-mak203", code: "MAK203", name: "Üretim Yöntemleri",                 section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk1" },
  { id: "c-mak204", code: "MAK204", name: "Makine Elemanları I",               section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk2" },
  { id: "c-mak205", code: "MAK205", name: "Termodinamik",                      section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk3" },
  { id: "c-mak206", code: "MAK206", name: "Akışkanlar Mekaniği",               section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk1" },
  { id: "c-mak207", code: "MAK207", name: "CNC Tezgah Operatörlüğü",           section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk2" },
  { id: "c-mak208", code: "MAK208", name: "Kalite Kontrol",                    section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk3" },
  { id: "c-mak209", code: "MAK209", name: "Bakım ve Onarım",                   section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk1" },
  { id: "c-mak210", code: "MAK210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-mk", instructorId: "inst-mk2" },

  // ── Mekatronik (MEK) ──────────────────────────────────────────────────────
  { id: "c-mek101", code: "MEK101", name: "Temel Elektrik-Elektronik",         section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me1" },
  { id: "c-mek102", code: "MEK102", name: "Programlamaya Giriş",               section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me2" },
  { id: "c-mek103", code: "MEK103", name: "Mekanik Sistemler",                 section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me3" },
  { id: "c-mek104", code: "MEK104", name: "Mühendislik Matematiği I",          section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me1" },
  { id: "c-mek105", code: "MEK105", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me2" },
  { id: "c-mek106", code: "MEK106", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me3" },
  { id: "c-mek107", code: "MEK107", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me1" },
  { id: "c-mek108", code: "MEK108", name: "Fizik I",                           section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me2" },
  { id: "c-mek109", code: "MEK109", name: "Malzeme Bilgisi",                   section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me3" },
  { id: "c-mek110", code: "MEK110", name: "Mesleki Güvenlik",                  section: 1, grade: 1, quota: 30, programId: "prog-me", instructorId: "inst-me1" },
  { id: "c-mek201", code: "MEK201", name: "PLC ve Otomasyon",                  section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me2" },
  { id: "c-mek202", code: "MEK202", name: "Robot Programlama",                 section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me3" },
  { id: "c-mek203", code: "MEK203", name: "Sensörler ve Aktüatörler",          section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me1" },
  { id: "c-mek204", code: "MEK204", name: "Hidrolik ve Pnömatik",              section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me2" },
  { id: "c-mek205", code: "MEK205", name: "Bilgisayar Destekli Tasarım",       section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me3" },
  { id: "c-mek206", code: "MEK206", name: "Endüstriyel Ağlar",                 section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me1" },
  { id: "c-mek207", code: "MEK207", name: "Makine Öğrenmesi Temelleri",        section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me2" },
  { id: "c-mek208", code: "MEK208", name: "Kontrol Sistemleri",                section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me3" },
  { id: "c-mek209", code: "MEK209", name: "Akıllı Üretim Sistemleri",          section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me1" },
  { id: "c-mek210", code: "MEK210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-me", instructorId: "inst-me2" },

  // ── İnşaat (INS) ──────────────────────────────────────────────────────────
  { id: "c-ins101", code: "INS101", name: "Yapı Malzemesi",                    section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in1" },
  { id: "c-ins102", code: "INS102", name: "Teknik Resim",                      section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in2" },
  { id: "c-ins103", code: "INS103", name: "Statik",                            section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in3" },
  { id: "c-ins104", code: "INS104", name: "Topografya",                        section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in4" },
  { id: "c-ins105", code: "INS105", name: "Mühendislik Matematiği",            section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in5" },
  { id: "c-ins106", code: "INS106", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in1" },
  { id: "c-ins107", code: "INS107", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in2" },
  { id: "c-ins108", code: "INS108", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in3" },
  { id: "c-ins109", code: "INS109", name: "Bilgisayar Destekli Çizim",         section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in4" },
  { id: "c-ins110", code: "INS110", name: "Mesleki Güvenlik",                  section: 1, grade: 1, quota: 30, programId: "prog-in", instructorId: "inst-in5" },
  { id: "c-ins201", code: "INS201", name: "Betonarme I",                       section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in1" },
  { id: "c-ins202", code: "INS202", name: "Zemin Mekaniği",                    section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in2" },
  { id: "c-ins203", code: "INS203", name: "Yapı Denetimi",                     section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in3" },
  { id: "c-ins204", code: "INS204", name: "Altyapı Sistemleri",                section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in4" },
  { id: "c-ins205", code: "INS205", name: "İnşaat Metraj ve Keşif",            section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in5" },
  { id: "c-ins206", code: "INS206", name: "Yol Yapım Tekniği",                 section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in1" },
  { id: "c-ins207", code: "INS207", name: "Su Yapıları",                       section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in2" },
  { id: "c-ins208", code: "INS208", name: "Deprem Mühendisliği Temelleri",     section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in3" },
  { id: "c-ins209", code: "INS209", name: "Bina Bilgisi",                      section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in4" },
  { id: "c-ins210", code: "INS210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-in", instructorId: "inst-in5" },

  // ── Kimya Teknolojisi (KMY) ───────────────────────────────────────────────
  { id: "c-kmy101", code: "KMY101", name: "Genel Kimya I",                     section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km1" },
  { id: "c-kmy102", code: "KMY102", name: "Analitik Kimya",                    section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km2" },
  { id: "c-kmy103", code: "KMY103", name: "Organik Kimya I",                   section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km3" },
  { id: "c-kmy104", code: "KMY104", name: "Kimya Laboratuvar Teknikleri",      section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km4" },
  { id: "c-kmy105", code: "KMY105", name: "Matematik I",                       section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km5" },
  { id: "c-kmy106", code: "KMY106", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km1" },
  { id: "c-kmy107", code: "KMY107", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km2" },
  { id: "c-kmy108", code: "KMY108", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km3" },
  { id: "c-kmy109", code: "KMY109", name: "Fizik I",                           section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km4" },
  { id: "c-kmy110", code: "KMY110", name: "Mesleki Güvenlik",                  section: 1, grade: 1, quota: 30, programId: "prog-km", instructorId: "inst-km5" },
  { id: "c-kmy201", code: "KMY201", name: "Genel Kimya II",                    section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km1" },
  { id: "c-kmy202", code: "KMY202", name: "Organik Kimya II",                  section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km2" },
  { id: "c-kmy203", code: "KMY203", name: "Endüstriyel Kimya",                 section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km3" },
  { id: "c-kmy204", code: "KMY204", name: "Polimer Kimyası",                   section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km4" },
  { id: "c-kmy205", code: "KMY205", name: "Çevre Kimyası",                     section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km5" },
  { id: "c-kmy206", code: "KMY206", name: "Biyokimya Temelleri",               section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km1" },
  { id: "c-kmy207", code: "KMY207", name: "Kalite Kontrol Yöntemleri",         section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km2" },
  { id: "c-kmy208", code: "KMY208", name: "Kimyasal Proses Tasarımı",          section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km3" },
  { id: "c-kmy209", code: "KMY209", name: "Atık Yönetimi",                     section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km4" },
  { id: "c-kmy210", code: "KMY210", name: "Bitirme Projesi",                   section: 1, grade: 2, quota: 28, programId: "prog-km", instructorId: "inst-km5" },

  // ── Gıda Teknolojisi (GDA) ────────────────────────────────────────────────
  { id: "c-gda101", code: "GDA101", name: "Gıda Kimyası",                      section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd1" },
  { id: "c-gda102", code: "GDA102", name: "Mikrobiyoloji Temelleri",           section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd2" },
  { id: "c-gda103", code: "GDA103", name: "Gıda İşleme Teknolojisi",          section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd3" },
  { id: "c-gda104", code: "GDA104", name: "Analitik Kimya",                    section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd4" },
  { id: "c-gda105", code: "GDA105", name: "Matematik I",                       section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd5" },
  { id: "c-gda106", code: "GDA106", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd1" },
  { id: "c-gda107", code: "GDA107", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd2" },
  { id: "c-gda108", code: "GDA108", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd3" },
  { id: "c-gda109", code: "GDA109", name: "Biyoloji",                          section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd4" },
  { id: "c-gda110", code: "GDA110", name: "Mesleki Güvenlik",                  section: 1, grade: 1, quota: 30, programId: "prog-gd", instructorId: "inst-gd5" },
  { id: "c-gda201", code: "GDA201", name: "Gıda Mikrobiyolojisi",              section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd1" },
  { id: "c-gda202", code: "GDA202", name: "Konserve Teknolojisi",              section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd2" },
  { id: "c-gda203", code: "GDA203", name: "Süt ve Süt Ürünleri Teknolojisi",  section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd3" },
  { id: "c-gda204", code: "GDA204", name: "Et ve Et Ürünleri Teknolojisi",    section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd4" },
  { id: "c-gda205", code: "GDA205", name: "Tahıl ve Ekmek Teknolojisi",       section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd5" },
  { id: "c-gda206", code: "GDA206", name: "Kalite Güvence ve Gıda Mevzuatı", section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd1" },
  { id: "c-gda207", code: "GDA207", name: "Ambalaj Teknolojisi",              section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd2" },
  { id: "c-gda208", code: "GDA208", name: "Soğuk Muhafaza",                   section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd3" },
  { id: "c-gda209", code: "GDA209", name: "Gıda Katkı Maddeleri",             section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd4" },
  { id: "c-gda210", code: "GDA210", name: "Bitirme Projesi",                  section: 1, grade: 2, quota: 28, programId: "prog-gd", instructorId: "inst-gd5" },

  // ── Aşçılık (ASC) ────────────────────────────────────────────────────────
  { id: "c-asc101", code: "ASC101", name: "Türk Mutfağı I",                    section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as1" },
  { id: "c-asc102", code: "ASC102", name: "Temel Pişirme Teknikleri",          section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as2" },
  { id: "c-asc103", code: "ASC103", name: "Pastacılık I",                      section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as3" },
  { id: "c-asc104", code: "ASC104", name: "Besin Hijyeni ve Sanitasyon",       section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as4" },
  { id: "c-asc105", code: "ASC105", name: "Türk Dili I",                       section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as5" },
  { id: "c-asc106", code: "ASC106", name: "Yabancı Dil I",                     section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as1" },
  { id: "c-asc107", code: "ASC107", name: "Atatürk İlkeleri I",                section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as2" },
  { id: "c-asc108", code: "ASC108", name: "Beslenme İlkeleri",                 section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as3" },
  { id: "c-asc109", code: "ASC109", name: "Menü Planlama",                     section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as4" },
  { id: "c-asc110", code: "ASC110", name: "Mutfak Ekipmanları",                section: 1, grade: 1, quota: 30, programId: "prog-as", instructorId: "inst-as5" },
  { id: "c-asc201", code: "ASC201", name: "Türk Mutfağı II",                   section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as1" },
  { id: "c-asc202", code: "ASC202", name: "Dünya Mutfakları",                  section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as2" },
  { id: "c-asc203", code: "ASC203", name: "Pastacılık II",                     section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as3" },
  { id: "c-asc204", code: "ASC204", name: "Restoran İşletmeciliği",            section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as4" },
  { id: "c-asc205", code: "ASC205", name: "Catering Hizmetleri",               section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as5" },
  { id: "c-asc206", code: "ASC206", name: "Soğuk Mutfak Uygulamaları",        section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as1" },
  { id: "c-asc207", code: "ASC207", name: "Ziyafet Yönetimi",                 section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as2" },
  { id: "c-asc208", code: "ASC208", name: "İçecek Servisi",                   section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as3" },
  { id: "c-asc209", code: "ASC209", name: "Mutfak Maliyet Analizi",           section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as4" },
  { id: "c-asc210", code: "ASC210", name: "Bitirme Projesi",                  section: 1, grade: 2, quota: 28, programId: "prog-as", instructorId: "inst-as5" },
];

// ─── SCHEDULE DAYS ────────────────────────────────────────────────────────────
const SCHEDULE_DAYS = [
  { id: "day-1", date: "09.06.2025", sessions: ["09:30", "11:00", "13:00", "14:30", "15:30"] },
  { id: "day-2", date: "10.06.2025", sessions: ["09:00", "10:30", "13:00", "14:30", "16:00"] },
  { id: "day-3", date: "11.06.2025", sessions: ["09:30", "11:00", "14:00", "15:30"] },
  { id: "day-4", date: "12.06.2025", sessions: ["09:00", "11:00", "13:00", "15:00"] },
  { id: "day-5", date: "13.06.2025", sessions: ["09:00", "11:00", "14:00", "15:00", "16:00"] },
];

// ─── USERS (admin + 10 dept heads) ───────────────────────────────────────────
const DEPT_HEADS = [
  { id: "user-bp", name: "Dr. Ahmet Yılmaz",        email: "bp@amasya.edu.tr",  programId: "prog-bp" },
  { id: "user-wt", name: "Dr. Emre Doğan",           email: "wt@amasya.edu.tr",  programId: "prog-wt" },
  { id: "user-el", name: "Dr. Ayşe Demir",           email: "el@amasya.edu.tr",  programId: "prog-el" },
  { id: "user-ek", name: "Dr. Serkan Türk",          email: "ek@amasya.edu.tr",  programId: "prog-ek" },
  { id: "user-mk", name: "Dr. Ömer Aydın",           email: "mk@amasya.edu.tr",  programId: "prog-mk" },
  { id: "user-me", name: "Dr. Cengiz Kaplan",        email: "me@amasya.edu.tr",  programId: "prog-me" },
  { id: "user-in", name: "Dr. Hüseyin Toprak",       email: "in@amasya.edu.tr",  programId: "prog-in" },
  { id: "user-km", name: "Dr. Leyla Özdemir",        email: "km@amasya.edu.tr",  programId: "prog-km" },
  { id: "user-gd", name: "Dr. Serap Kılıç",          email: "gd@amasya.edu.tr",  programId: "prog-gd" },
  { id: "user-as", name: "Dr. Şerife Yılmaz",        email: "as@amasya.edu.tr",  programId: "prog-as" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Seed başlatılıyor...\n");

  // 1. Departments
  console.log("1/8 Bölümler oluşturuluyor...");
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { name: dept.name },
      create: dept,
    });
  }

  // 2. Programs
  console.log("2/8 Programlar oluşturuluyor...");
  for (const prog of PROGRAMS) {
    await prisma.program.upsert({
      where: { id: prog.id },
      update: { name: prog.name, color: prog.color },
      create: prog,
    });
  }

  // 3. Rooms
  console.log("3/8 Derslikler oluşturuluyor...");
  await prisma.room.createMany({ data: ROOMS, skipDuplicates: true });

  // 4. Room Assignments
  console.log("4/8 Derslik atamaları yapılıyor...");
  await prisma.roomAssignment.createMany({ data: ROOM_ASSIGNMENTS, skipDuplicates: true });

  // 5. Instructors
  console.log("5/8 Öğretim elemanları oluşturuluyor...");
  for (const inst of INSTRUCTORS) {
    await prisma.instructor.upsert({
      where: { id: inst.id },
      update: { name: inst.name, mainProgramId: inst.mainProgramId, sideProgramIds: inst.sideProgramIds },
      create: inst,
    });
  }

  // 6. Courses
  console.log("6/8 Dersler oluşturuluyor...");
  await prisma.course.createMany({ data: COURSES, skipDuplicates: true });

  // 7. Schedule Days
  console.log("7/8 Sınav günleri oluşturuluyor...");
  await prisma.scheduleDay.createMany({ data: SCHEDULE_DAYS, skipDuplicates: true });

  // 8. Users
  console.log("8/8 Kullanıcılar oluşturuluyor...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const deptPassword  = await bcrypt.hash("dept123",  10);

  await prisma.user.upsert({
    where: { email: "admin@amasya.edu.tr" },
    update: {},
    create: { id: "user-admin", name: "Sistem Yöneticisi", email: "admin@amasya.edu.tr", password: adminPassword, role: Role.ADMIN },
  });

  for (const dh of DEPT_HEADS) {
    const user = await prisma.user.upsert({
      where: { email: dh.email },
      update: {},
      create: { id: dh.id, name: dh.name, email: dh.email, password: deptPassword, role: Role.DEPT_HEAD },
    });
    await prisma.userProgram.upsert({
      where: { userId_programId: { userId: user.id, programId: dh.programId } },
      update: {},
      create: { userId: user.id, programId: dh.programId, type: UserProgramType.MAIN },
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✓ Seed tamamlandı!\n");
  console.log("─── Özet ─────────────────────────────────────────────────────");
  console.log(`  Bölüm    : ${DEPARTMENTS.length}`);
  console.log(`  Program  : ${PROGRAMS.length}`);
  console.log(`  Derslik  : ${ROOMS.length}`);
  console.log(`  Atama    : ${ROOM_ASSIGNMENTS.length}`);
  console.log(`  Hoca     : ${INSTRUCTORS.length}`);
  console.log(`  Ders     : ${COURSES.length}`);
  console.log("──────────────────────────────────────────────────────────────");
  console.log("\nGiriş bilgileri:");
  console.log("  Admin   : admin@amasya.edu.tr    / admin123");
  console.log("  Bölüm   : bp@amasya.edu.tr       / dept123  (Bilgisayar Programcılığı)");
  console.log("  Bölüm   : wt@amasya.edu.tr       / dept123  (Web Tasarımı ve Kodlama)");
  console.log("  Bölüm   : el@amasya.edu.tr       / dept123  (Elektronik Teknolojisi)");
  console.log("  Bölüm   : ek@amasya.edu.tr       / dept123  (Elektrik)");
  console.log("  Bölüm   : mk@amasya.edu.tr       / dept123  (Makine)");
  console.log("  Bölüm   : me@amasya.edu.tr       / dept123  (Mekatronik)");
  console.log("  Bölüm   : in@amasya.edu.tr       / dept123  (İnşaat)");
  console.log("  Bölüm   : km@amasya.edu.tr       / dept123  (Kimya Teknolojisi)");
  console.log("  Bölüm   : gd@amasya.edu.tr       / dept123  (Gıda Teknolojisi)");
  console.log("  Bölüm   : as@amasya.edu.tr       / dept123  (Aşçılık)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
