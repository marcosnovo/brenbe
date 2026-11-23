// Punto de entrada del Worker: conecta el handler con el binding SEND_EMAIL de Email Routing.
import { EmailMessage } from 'cloudflare:email';
import { handleContact } from './handler.js';

export default {
  async fetch(request, env) {
    return handleContact(request, env, {
      sendEmail: (e, { from, to, raw }) => e.SEND_EMAIL.send(new EmailMessage(from, to, raw)),
    });
  },
};
