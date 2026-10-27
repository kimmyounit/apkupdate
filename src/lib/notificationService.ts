import { api } from './api.ts';
import { playNotificationChime } from './audio.ts';
import type { Announcement, AppNotification, StudentPost } from '../types/index.ts';

const NOTIF_DISMISSED_KEY = 'tamvesta_notif_prompt_dismissed_until';
const SEEN_ANNOUNCEMENT_IDS_KEY = 'tamvesta_seen_announcement_ids_v1';
const SEEN_SUPPORT_POST_IDS_KEY = 'tamvesta_seen_support_post_ids_v1';
const SEEN_NOTIF_IDS_KEY = 'tamvesta_seen_notif_ids_v1';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

/**
 * Cek apakah browser / webview mendukung Web Notification API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Ambil status izin notifikasi saat ini
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch (_) {
    return 'unsupported';
  }
}

/**
 * Cek apakah dialog ajakan izin notifikasi sedang ditunda oleh pengguna (misal 24 jam)
 */
export function isNotificationPromptDismissed(): boolean {
  try {
    const until = localStorage.getItem(NOTIF_DISMISSED_KEY);
    if (!until) return false;
    const expiry = parseInt(until, 10);
    if (isNaN(expiry)) return false;
    return Date.now() < expiry;
  } catch (_) {
    return false;
  }
}

/**
 * Simpan penundaan dialog izin notifikasi (misal klik "Nanti")
 */
export function dismissNotificationPrompt(hours = 24): void {
  try {
    const expiry = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(NOTIF_DISMISSED_KEY, expiry.toString());
  } catch (_) {}
}

/**
 * Minta izin notifikasi perangkat ke browser / sistem OS
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        localStorage.removeItem(NOTIF_DISMISSED_KEY);
      } catch (_) {}

      // Bunyikan denting dan kirim notifikasi sambutan
      playNotificationChime();
      sendNativeNotification('🔔 Notifikasi TAMVESTA Berhasil Aktif!', {
        body: 'Anda sekarang akan menerima pengumuman sekolah dan info resmi langsung di perangkat ini.',
        icon: '/assets/tamvesta_mascot.jpg',
        tag: 'tamvesta-welcome',
      });
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'unsupported';
  }
}

/**
 * Kirim notifikasi native sistem OS / perangkat HP
 */
export function sendNativeNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported()) return false;
  if (getNotificationPermission() !== 'granted') return false;

  try {
    const finalOptions: NotificationOptions = {
      icon: '/assets/tamvesta_mascot.jpg',
      badge: '/assets/tamvesta_mascot.jpg',
      ...options,
    };

    const notif = new Notification(title, finalOptions);

    notif.onclick = () => {
      try {
        window.focus();
      } catch (_) {}
      notif.close();

      // Jika ada navigasi khusus berdasarkan tag
      if (options?.tag?.startsWith('tamvesta-ann-')) {
        window.dispatchEvent(new CustomEvent('tamvesta_navigate', { detail: 'pengumuman' }));
      } else if (options?.tag?.startsWith('tamvesta-post-')) {
        window.dispatchEvent(new CustomEvent('tamvesta_navigate', { detail: 'home' }));
      }
    };

    return true;
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

/**
 * Helper untuk membaca set ID yang sudah pernah ditampilkan notifikasinya
 */
function getSeenIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch (_) {
    return new Set<string>();
  }
}

