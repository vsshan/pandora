export interface NetworkOverview {
  total_contacts: number;
  total_interactions: number;
  active_last_30d: number;
  interactions_last_30d: number;
  graph_density: number;
}

export type ContactStatus = 'hot' | 'warm' | 'cold' | 'dormant';
export type ContactTrend  = 'growing' | 'stable' | 'declining' | 'dormant';

export interface ContactAnalytics {
  id: string;
  name: string;
  title: string;
  company: string;
  company_id: string;
  avatar_initials: string;
  avatar_color: string;
  interaction_count: number;
  recent_count: number;
  prior_count: number;
  pagerank_score: number;
  trend: ContactTrend;
  status: ContactStatus;
  health_score: number;
  last_seen: string;
  days_since_last: number;
}

export type InteractionType = 'meeting' | 'call' | 'email' | 'conference' | 'dinner';

export interface InteractionEvent {
  interaction_id: string;
  timestamp: string;
  from_id: string;
  from_name: string;
  to_id: string;
  to_name: string;
  interaction_type: InteractionType;
  banker: string;
  company_id: string;
  notes: string;
}

export interface MonthlyTrend {
  month: string;
  interaction_count: number;
  active_contacts: number;
}
