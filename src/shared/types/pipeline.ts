/**
 * Shared domain types used by both the pipeline and candidates features.
 * Neither feature owns these — they live here to prevent cross-feature imports.
 */

export type CandidateStageStatus =
  | 'pending_review'
  | 'in_process'
  | 'rescheduled'
  | 'confirmed'
  | 'test_sent'
  | 'under_review'
  | 'interview_scheduled'
  | 'awaiting_client'
  | 'offer_sent'
  | 'negotiating';

export type MatchStatus = 'analyzing' | 'done';
