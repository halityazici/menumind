/**
 * Internationalisation helper for MenuMind chat.
 * Supports Turkish (tr) and English (en).
 * Product names are NEVER translated — only UI chrome + descriptions.
 */

export const LANGUAGES = {
    tr: { code: 'tr', label: 'TR', flag: '🇹🇷', name: 'Türkçe' },
    en: { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
}

export const DEFAULT_LANG = 'tr'

/* ── UI string translations ──────────────────────────────────────── */
const strings = {
    // Header
    'header.subtitle': {
        tr: 'Garson · AI Menü Asistanı',
        en: 'Waiter · AI Menu Assistant',
    },
    'header.reset': {
        tr: 'Sohbeti sıfırla',
        en: 'Reset chat',
    },

    // Loading
    'loading.text': {
        tr: 'Yükleniyor...',
        en: 'Loading...',
    },

    // Error
    'error.menuLoad': {
        tr: 'Menü yüklenemedi. Lütfen sayfayı yenileyin.',
        en: 'Failed to load the menu. Please refresh the page.',
    },
    'error.general': {
        tr: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        en: 'Something went wrong. Please try again.',
    },
    'error.rateLimit': {
        tr: 'Şu an çok fazla istek var. Lütfen bir dakika bekleyip tekrar deneyin. 🙏',
        en: 'Too many requests right now. Please wait a minute and try again. 🙏',
    },
    'error.upstreamRate': {
        tr: 'Yapay zeka servisi şu an yoğun. Kısa süre bekleyip tekrar deneyin.',
        en: 'The AI service is busy right now. Please wait a moment and try again.',
    },
    'error.timeout': {
        tr: 'Yanıt gecikti. İnternet bağlantınızı kontrol edip tekrar deneyin.',
        en: 'Response timed out. Check your connection and try again.',
    },
    'error.upstream': {
        tr: 'Servis geçici olarak kullanılamıyor. Biraz bekleyip tekrar deneyin.',
        en: 'Service temporarily unavailable. Please try again shortly.',
    },
    'error.requestTimeout': {
        tr: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
        en: 'Request timed out. Please try again.',
    },

    // Input bar
    'input.placeholder.loading': {
        tr: 'Yükleniyor...',
        en: 'Loading...',
    },
    'input.placeholder.typing': {
        tr: 'Garson yazıyor...',
        en: 'Waiter is typing...',
    },
    'input.placeholder.default': {
        tr: 'Bir şey sorun...',
        en: 'Ask something...',
    },
    'input.hint': {
        tr: 'Enter ile gönder · Shift+Enter yeni satır',
        en: 'Enter to send · Shift+Enter for new line',
    },

    // CTA button
    'cta.confirmOrder': {
        tr: 'Siparişimi Onayla',
        en: 'Confirm My Order',
    },

    // Welcome message fallback
    'welcome.fallback': {
        tr: 'Merhaba! Ben sizin yapay zeka destekli menü asistanınızım 🤖✨ Size bugün ne önerebilirim?',
        en: 'Hello! I\'m your AI-powered menu assistant 🤖✨ What can I recommend for you today?',
    },

    // Order modal
    'order.title': {
        tr: 'Sipariş Özeti',
        en: 'Order Summary',
    },
    'order.itemCount': {
        tr: 'ürün',
        en: 'item(s)',
    },
    'order.tableNo': {
        tr: 'Masa Numarası',
        en: 'Table Number',
    },
    'order.tableNoPlaceholder': {
        tr: 'Masa numaranız nedir?',
        en: 'What is your table number?',
    },
    'order.tableError': {
        tr: 'Lütfen masa numaranızı girin.',
        en: 'Please enter your table number.',
    },
    'order.tableMissing': {
        tr: 'Masa numarasını lütfen girin.',
        en: 'Please enter the table number.',
    },
    'order.customerName': {
        tr: 'Size nasıl hitap edelim?',
        en: 'How should we address you?',
    },
    'order.customerNameOptional': {
        tr: '(isteğe bağlı)',
        en: '(optional)',
    },
    'order.customerNamePlaceholder': {
        tr: 'Adınız (örn: Ahmet)',
        en: 'Your name (e.g. John)',
    },
    'order.customerNameHint': {
        tr: 'Siparışinizi size özel teslim edebilmek için.',
        en: 'To deliver your order personally.',
    },
    'order.selectFromMenu': {
        tr: 'Menüden Seçin',
        en: 'Select from Menu',
    },
    'order.searchPlaceholder': {
        tr: 'Ürün ara...',
        en: 'Search products...',
    },
    'order.selected': {
        tr: 'Seçilenler',
        en: 'Selected Items',
    },
    'order.note': {
        tr: 'Sipariş Notu',
        en: 'Order Note',
    },
    'order.noteOptional': {
        tr: '(isteğe bağlı)',
        en: '(optional)',
    },
    'order.notePlaceholder': {
        tr: 'Özel istekler, alerjenler, pişirme tercihleri...',
        en: 'Special requests, allergens, cooking preferences...',
    },
    'order.totalAmount': {
        tr: 'Toplam Tutar',
        en: 'Total Amount',
    },
    'order.sending': {
        tr: 'Gönderiliyor...',
        en: 'Sending...',
    },
    'order.confirm': {
        tr: '✅ Siparişi Onayla',
        en: '✅ Confirm Order',
    },
    'order.requiredField': {
        tr: 'Zorunlu alan',
        en: 'Required field',
    },
    'order.addMin': {
        tr: 'Lütfen en az bir ürün ekleyin.',
        en: 'Please add at least one item.',
    },
    'order.failed': {
        tr: 'Sipariş gönderilemedi. Lütfen tekrar deneyin.',
        en: 'Failed to place order. Please try again.',
    },

    // Order success
    'order.successTitle': {
        tr: 'Siparişiniz Alındı!',
        en: 'Order Received!',
    },
    'order.successThanks': {
        tr: 'Teşekkürler',
        en: 'Thank you',
    },
    'order.successMessage': {
        tr: 'Mutfağa iletildi, kısa sürede hazırlanacak.',
        en: 'Sent to the kitchen, it will be ready shortly.',
    },
    'order.successClose': {
        tr: 'Harika, teşekkürler! 🎉',
        en: 'Great, thank you! 🎉',
    },

    // Product detail
    'product.allergenWarning': {
        tr: 'Alerjen Uyarısı',
        en: 'Allergen Warning',
    },
    'product.addToCart': {
        tr: 'Sepete Ekle',
        en: 'Add to Cart',
    },
    'product.updateCart': {
        tr: 'Sepeti Güncelle',
        en: 'Update Cart',
    },
    'product.new': {
        tr: '✨ YENİ',
        en: '✨ NEW',
    },
    'product.translating': {
        tr: 'Çevriliyor...',
        en: 'Translating...',
    },
}

/**
 * Get a translated string by key.
 * @param {string} key    - dot-separated key, e.g. 'header.subtitle'
 * @param {string} lang   - 'tr' | 'en'
 * @returns {string}
 */
export function t(key, lang = DEFAULT_LANG) {
    const entry = strings[key]
    if (!entry) return key
    return entry[lang] || entry[DEFAULT_LANG] || key
}
