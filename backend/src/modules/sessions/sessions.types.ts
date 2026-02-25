import { Response } from 'express';
import { sessions, sessionParticipants, sessionMessages, annotations } from '../../db/schema.js';

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Participant = typeof sessionParticipants.$inferSelect;
export type NewParticipant = typeof sessionParticipants.$inferInsert;

export type SessionMessage = typeof sessionMessages.$inferSelect;
export type NewSessionMessage = typeof sessionMessages.$inferInsert;

export type Annotation = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;

export type SessionStatus = 'waiting' | 'active' | 'ended';
export type ParticipantRole = 'host' | 'member';

export interface RoomParticipant {
  userId: number;
  name: string;
  color: string;
  currentPage: number;
  cursorX: number;
  cursorY: number;
  lastActivity: number;
  sseRes: Set<Response>;
}

export interface RoomState {
  participants: Map<number, RoomParticipant>;
  typing: Set<number>;
  handRaised: Set<number>;
  screenSharing: Set<number>;
}

export interface SessionListResult extends Session {
  documentTitle: string;
  role: ParticipantRole;
  participantCount: number;
}
