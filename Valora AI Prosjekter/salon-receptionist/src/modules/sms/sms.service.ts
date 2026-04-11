/**
 * SMS service — sends messages via 46elks.
 *
 * 46elks API docs: https://46elks.com/docs/send-sms
 * Auth: HTTP Basic (username:password from .env)
 *
 * Templates (Norwegian):
 *   Confirmation: "Hei {name}! Din time hos {salon} er bekreftet:
 *                  {service} {date} kl. {time}. Svar NEI for å avbestille."
 *   Cancellation: "Hei {name}! Din time hos {salon} {date} kl. {time}
 *                  er avbestilt. Ring oss for å booke ny time."
 *
 * Important: Keep messages under 160 chars (single SMS) where possible.
 * Norwegian characters (æ, ø, å) count as 2 bytes in GSM-7 encoding,
 * reducing single-SMS limit to 70 chars. Use ASCII approximations or
 * accept multi-part SMS for longer messages.
 */

import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { Booking } from '../bookings/booking.types';
import type { SendSmsInput, SmsResult } from './sms.types';

const elksClient = axios.create({
  baseURL: 'https://api.46elks.com/a1',
  auth: {
    username: env.FORTYSIX_ELKS_API_USERNAME,
    password: env.FORTYSIX_ELKS_API_PASSWORD,
  },
});

export const smsService = {
  async send(input: SendSmsInput): Promise<SmsResult> {
    // TODO:
    // const { data } = await elksClient.post('/SMS', new URLSearchParams({
    //   from: env.FORTYSIX_ELKS_FROM_NUMBER,
    //   to: input.to,
    //   message: input.message,
    // }));
    // return { success: true, messageId: data.id };
    logger.debug({ msg: 'SMS send (not implemented)', to: input.to });
    void elksClient;
    return { success: false, error: 'Not implemented' };
  },

  async sendConfirmation(booking: Booking, salonName: string): Promise<SmsResult> {
    // TODO: format date/time in Europe/Oslo timezone (use Intl.DateTimeFormat)
    const message = `Hei ${booking.customerName}! Din time hos ${salonName} er bekreftet: ${booking.service}. Vi gleder oss til å se deg!`;
    return this.send({ to: booking.customerPhone, message });
  },

  async sendCancellation(booking: Booking, salonName: string): Promise<SmsResult> {
    const message = `Hei ${booking.customerName}! Din time hos ${salonName} er avbestilt. Ring oss for a booke ny time.`;
    return this.send({ to: booking.customerPhone, message });
  },
};
