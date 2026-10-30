import { Context, SessionFlavor } from 'grammy';

export interface SessionData {
  step: 'AWAITING_STUDENT_CONTACT' | 'AWAITING_PARENT_CONTACT' | null;
  studentPhone?: string;
  studentName?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export interface InternalUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  phone?: string;
  status?: string;
}
