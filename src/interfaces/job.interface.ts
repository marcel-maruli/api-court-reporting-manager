
export interface JobRow {
  id: number;
  case_name: string;
  duration_minutes: number;
  location_type: 'PHYSICAL' | 'REMOTE';
  city: string;
  recording_text: string | null;
  status: 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';
  reporter_id: number | null;
  editor_id: number | null;
  reporter_payout: number;
  editor_payout: number;
  total_payout: number;
  created_at: Date;
}
export interface DashboardJob extends JobRow {
  reporter_name: string | null;
  editor_name: string | null;
  reporter_payout: number;
  editor_payout: number;
  total_payout: number;
}