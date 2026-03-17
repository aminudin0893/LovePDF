import { Tool } from './types';

export const TOOLS: Tool[] = [
  {
    id: 'merge',
    title: 'Gabungkan PDF',
    description: 'Gabungkan file PDF sesuai urutan yang Anda inginkan dengan penggabung PDF termudah.',
    icon: 'Merge',
    category: 'organize'
  },
  {
    id: 'split',
    title: 'Pisahkan PDF',
    description: 'Pisahkan satu halaman atau seluruh rangkaian untuk konversi mudah menjadi file PDF independen.',
    icon: 'Scissors',
    category: 'organize'
  },
  {
    id: 'compress',
    title: 'Kompres PDF',
    description: 'Kurangi ukuran file sambil mengoptimalkan kualitas PDF maksimal.',
    icon: 'Minimize2',
    category: 'optimize'
  },
  {
    id: 'pdf-to-word',
    title: 'PDF ke Word',
    description: 'Konversi file PDF Anda dengan mudah menjadi dokumen DOC dan DOCX yang mudah diedit.',
    icon: 'FileText',
    category: 'convert-from'
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF ke JPG',
    description: 'Ekstrak semua gambar dari PDF atau konversi setiap halaman menjadi gambar JPG.',
    icon: 'Image',
    category: 'convert-from'
  },
  {
    id: 'jpg-to-pdf',
    title: 'JPG ke PDF',
    description: 'Konversi gambar JPG ke PDF dalam hitungan detik. Sesuaikan orientasi dan margin dengan mudah.',
    icon: 'FileImage',
    category: 'convert-to'
  },
  {
    id: 'rotate',
    title: 'Putar PDF',
    description: 'Putar PDF Anda sesuai kebutuhan. Anda bahkan dapat memutar beberapa PDF sekaligus!',
    icon: 'RotateCw',
    category: 'edit'
  },
  {
    id: 'unlock',
    title: 'Buka Kunci PDF',
    description: 'Hapus keamanan kata sandi PDF, memberi Anda kebebasan untuk menggunakan PDF sesuai keinginan.',
    icon: 'Unlock',
    category: 'security'
  },
  {
    id: 'protect',
    title: 'Proteksi PDF',
    description: 'Lindungi file PDF dengan kata sandi. Enkripsi dokumen PDF untuk mencegah akses tidak sah.',
    icon: 'Lock',
    category: 'security'
  },
  {
    id: 'edit',
    title: 'Edit PDF',
    description: 'Edit file PDF langsung di browser Anda. Tambahkan teks, gambar, dan bentuk dengan mudah.',
    icon: 'Edit',
    category: 'edit'
  },
  {
    id: 'page-numbers',
    title: 'Nomor Halaman',
    description: 'Tambahkan nomor halaman ke PDF dengan mudah. Pilih posisi, dimensi, dan tipografi.',
    icon: 'FileText',
    category: 'edit'
  },
  {
    id: 'watermark',
    title: 'Watermark',
    description: 'Bubuhkan gambar atau teks di atas PDF Anda dalam hitungan detik. Pilih tipografi dan posisi.',
    icon: 'ImageIcon',
    category: 'edit'
  },
  {
    id: 'repair',
    title: 'Perbaiki PDF',
    description: 'Perbaiki PDF yang rusak dan pulihkan data dari PDF yang korup dengan alat Perbaikan kami.',
    icon: 'Scissors',
    category: 'optimize'
  },
  {
    id: 'organize',
    title: 'Atur PDF',
    description: 'Urutkan, tambah, dan hapus halaman PDF. Seret dan lepas thumbnail halaman untuk mengatur ulang.',
    icon: 'Layout',
    category: 'organize'
  }
];
