/**
 * Auto-generated Supabase database types.
 *
 * In production, generate this file with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * The placeholder below mirrors the schema in supabase/migrations/001_initial_schema.sql.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          created_at: string;
          salon_name: string;
          phone_number: string;
          google_calendar_id: string;
          vapi_assistant_id: string;
          timezone: string;
          locale: string;
          active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          customer_name: string;
          customer_phone: string;
          service: string;
          staff_member: string | null;
          starts_at: string;
          ends_at: string;
          google_event_id: string | null;
          status: 'pending' | 'confirmed' | 'cancelled';
          sms_sent: boolean;
          call_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      call_logs: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          vapi_call_id: string;
          caller_number: string;
          duration_seconds: number | null;
          outcome: 'booked' | 'cancelled' | 'info_only' | 'no_action' | 'error';
          transcript: string | null;
          booking_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['call_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['call_logs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
