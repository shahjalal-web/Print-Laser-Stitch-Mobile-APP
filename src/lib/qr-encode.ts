/** Mirrors the website's src/lib/qr-encode.ts (presentation + payload-encoding
 * logic only — pure, no server dependency, safe to duplicate). The actual
 * saved payload is still recomputed server-side from `fields` on save, this
 * copy only drives the mobile form UI and the "while you type" preview. */

export type QrCodeType = 'phone' | 'email' | 'sms' | 'text' | 'url' | 'geo' | 'wifi' | 'contact' | 'calendar';

export type QrFieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'tel' | 'email' | 'url' | 'number' | 'select' | 'datetime-local';
  options?: string[];
  required?: boolean;
};

export const QR_TYPES: QrCodeType[] = ['phone', 'email', 'sms', 'text', 'url', 'geo', 'wifi', 'contact', 'calendar'];

export const QR_TYPE_LABELS: Record<QrCodeType, string> = {
  phone: 'Phone',
  email: 'Email',
  sms: 'SMS',
  text: 'Text',
  url: 'URL',
  geo: 'Geo',
  wifi: 'Wifi',
  contact: 'Contact',
  calendar: 'Calendar',
};

export const QR_TYPE_ICONS: Record<QrCodeType, string> = {
  phone: '📞',
  email: '✉️',
  sms: '💬',
  text: '📝',
  url: '🔗',
  geo: '📍',
  wifi: '📶',
  contact: '👤',
  calendar: '📅',
};

export const QR_TYPE_FIELDS: Record<QrCodeType, QrFieldDef[]> = {
  phone: [{ key: 'phone', label: 'Phone number', type: 'tel', required: true }],
  email: [
    { key: 'to', label: 'To', type: 'email', required: true },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Message', type: 'textarea' },
  ],
  sms: [
    { key: 'phone', label: 'Phone number', type: 'tel', required: true },
    { key: 'message', label: 'Message', type: 'textarea' },
  ],
  text: [{ key: 'text', label: 'Text', type: 'textarea', required: true }],
  url: [{ key: 'url', label: 'Link', type: 'url', placeholder: 'https://', required: true }],
  geo: [
    { key: 'latitude', label: 'Latitude', type: 'number', required: true },
    { key: 'longitude', label: 'Longitude', type: 'number', required: true },
  ],
  wifi: [
    { key: 'ssid', label: 'Network name (SSID)', required: true },
    { key: 'password', label: 'Password' },
    { key: 'encryption', label: 'Encryption', type: 'select', options: ['WPA', 'WEP', 'nopass'] },
  ],
  contact: [
    { key: 'name', label: 'Full name', required: true },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'organization', label: 'Company' },
  ],
  calendar: [
    { key: 'title', label: 'Event title', required: true },
    { key: 'start', label: 'Start', type: 'datetime-local' },
    { key: 'end', label: 'End', type: 'datetime-local' },
    { key: 'location', label: 'Location' },
  ],
};

function esc(v: string): string {
  return v.replace(/([\\;,])/g, '\\$1');
}

function toIcsDate(v: string): string {
  if (!v) return '';
  return `${v.replace(/[-:]/g, '')}00`;
}

export function encodeQrPayload(type: QrCodeType, fields: Record<string, string>): string {
  switch (type) {
    case 'phone':
      return `tel:${fields.phone ?? ''}`;
    case 'email': {
      const params: string[] = [];
      if (fields.subject) params.push(`subject=${encodeURIComponent(fields.subject)}`);
      if (fields.body) params.push(`body=${encodeURIComponent(fields.body)}`);
      const qs = params.join('&');
      return `mailto:${fields.to ?? ''}${qs ? `?${qs}` : ''}`;
    }
    case 'sms': {
      const qs = fields.message ? `?body=${encodeURIComponent(fields.message)}` : '';
      return `sms:${fields.phone ?? ''}${qs}`;
    }
    case 'text':
      return fields.text ?? '';
    case 'url':
      return fields.url ?? '';
    case 'geo':
      return `geo:${fields.latitude ?? '0'},${fields.longitude ?? '0'}`;
    case 'wifi': {
      const enc = fields.encryption && fields.encryption !== 'nopass' ? fields.encryption : 'nopass';
      const passPart = enc === 'nopass' ? '' : `P:${esc(fields.password ?? '')};`;
      return `WIFI:T:${enc};S:${esc(fields.ssid ?? '')};${passPart};`;
    }
    case 'contact': {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${esc(fields.name ?? '')}`,
        fields.organization ? `ORG:${esc(fields.organization)}` : '',
        fields.phone ? `TEL:${esc(fields.phone)}` : '',
        fields.email ? `EMAIL:${esc(fields.email)}` : '',
        'END:VCARD',
      ].filter(Boolean);
      return lines.join('\n');
    }
    case 'calendar': {
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${esc(fields.title ?? '')}`,
        fields.start ? `DTSTART:${toIcsDate(fields.start)}` : '',
        fields.end ? `DTEND:${toIcsDate(fields.end)}` : '',
        fields.location ? `LOCATION:${esc(fields.location)}` : '',
        'END:VEVENT',
        'END:VCALENDAR',
      ].filter(Boolean);
      return lines.join('\n');
    }
    default:
      return '';
  }
}
