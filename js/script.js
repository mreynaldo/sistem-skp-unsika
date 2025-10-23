// Menunggu hingga DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi form SKP
    const skpForm = document.getElementById('skp-form');
    const resultSection = document.getElementById('result');
    
    // Event listener untuk form submission
    skpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Ambil nilai dari form
        const activityType = document.getElementById('activity-type').value;
        const activityLevel = document.getElementById('activity-level').value;
        const role = document.getElementById('role').value;
        const duration = parseInt(document.getElementById('duration').value);
        
        // Validasi input
        if (!activityType || !activityLevel || !role || !duration) {
            alert('Harap lengkapi semua field!');
            return;
        }
        
        // Hitung poin berdasarkan parameter
        let points = calculateSKPPoints(activityType, activityLevel, role, duration);
        
        // Tampilkan hasil
        document.getElementById('total-points').textContent = points;
        document.getElementById('result-description').textContent = generateResultDescription(activityType, activityLevel, role, duration, points);
        
        // Tampilkan section hasil
        resultSection.classList.add('active');
        
        // Scroll ke hasil
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Fungsi untuk menghitung poin SKP
    function calculateSKPPoints(type, level, role, duration) {
        let basePoints = 0;
        
        // Poin dasar berdasarkan jenis kegiatan
        switch(type) {
            case 'akademik':
                basePoints = 5;
                break;
            case 'organisasi':
                basePoints = 4;
                break;
            case 'penelitian':
                basePoints = 6;
                break;
            case 'pengabdian':
                basePoints = 7;
                break;
            case 'prestasi':
                basePoints = 8;
                break;
        }
        
        // Multiplier berdasarkan tingkat kegiatan
        let levelMultiplier = 1;
        switch(level) {
            case 'internal':
                levelMultiplier = 1;
                break;
            case 'lokal':
                levelMultiplier = 1.5;
                break;
            case 'nasional':
                levelMultiplier = 2;
                break;
            case 'internasional':
                levelMultiplier = 3;
                break;
        }
        
        // Multiplier berdasarkan peran
        let roleMultiplier = 1;
        switch(role) {
            case 'peserta':
                roleMultiplier = 1;
                break;
            case 'panitia':
                roleMultiplier = 1.5;
                break;
            case 'pembicara':
                roleMultiplier = 2;
                break;
            case 'ketua':
                roleMultiplier = 2.5;
                break;
        }
        
        // Hitung total poin
        let totalPoints = basePoints * levelMultiplier * roleMultiplier;
        
        // Tambahkan poin berdasarkan durasi (maksimal 50% dari total)
        let durationBonus = Math.min(duration * 0.1, totalPoints * 0.5);
        totalPoints += durationBonus;
        
        // Bulatkan ke angka terdekat
        return Math.round(totalPoints);
    }
    
    // Fungsi untuk menghasilkan deskripsi hasil
    function generateResultDescription(type, level, role, duration, points) {
        const typeText = {
            'akademik': 'Kegiatan Akademik',
            'organisasi': 'Kegiatan Organisasi',
            'penelitian': 'Kegiatan Penelitian',
            'pengabdian': 'Kegiatan Pengabdian Masyarakat',
            'prestasi': 'Prestasi'
        };
        
        const levelText = {
            'internal': 'Tingkat Internal Kampus',
            'lokal': 'Tingkat Lokal/Wilayah',
            'nasional': 'Tingkat Nasional',
            'internasional': 'Tingkat Internasional'
        };
        
        const roleText = {
            'peserta': 'sebagai Peserta',
            'panitia': 'sebagai Panitia',
            'pembicara': 'sebagai Pembicara/Pemateri',
            'ketua': 'sebagai Ketua Panitia'
        };
        
        return `Anda mengikuti ${typeText[type]} ${levelText[level]} ${roleText[role]} selama ${duration} jam. Total poin SKP yang Anda peroleh adalah ${points} poin.`;
    }
    
    // Smooth scrolling untuk navigasi
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});