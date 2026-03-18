import { PrismaClient, Role, UserDepartmentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Departments
  const depts = await Promise.all([
    prisma.department.upsert({
      where: { id: "dept-bilgisayar" },
      update: {},
      create: { id: "dept-bilgisayar", name: "Bilgisayar Programcılığı", color: "#3B82F6" },
    }),
    prisma.department.upsert({
      where: { id: "dept-elektronik" },
      update: {},
      create: { id: "dept-elektronik", name: "Elektronik Teknolojisi", color: "#10B981" },
    }),
    prisma.department.upsert({
      where: { id: "dept-makine" },
      update: {},
      create: { id: "dept-makine", name: "Makine", color: "#F59E0B" },
    }),
  ]);

  // Rooms
  const rooms = await Promise.all([
    prisma.room.upsert({ where: { name: "A-101" }, update: {}, create: { id: "room-a101", name: "A-101" } }),
    prisma.room.upsert({ where: { name: "A-102" }, update: {}, create: { id: "room-a102", name: "A-102" } }),
    prisma.room.upsert({ where: { name: "A-201" }, update: {}, create: { id: "room-a201", name: "A-201" } }),
    prisma.room.upsert({ where: { name: "B-101" }, update: {}, create: { id: "room-b101", name: "B-101" } }),
    prisma.room.upsert({ where: { name: "B-102" }, update: {}, create: { id: "room-b102", name: "B-102" } }),
  ]);

  // Room assignments
  await prisma.roomAssignment.createMany({
    data: [
      { roomId: "room-a101", departmentId: "dept-bilgisayar" },
      { roomId: "room-a102", departmentId: "dept-bilgisayar" },
      { roomId: "room-a201", departmentId: "dept-elektronik" },
      { roomId: "room-b101", departmentId: "dept-makine" },
      { roomId: "room-b102", departmentId: "dept-makine" },
    ],
    skipDuplicates: true,
  });

  // Instructors
  const instructors = await Promise.all([
    prisma.instructor.upsert({
      where: { id: "inst-ahmet" },
      update: {},
      create: { id: "inst-ahmet", name: "Dr. Ahmet Yılmaz", mainDeptId: "dept-bilgisayar" },
    }),
    prisma.instructor.upsert({
      where: { id: "inst-mehmet" },
      update: {},
      create: { id: "inst-mehmet", name: "Dr. Mehmet Kaya", mainDeptId: "dept-bilgisayar" },
    }),
    prisma.instructor.upsert({
      where: { id: "inst-ayse" },
      update: {},
      create: { id: "inst-ayse", name: "Öğr. Gör. Ayşe Demir", mainDeptId: "dept-elektronik" },
    }),
    prisma.instructor.upsert({
      where: { id: "inst-fatma" },
      update: {},
      create: { id: "inst-fatma", name: "Öğr. Gör. Fatma Çelik", mainDeptId: "dept-makine", sideDeptIds: ["dept-bilgisayar"] },
    }),
  ]);

  // Courses
  await prisma.course.createMany({
    data: [
      { id: "course-pro1", code: "BPR101", name: "Programlamaya Giriş", section: 1, grade: 1, quota: 30, departmentId: "dept-bilgisayar", instructorId: "inst-ahmet" },
      { id: "course-pro2", code: "BPR102", name: "Nesne Yönelimli Programlama", section: 1, grade: 1, quota: 30, departmentId: "dept-bilgisayar", instructorId: "inst-mehmet" },
      { id: "course-vt1", code: "BPR201", name: "Veri Tabanı Yönetim Sistemleri", section: 1, grade: 2, quota: 30, departmentId: "dept-bilgisayar", instructorId: "inst-ahmet" },
      { id: "course-el1", code: "ETK101", name: "Temel Elektronik", section: 1, grade: 1, quota: 25, departmentId: "dept-elektronik", instructorId: "inst-ayse" },
      { id: "course-mk1", code: "MAK101", name: "Teknik Resim", section: 1, grade: 1, quota: 25, departmentId: "dept-makine", instructorId: "inst-fatma" },
    ],
    skipDuplicates: true,
  });

  // Schedule days
  await prisma.scheduleDay.createMany({
    data: [
      { id: "day-1", date: "09.06.2025", sessions: ["09:30", "11:00", "13:00", "14:30", "15:30"] },
      { id: "day-2", date: "10.06.2025", sessions: ["09:00", "10:30", "13:00", "14:30", "16:00"] },
      { id: "day-3", date: "11.06.2025", sessions: ["09:30", "11:00", "14:00", "15:30"] },
      { id: "day-4", date: "12.06.2025", sessions: ["09:00", "11:00", "13:00", "15:00"] },
      { id: "day-5", date: "13.06.2025", sessions: ["09:00", "11:00", "14:00", "15:00", "16:00"] },
    ],
    skipDuplicates: true,
  });

  // Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const deptPassword = await bcrypt.hash("dept123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@amasya.edu.tr" },
    update: {},
    create: {
      id: "user-admin",
      name: "Sistem Yöneticisi",
      email: "admin@amasya.edu.tr",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const deptHead1 = await prisma.user.upsert({
    where: { email: "bilgisayar@amasya.edu.tr" },
    update: {},
    create: {
      id: "user-bilgisayar",
      name: "Dr. Ahmet Yılmaz",
      email: "bilgisayar@amasya.edu.tr",
      password: deptPassword,
      role: Role.DEPT_HEAD,
    },
  });

  const deptHead2 = await prisma.user.upsert({
    where: { email: "elektronik@amasya.edu.tr" },
    update: {},
    create: {
      id: "user-elektronik",
      name: "Öğr. Gör. Ayşe Demir",
      email: "elektronik@amasya.edu.tr",
      password: deptPassword,
      role: Role.DEPT_HEAD,
    },
  });

  await prisma.userDepartment.createMany({
    data: [
      { userId: "user-bilgisayar", departmentId: "dept-bilgisayar", type: UserDepartmentType.MAIN },
      { userId: "user-elektronik", departmentId: "dept-elektronik", type: UserDepartmentType.MAIN },
    ],
    skipDuplicates: true,
  });

  console.log("Seed tamamlandı.");
  console.log("Admin: admin@amasya.edu.tr / admin123");
  console.log("Bölüm Başkanı: bilgisayar@amasya.edu.tr / dept123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