function saveSeenIdSet(key: string, set: Set<string>): void {
  try {
    // Batasi maksimum 150 item agar localStorage tetap bersih
    const arr = Array.from(set).slice(-150);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (_) {}
}

/**
 * Service sinkronisasi berkala untuk mendeteksi:
 * 1. Pengumuman baru dari Sekolah / Guru / Kepala Sekolah
 * 2. Pesan resmi baru dari Support TAMVESTA
 * 3. Notifikasi sistem penting
 */
export function startNotificationSync(options?: {
  onNewAnnouncement?: (ann: Announcement) => void;
  onNewSupportPost?: (post: StudentPost) => void;
}): () => void {
  let isChecking = false;
  let isFirstRun = true;

  const checkUpdates = async () => {
    if (isChecking) return;
    isChecking = true;

    try {
      const seenAnnouncements = getSeenIdSet(SEEN_ANNOUNCEMENT_IDS_KEY);
      const seenSupportPosts = getSeenIdSet(SEEN_SUPPORT_POST_IDS_KEY);
      const seenNotifs = getSeenIdSet(SEEN_NOTIF_IDS_KEY);

      // 1. Cek Pengumuman Sekolah
      try {
        const announcements = await api.getAnnouncements();
        if (Array.isArray(announcements)) {
          if (isFirstRun) {
            // Pada pembukaan pertama, simpan semua yang sudah ada agar tidak spam notif lama
            announcements.forEach((a) => seenAnnouncements.add(a.id));
            saveSeenIdSet(SEEN_ANNOUNCEMENT_IDS_KEY, seenAnnouncements);
          } else {
            for (const ann of announcements) {
              if (ann.isPublished !== false && !seenAnnouncements.has(ann.id)) {
                seenAnnouncements.add(ann.id);
                saveSeenIdSet(SEEN_ANNOUNCEMENT_IDS_KEY, seenAnnouncements);

                // Kirim notifikasi perangkat
                playNotificationChime();
                sendNativeNotification(`📢 Pengumuman: ${ann.title}`, {
                  body: ann.content.length > 100 ? `${ann.content.slice(0, 100)}...` : ann.content,
                  icon: '/assets/tamvesta_mascot.jpg',
                  tag: `tamvesta-ann-${ann.id}`,
                });

                if (options?.onNewAnnouncement) options.onNewAnnouncement(ann);
                break; // Maksimal 1 notifikasi per putaran agar tidak bertumpuk
              }
            }
          }
        }
      } catch (_) {}

      // 2. Cek Postingan Resmi Support TAMVESTA
      try {
        const posts = await api.getPosts();
        if (Array.isArray(posts)) {
          const supportPosts = posts.filter(
            (p) =>
              p.authorIsDeveloper ||
              (p as any).authorBadgeType === 'developer' ||
              p.authorUsername?.toLowerCase() === 'tamvesta' ||
              p.authorId === 'user_support_tamvesta'
          );

          if (isFirstRun) {
            supportPosts.forEach((p) => seenSupportPosts.add(p.id));
            saveSeenIdSet(SEEN_SUPPORT_POST_IDS_KEY, seenSupportPosts);
          } else {
            for (const post of supportPosts) {
              if (!seenSupportPosts.has(post.id)) {
                seenSupportPosts.add(post.id);
                saveSeenIdSet(SEEN_SUPPORT_POST_IDS_KEY, seenSupportPosts);

                // Kirim notifikasi perangkat pesan support
                playNotificationChime();
                sendNativeNotification('🔔 Pesan Resmi Support TAMVESTA', {
                  body: post.caption.length > 100 ? `${post.caption.slice(0, 100)}...` : post.caption,
                  icon: '/assets/tamvesta_mascot.jpg',
                  tag: `tamvesta-post-${post.id}`,
                });

                if (options?.onNewSupportPost) options.onNewSupportPost(post);
                break;
              }
            }
          }
        }
      } catch (_) {}

      // 3. Cek Notifikasi Sistem Belum Terbaca
      try {
        const notifs = await api.getNotifications();
        if (Array.isArray(notifs)) {
          if (isFirstRun) {
            notifs.forEach((n: AppNotification) => seenNotifs.add(n.id));
            saveSeenIdSet(SEEN_NOTIF_IDS_KEY, seenNotifs);
          } else {
            const unreadNotifs = notifs.filter((n: any) => !n.isRead && !seenNotifs.has(n.id));
            if (unreadNotifs.length > 0) {
              const latest = unreadNotifs[0];
              seenNotifs.add(latest.id);
              saveSeenIdSet(SEEN_NOTIF_IDS_KEY, seenNotifs);

              playNotificationChime();
              sendNativeNotification(`🔔 ${latest.title}`, {
                body: latest.message.length > 100 ? `${latest.message.slice(0, 100)}...` : latest.message,
                icon: '/assets/tamvesta_mascot.jpg',
                tag: `tamvesta-notif-${latest.id}`,
              });
            }
          }
        }
      } catch (_) {}

      isFirstRun = false;
    } finally {
      isChecking = false;
    }
  };

  // Jalankan segera setelah 1 detik, lalu berkala setiap 10 detik
  const initialTimeout = setTimeout(checkUpdates, 1200);
  const interval = setInterval(checkUpdates, 10000);

  return () => {
    clearTimeout(initialTimeout);
    clearInterval(interval);
  };
}
