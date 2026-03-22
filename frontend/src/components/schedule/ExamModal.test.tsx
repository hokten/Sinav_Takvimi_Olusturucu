import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamModal } from './ExamModal';
import * as examActions from '@/app/actions/exams';

// Mock the actions
vi.mock('@/app/actions/exams', () => ({
  createExam: vi.fn(),
  updateExam: vi.fn(),
}));

const mockCourses = [
  {
    id: 'c1',
    code: 'BIL101',
    name: 'Giriş',
    section: 1,
    quota: 30,
    instructorId: 'i1',
    programId: 'p1',
    adminOnly: false,
    instructor: { id: 'i1', name: 'Hoca 1', mainProgramId: 'p1' },
    program: { id: 'p1', name: 'Bilgisayar', color: 'blue', isSharedSource: false }
  }
];

const mockRooms = [
  { id: 'r1', name: 'LAB 1', capacity: 40 },
  { id: 'r2', name: 'LAB 2', capacity: 20 }
];

const mockInstructors = [
  { id: 'i1', name: 'Hoca 1', mainProgramId: 'p1' },
  { id: 'i2', name: 'Hoca 2', mainProgramId: 'p1' }
];

const mockScheduleDays = [
  { id: 'd1', date: '2026-06-01', sessions: ['10:00', '11:00'] }
];

describe('ExamModal', () => {
  const defaultProps = {
    exam: null,
    programId: 'p1',
    isAdmin: false,
    scheduleDays: mockScheduleDays,
    courses: mockCourses,
    rooms: mockRooms,
    instructors: mockInstructors,
    roomAssignments: [{ roomId: 'r1', programId: 'p1' }, { roomId: 'r2', programId: 'p1' }],
    existingExams: [],
    approvedReservations: [],
    sharedSourceProgramIds: [],
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('modalı başarıyla başlatmalı ve "Yeni Sınav Ekle" başlığını göstermeli', () => {
    render(<ExamModal {...defaultProps} />);
    expect(screen.getByText('Yeni Sınav Ekle')).toBeInTheDocument();
  });

  it('tüm alanlar boşsa hata mesajı göstermeli', async () => {
    render(<ExamModal {...defaultProps} />);
    
    const submitBtn = screen.getByRole('button', { name: /Ekle/i });
    fireEvent.click(submitBtn);

    expect(defaultProps.onError).toHaveBeenCalledWith('Ders seçiniz.');
  });

  it('başarılı bir sınav oluşturma akışı', async () => {
    render(<ExamModal {...defaultProps} />);

    // 1. Ders seçimi
    const courseInput = screen.getByPlaceholderText(/Ders kodu veya adını yazın/i);
    fireEvent.focus(courseInput);
    fireEvent.change(courseInput, { target: { value: 'BIL101' } });
    
    const courseBtn = await screen.findByText(/\[BIL101\] Giriş/i);
    fireEvent.click(courseBtn);

    // 2. Tarih seçimi
    const dateSelect = screen.getByLabelText(/Tarih/i);
    fireEvent.change(dateSelect, { target: { value: '2026-06-01' } });

    // 3. Saat seçimi
    const timeSelect = screen.getByLabelText(/Oturum Saati/i);
    fireEvent.change(timeSelect, { target: { value: '10:00' } });

    // 4. Salon seçimi (LAB 1 - 40 kapasite)
    const roomBtn = screen.getByRole('button', { name: /LAB 1\s*\(\s*40\s*\)/i });
    fireEvent.click(roomBtn);

    // 5. Gözetmen seçimi
    const supervisorBtn = screen.getByText(/Hoca 2/i);
    fireEvent.click(supervisorBtn);

    // 6. Kaydet
    const submitBtn = screen.getByRole('button', { name: /Ekle/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(examActions.createExam).toHaveBeenCalledWith(expect.objectContaining({
        courseId: 'c1',
        date: '2026-06-01',
        time: '10:00',
        roomIds: ['r1'],
        supervisorIds: ['Hoca 2']
      }));
    });
    
    expect(defaultProps.onSuccess).toHaveBeenCalledWith('Sınav eklendi.');
  });

  it('kapasite yetersizse butonu devre dışı bırakmalı ve mesaj göstermeli', async () => {
    render(<ExamModal {...defaultProps} />);

    // 1. Ders seçimi
    const courseInput = screen.getByPlaceholderText(/Ders kodu veya adını yazın/i);
    fireEvent.change(courseInput, { target: { value: 'BIL101' } });
    const courseBtn = await screen.findByText(/\[BIL101\] Giriş/i);
    fireEvent.click(courseBtn);

    // 2. Tarih ve Saat
    fireEvent.change(screen.getByLabelText(/Tarih/i), { target: { value: '2026-06-01' } });
    fireEvent.change(screen.getByLabelText(/Oturum Saati/i), { target: { value: '10:00' } });

    // 3. Yetersiz kapasiteli salon seçimi (LAB 2 - 20 kapasite, kota 30)
    const roomBtn = screen.getByRole('button', { name: /LAB 2\s*\(\s*20\s*\)/i });
    fireEvent.click(roomBtn);

    // Buton devre dışı olmalı
    const submitBtn = screen.getByRole('button', { name: /Ekle/i });
    expect(submitBtn).toBeDisabled();

    // Hata mesajı görünür olmalı
    expect(screen.getByText(/⚠ Kapasite yetersiz:/i)).toBeInTheDocument();
  });
});
