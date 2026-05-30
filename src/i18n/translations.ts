/**
 * UI translations for N-Movie. Indonesian default since the audience is
 * primarily Indonesian, with English fallback.
 *
 * Add new strings as flat dot-notation keys (e.g. `nav.home`). The
 * `useT()` hook will return the value, and missing keys fall back to the
 * key itself so it's obvious in dev which strings are untranslated.
 *
 * Interpolation: use `{name}` placeholders, pass values to `t('key', { name: 'X' })`.
 */

export type Locale = 'id' | 'en';

type Dict = Record<string, string>;

const id: Dict = {
  // Common
  'common.cancel': 'Batal',
  'common.confirm': 'Konfirmasi',
  'common.save': 'Simpan',
  'common.delete': 'Hapus',
  'common.remove': 'Hapus',
  'common.loading': 'Memuat...',
  'common.error': 'Terjadi kesalahan',
  'common.retry': 'Coba lagi',
  'common.close': 'Tutup',
  'common.search': 'Cari',
  'common.back': 'Kembali',
  'common.continue': 'Lanjutkan',
  'common.viewAll': 'Lihat semua',
  'common.explore': 'Jelajahi',
  'common.yes': 'Ya',
  'common.no': 'Tidak',

  // Navigation
  'nav.home': 'Beranda',
  'nav.search': 'Cari',
  'nav.genres': 'Genre',
  'nav.library': 'Koleksi',
  'nav.history': 'Riwayat',
  'nav.profile': 'Profil',
  'nav.settings': 'Pengaturan',
  'nav.admin': 'Admin',
  'nav.login': 'Masuk',
  'nav.logout': 'Keluar',
  'nav.register': 'Daftar',
  'nav.donate': 'Dukung',

  // Home
  'home.trendingMovies': 'Film Populer',
  'home.popularTv': 'Serial TV Populer',
  'home.indonesianMovies': 'Populer di Indonesia',
  'home.indonesianSeries': 'Serial Indonesia',
  'home.actionHits': 'Aksi Pilihan',
  'home.recommended': 'Direkomendasikan untukmu',
  'home.continueWatching': 'Lanjutkan Menonton',
  'home.watchNow': 'Tonton Sekarang',
  'home.details': 'Detail',
  'home.percentMatch': '{value}% Cocok',

  // Search
  'search.title': 'Cari',
  'search.placeholder': 'Cari film, serial, dan banyak lagi...',
  'search.noResults': 'Tidak ada hasil',
  'search.startTyping': 'Mulai mengetik untuk mencari',
  'search.filters': 'Filter',
  'search.year': 'Tahun',
  'search.genre': 'Genre',
  'search.language': 'Bahasa',
  'search.type': 'Tipe',
  'search.sort': 'Urutkan',
  'search.allTypes': 'Semua',
  'search.movies': 'Film',
  'search.series': 'Serial',
  'search.allGenres': 'Semua Genre',
  'search.allYears': 'Semua Tahun',
  'search.allLanguages': 'Semua Bahasa',
  'search.sortPopularity': 'Popularitas',
  'search.sortRating': 'Rating',
  'search.sortNewest': 'Terbaru',
  'search.clearFilters': 'Hapus Filter',
  'search.applyFilters': 'Terapkan',

  // Metadata
  'metadata.episodes': 'Episode',
  'metadata.sources': 'Sumber',
  'metadata.similar': 'Mirip',
  'metadata.season': 'Musim {number}',
  'metadata.addToLibrary': 'Tambah ke Koleksi',
  'metadata.removeFromLibrary': 'Hapus dari Koleksi',
  'metadata.play': 'Tonton',
  'metadata.resume': 'Lanjutkan dari {time}',
  'metadata.startOver': 'Mulai dari awal',

  // Player
  'player.unsupported': 'Sumber video tidak tersedia',
  'player.subtitle': 'Subtitle',
  'player.uploadSrt': 'Unggah file SRT...',
  'player.communitySubs': 'Subtitle komunitas',
  'player.subtitleLanguagePrompt': 'Kode bahasa subtitle? (mis. id, en, ja)',
  'player.uploaded': 'Terunggah! Menunggu persetujuan admin.',
  'player.uploadFailed': 'Unggahan gagal',
  'player.uploading': 'Mengunggah...',
  'player.nextEpisode': 'Episode Berikutnya',
  'player.playingNextIn': 'Memutar berikutnya dalam {seconds}d',
  'player.skipIntro': 'Lewati Intro',
  'player.cancel': 'Batal',

  // Library / History
  'library.title': 'Koleksi Saya',
  'library.empty': 'Belum ada apapun di koleksi',
  'library.emptyDesc': 'Tambahkan film dan serial untuk muncul di sini',
  'history.title': 'Riwayat Tontonan',
  'history.itemsCount': '{count} item',
  'history.empty': 'Belum ada riwayat tontonan',
  'history.emptyDesc': 'Mulai menonton untuk melihat riwayatmu di sini',
  'history.clearTitle': 'Hapus riwayat tontonan?',
  'history.clearMessage': 'Tindakan ini menghapus semua entri secara permanen. Lanjutkan?',
  'history.cleared': 'Riwayat tontonan dihapus',
  'history.removeFromContinue': 'Hapus dari Lanjutkan Menonton?',

  // Settings
  'settings.title': 'Pengaturan',
  'settings.subtitle': 'Kelola preferensi dan info aplikasi.',
  'settings.account': 'Akun',
  'settings.accountDesc': 'Kelola data pribadimu',
  'settings.fullName': 'Nama Lengkap',
  'settings.email': 'Email',
  'settings.subscriptionExpires': 'Langganan berakhir',
  'settings.saveChanges': 'Simpan Perubahan',
  'settings.profileUpdated': 'Profil berhasil diperbarui',
  'settings.profileUpdateFailed': 'Gagal memperbarui profil',
  'settings.appearance': 'Tampilan',
  'settings.appearanceDesc': 'Sesuaikan tampilan',
  'settings.language': 'Bahasa',
  'settings.languageDesc': 'Pilih bahasa antarmuka',
  'settings.about': 'Tentang N-Movie',
  'settings.aboutDesc': 'Info versi',
  'settings.version': 'Versi',
  'settings.build': 'Build',

  // Auth
  'auth.pendingApproval': 'Akunmu masih menunggu persetujuan. Pemutaran terbuka setelah disetujui admin.',
  'auth.loginRequired': 'Silakan masuk untuk menambahkan ke koleksi',

  // Copyright
  'copyright.indonesianTitle': 'Konten Indonesia tidak tersedia',
  'copyright.indonesianDesc': 'Karena alasan hak cipta, film dan serial Indonesia tidak bisa diputar di sini. Kamu masih bisa melihat detailnya, tapi tombol putar dinonaktifkan.',

  // Toast / errors
  'error.generic': 'Terjadi kesalahan',
  'error.failedToSave': 'Gagal menyimpan',
  'error.failedToLoad': 'Gagal memuat',

  // Donation
  'donate.title': 'Dukung N-Movie',
  'donate.subtitle': 'N-Movie gratis dan tidak mengikat. Kalau kamu suka, donasi sukarela bantu biaya server, domain, dan TMDB API.',
  'donate.why': 'Kenapa donasi?',
  'donate.whyDesc': 'N-Movie 100% berjalan dari kantong saya pribadi: VPS, domain, bandwidth, dan integrasi pihak ketiga. Donasi sukarela bantu menjaga layanan tetap hidup tanpa iklan dan tanpa langganan paksa.',
  'donate.platforms': 'Platform donasi',
  'donate.donateOn': 'Donasi via {platform}',
  'donate.thanks': 'Terima kasih sudah mendukung. Kalau mau dapat badge supporter di profil, hubungi admin lewat email setelah donasi.',
  'donate.support': 'Dukung kami',
  'donate.supporterBadge': 'Supporter',
  'donate.supporterSince': 'Supporter sejak {date}',
  'donate.contactAdmin': 'Hubungi admin',

  // Library categories
  'library.watchlist': 'Daftar tonton',
  'library.favorites': 'Favorit',
  'library.watched': 'Sudah ditonton',
  'library.allItems': 'Semua',
};

