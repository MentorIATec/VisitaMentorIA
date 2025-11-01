import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendFollowupEmail } from '@/lib/email';
import nodemailer from 'nodemailer';

// Mock nodemailer
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-message-id' });
  const mockCreateTransporter = vi.fn().mockReturnValue({
    sendMail: mockSendMail
  });
  return {
    default: {
      createTransport: mockCreateTransporter
    }
  };
});

// Mock fs para leer plantillas
vi.mock('node:fs', () => {
  return {
    default: {
      readFileSync: vi.fn((path: string) => {
        if (path.includes('followup_A.html')) {
          return '<html><body>Template A: {{baseUrl}}/after/{{token}} with color {{communityColor}}</body></html>';
        }
        if (path.includes('followup_B.html')) {
          return '<html><body>Template B: {{baseUrl}}/after/{{token}} with color {{communityColor}}</body></html>';
        }
        throw new Error('Template not found');
      })
    }
  };
});

describe('sendFollowupEmail', () => {
  const originalEnv = process.env;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    console.log = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  it('en modo dev sin SMTP configurado, solo loguea', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SMTP_HOST;
    delete process.env.SENDGRID_API_KEY;

    await sendFollowupEmail('test@example.com', 'test-token', 'A', '#FF0000');

    expect(console.log).toHaveBeenCalledWith('[EMAIL DEV MODE]');
    expect(console.log).toHaveBeenCalledWith('To:', 'test@example.com');
    expect(console.log).toHaveBeenCalledWith('Subject:', expect.stringContaining('Seguimiento'));
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('con SMTP configurado, envía correo', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'password';
    process.env.MAIL_FROM = 'noreply@example.com';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue({
      sendMail: mockSendMail
    });

    await sendFollowupEmail('test@example.com', 'test-token-123', 'B', '#00FF00');

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'test@example.com',
      subject: expect.stringContaining('Cómo te sientes'),
      html: expect.stringContaining('https://example.com/after/test-token-123')
    });
  });

  it('con SendGrid API key, usa SendGrid', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SENDGRID_API_KEY = 'SG.test-key';
    process.env.MAIL_FROM = 'noreply@example.com';

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue({
      sendMail: mockSendMail
    });

    await sendFollowupEmail('test@example.com', 'token-xyz', 'A', '#0000FF');

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: 'SG.test-key'
      }
    });
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('reemplaza placeholders en plantilla', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://test.com';

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue({
      sendMail: mockSendMail
    });

    await sendFollowupEmail('user@test.com', 'my-token', 'A', '#FF00FF');

    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.html).toContain('https://test.com/after/my-token');
    expect(callArgs.html).toContain('#FF00FF');
  });

  it('usa subject diferente según variante', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.test.com';

    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue({
      sendMail: mockSendMail
    });

    await sendFollowupEmail('test@example.com', 'token', 'A');
    expect(mockSendMail.mock.calls[0][0].subject).toContain('Seguimiento de tu sesión');

    await sendFollowupEmail('test@example.com', 'token', 'B');
    expect(mockSendMail.mock.calls[1][0].subject).toContain('Cómo te sientes');
  });
});