const en: Dict = {
  // Common
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.remove': 'Remove',
  'common.loading': 'Loading...',
  'common.error': 'Something went wrong',
  'common.retry': 'Try again',
  'common.close': 'Close',
  'common.search': 'Search',
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.viewAll': 'View all',
  'common.explore': 'Explore',
  'common.yes': 'Yes',
  'common.no': 'No',

  // Navigation
  'nav.home': 'Home',
  'nav.search': 'Search',
  'nav.genres': 'Genres',
  'nav.library': 'Library',
  'nav.history': 'History',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  'nav.admin': 'Admin',
  'nav.login': 'Login',
  'nav.logout': 'Logout',
  'nav.register': 'Register',
  'nav.donate': 'Support',

  // Home
  'home.trendingMovies': 'Trending Movies',
  'home.popularTv': 'Popular TV Shows',
  'home.indonesianMovies': 'Trending in Indonesia',
  'home.indonesianSeries': 'Indonesian Series',
  'home.actionHits': 'Action Hits',
  'home.recommended': 'Recommended for you',
  'home.continueWatching': 'Continue Watching',
  'home.watchNow': 'Watch Now',
  'home.details': 'Details',
  'home.percentMatch': '{value}% Match',

  // Search
  'search.title': 'Search',
  'search.placeholder': 'Search movies, shows, and more...',
  'search.noResults': 'No results',
  'search.startTyping': 'Start typing to search',
  'search.filters': 'Filters',
  'search.year': 'Year',
  'search.genre': 'Genre',
  'search.language': 'Language',
  'search.type': 'Type',
  'search.sort': 'Sort by',
  'search.allTypes': 'All',
  'search.movies': 'Movies',
  'search.series': 'Series',
  'search.allGenres': 'All Genres',
  'search.allYears': 'All Years',
  'search.allLanguages': 'All Languages',
  'search.sortPopularity': 'Popularity',
  'search.sortRating': 'Rating',
  'search.sortNewest': 'Newest',
  'search.clearFilters': 'Clear filters',
  'search.applyFilters': 'Apply',

  // Metadata
  'metadata.episodes': 'Episodes',
  'metadata.sources': 'Sources',
  'metadata.similar': 'Similar',
  'metadata.season': 'Season {number}',
  'metadata.addToLibrary': 'Add to Library',
  'metadata.removeFromLibrary': 'Remove from Library',
  'metadata.play': 'Play',
  'metadata.resume': 'Resume from {time}',
  'metadata.startOver': 'Start over',

  // Player
  'player.unsupported': 'Video source unavailable',
  'player.subtitle': 'Subtitle',
  'player.uploadSrt': 'Upload SRT file...',
  'player.communitySubs': 'Community subtitles',
  'player.subtitleLanguagePrompt': 'Subtitle language code? (e.g. id, en, ja)',
  'player.uploaded': 'Uploaded! Pending admin approval.',
  'player.uploadFailed': 'Upload failed',
  'player.uploading': 'Uploading...',
  'player.nextEpisode': 'Next Episode',
  'player.playingNextIn': 'Playing next in {seconds}s',
  'player.skipIntro': 'Skip Intro',
  'player.cancel': 'Cancel',

  // Library / History
  'library.title': 'My Library',
  'library.empty': 'Nothing in your library yet',
  'library.emptyDesc': 'Add movies and shows to see them here',
  'history.title': 'Watch History',
  'history.itemsCount': '{count} items',
  'history.empty': 'No watch history yet',
  'history.emptyDesc': 'Start watching to see your history here',
  'history.clearTitle': 'Clear watch history?',
  'history.clearMessage': 'This permanently removes every entry. Continue?',
  'history.cleared': 'Watch history cleared',
  'history.removeFromContinue': 'Remove from Continue Watching?',

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle': 'Manage your preferences and app info.',
  'settings.account': 'Account',
  'settings.accountDesc': 'Manage your personal details',
  'settings.fullName': 'Full Name',
  'settings.email': 'Email',
  'settings.subscriptionExpires': 'Subscription Expires',
  'settings.saveChanges': 'Save Changes',
  'settings.profileUpdated': 'Profile updated successfully',
  'settings.profileUpdateFailed': 'Failed to update profile',
  'settings.appearance': 'Appearance',
  'settings.appearanceDesc': 'Customize look and feel',
  'settings.language': 'Language',
  'settings.languageDesc': 'Choose interface language',
  'settings.about': 'About N-Movie',
  'settings.aboutDesc': 'Version info',
  'settings.version': 'Version',
  'settings.build': 'Build',

  // Auth
  'auth.pendingApproval': 'Your account is pending approval. Playback unlocks once an admin approves it.',
  'auth.loginRequired': 'Please login to add to library',

  // Copyright
  'copyright.indonesianTitle': 'Indonesian content unavailable',
  'copyright.indonesianDesc': 'Due to copyright restrictions, Indonesian movies and series cannot be played here. You can still browse details, but the play button is disabled.',

  // Toast / errors
  'error.generic': 'Something went wrong',
  'error.failedToSave': 'Failed to save',
  'error.failedToLoad': 'Failed to load',

  // Donation
  'donate.title': 'Support N-Movie',
  'donate.subtitle': 'N-Movie is free with no strings attached. If you enjoy it, a small donation helps cover servers, domain, and TMDB API.',
  'donate.why': 'Why donate?',
  'donate.whyDesc': "N-Movie runs entirely out of pocket: VPS, domain, bandwidth, and third-party integrations. Voluntary donations keep the service alive — no ads, no forced subscriptions.",
  'donate.platforms': 'Donation platforms',
  'donate.donateOn': 'Donate on {platform}',
  'donate.thanks': "Thanks for supporting. To get the Supporter badge on your profile, contact the admin by email after donating.",
  'donate.support': 'Support us',
  'donate.supporterBadge': 'Supporter',
  'donate.supporterSince': 'Supporter since {date}',
  'donate.contactAdmin': 'Contact admin',

  // Library categories
  'library.watchlist': 'Watchlist',
  'library.favorites': 'Favorites',
  'library.watched': 'Watched',
  'library.allItems': 'All',
};

export const translations: Record<Locale, Dict> = { id, en };

export const supportedLocales: { code: Locale; name: string; flag: string }[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export const DEFAULT_LOCALE: Locale = 'id';
