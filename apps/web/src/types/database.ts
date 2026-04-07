export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          deleted_at: string | null
          id: string
          message: string | null
          org_id: string
          property_id: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string | null
          org_id: string
          property_id?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string | null
          org_id?: string
          property_id?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_reports: {
        Row: {
          admin_notes: string | null
          attachments: Json | null
          category: string
          created_at: string
          id: string
          org_id: string
          property_id: string | null
          report_text: string
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          id?: string
          org_id: string
          property_id?: string | null
          report_text: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          id?: string
          org_id?: string
          property_id?: string | null
          report_text?: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          link_url: string | null
          org_id: string
          priority: string
          property_id: string | null
          recipients: Json
          source_module: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          link_url?: string | null
          org_id: string
          priority?: string
          property_id?: string | null
          recipients?: Json
          source_module?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          link_url?: string | null
          org_id?: string
          priority?: string
          property_id?: string | null
          recipients?: Json
          source_module?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      case_evidence: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          description: string | null
          external_identifier: string | null
          id: string
          item_number: string | null
          status: string
          storage_facility: string | null
          storage_location: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_identifier?: string | null
          id?: string
          item_number?: string | null
          status?: string
          storage_facility?: string | null
          storage_location?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_identifier?: string | null
          id?: string
          item_number?: string | null
          status?: string
          storage_facility?: string | null
          storage_location?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_evidence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_narratives: {
        Row: {
          author_id: string | null
          case_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          case_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          case_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_narratives_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_narratives_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_type: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          escalation_level: string | null
          id: string
          lead_investigator: string | null
          org_id: string
          property_id: string | null
          record_number: string
          status: Database["public"]["Enums"]["case_status"]
          synopsis: string | null
          updated_at: string
        }
        Insert: {
          case_type: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          escalation_level?: string | null
          id?: string
          lead_investigator?: string | null
          org_id: string
          property_id?: string | null
          record_number: string
          status?: Database["public"]["Enums"]["case_status"]
          synopsis?: string | null
          updated_at?: string
        }
        Update: {
          case_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          escalation_level?: string | null
          id?: string
          lead_investigator?: string | null
          org_id?: string
          property_id?: string | null
          record_number?: string
          status?: Database["public"]["Enums"]["case_status"]
          synopsis?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_lead_investigator_fkey"
            columns: ["lead_investigator"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          category: string
          contact_type: string
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          id: string
          id_number: string | null
          id_type: string | null
          last_name: string | null
          notes: string | null
          org_id: string
          organization_name: string | null
          phone: string | null
          secondary_phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category: string
          contact_type: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name?: string | null
          notes?: string | null
          org_id: string
          organization_name?: string | null
          phone?: string | null
          secondary_phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string
          contact_type?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name?: string | null
          notes?: string | null
          org_id?: string
          organization_name?: string | null
          phone?: string | null
          secondary_phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          location_id: string | null
          org_id: string
          priority: Database["public"]["Enums"]["dispatch_priority"]
          property_id: string | null
          record_number: string
          status: Database["public"]["Enums"]["daily_log_status"]
          synopsis: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          org_id: string
          priority?: Database["public"]["Enums"]["dispatch_priority"]
          property_id?: string | null
          record_number: string
          status?: Database["public"]["Enums"]["daily_log_status"]
          synopsis?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          location_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["dispatch_priority"]
          property_id?: string | null
          record_number?: string
          status?: Database["public"]["Enums"]["daily_log_status"]
          synopsis?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_timeline: {
        Row: {
          actor_id: string | null
          details: string | null
          dispatch_id: string
          event: string
          id: string
          timestamp: string
        }
        Insert: {
          actor_id?: string | null
          details?: string | null
          dispatch_id: string
          event: string
          id?: string
          timestamp?: string
        }
        Update: {
          actor_id?: string | null
          details?: string | null
          dispatch_id?: string
          event?: string
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_timeline_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_timeline_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatches: {
        Row: {
          anonymous: boolean
          assigned_staff_id: string | null
          call_source: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          dispatch_code: string
          id: string
          location_id: string | null
          org_id: string
          priority: Database["public"]["Enums"]["dispatch_priority"]
          property_id: string | null
          record_number: string
          reporter_name: string | null
          reporter_phone: string | null
          status: Database["public"]["Enums"]["dispatch_status"]
          sublocation: string | null
          updated_at: string
        }
        Insert: {
          anonymous?: boolean
          assigned_staff_id?: string | null
          call_source?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          dispatch_code: string
          id?: string
          location_id?: string | null
          org_id: string
          priority?: Database["public"]["Enums"]["dispatch_priority"]
          property_id?: string | null
          record_number: string
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: Database["public"]["Enums"]["dispatch_status"]
          sublocation?: string | null
          updated_at?: string
        }
        Update: {
          anonymous?: boolean
          assigned_staff_id?: string | null
          call_source?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          dispatch_code?: string
          id?: string
          location_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["dispatch_priority"]
          property_id?: string | null
          record_number?: string
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: Database["public"]["Enums"]["dispatch_status"]
          sublocation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatches_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      dropdown_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropdown_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dropdown_values: {
        Row: {
          active: boolean
          category_id: string
          created_at: string
          display_label: string
          id: string
          sort_order: number
          value: string
        }
        Insert: {
          active?: boolean
          category_id: string
          created_at?: string
          display_label: string
          id?: string
          sort_order?: number
          value: string
        }
        Update: {
          active?: boolean
          category_id?: string
          created_at?: string
          display_label?: string
          id?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropdown_values_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dropdown_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      found_items: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          found_at: string
          found_by: string | null
          found_location_id: string | null
          id: string
          notes: string | null
          org_id: string
          photo_url: string | null
          property_id: string | null
          record_number: string
          returned_at: string | null
          returned_to: string | null
          status: Database["public"]["Enums"]["lost_found_status"]
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          found_at?: string
          found_by?: string | null
          found_location_id?: string | null
          id?: string
          notes?: string | null
          org_id: string
          photo_url?: string | null
          property_id?: string | null
          record_number: string
          returned_at?: string | null
          returned_to?: string | null
          status?: Database["public"]["Enums"]["lost_found_status"]
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          found_at?: string
          found_by?: string | null
          found_location_id?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          photo_url?: string | null
          property_id?: string | null
          record_number?: string
          returned_at?: string | null
          returned_to?: string | null
          status?: Database["public"]["Enums"]["lost_found_status"]
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "found_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "found_items_found_location_id_fkey"
            columns: ["found_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "found_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "found_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_cases: {
        Row: {
          case_id: string
          incident_id: string
          linked_at: string
        }
        Insert: {
          case_id: string
          incident_id: string
          linked_at?: string
        }
        Update: {
          case_id?: string
          incident_id?: string
          linked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_cases_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_dispatches: {
        Row: {
          dispatch_id: string
          incident_id: string
          linked_at: string
        }
        Insert: {
          dispatch_id: string
          incident_id: string
          linked_at?: string
        }
        Update: {
          dispatch_id?: string
          incident_id?: string
          linked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_dispatches_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_dispatches_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_financials: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          entry_type: string
          id: string
          incident_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type: string
          id?: string
          incident_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_financials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_financials_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_narratives: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          incident_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          incident_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          incident_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_narratives_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_narratives_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_participants: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          first_name: string
          id: string
          incident_id: string
          last_name: string
          medical_attention: boolean | null
          medical_details: string | null
          person_id: string | null
          person_type: string
          phone: string | null
          police_contacted: boolean | null
          police_result: string | null
          primary_role: string
          secondary_role: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          first_name: string
          id?: string
          incident_id: string
          last_name: string
          medical_attention?: boolean | null
          medical_details?: string | null
          person_id?: string | null
          person_type: string
          phone?: string | null
          police_contacted?: boolean | null
          police_result?: string | null
          primary_role: string
          secondary_role?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          first_name?: string
          id?: string
          incident_id?: string
          last_name?: string
          medical_attention?: boolean | null
          medical_details?: string | null
          person_id?: string | null
          person_type?: string
          phone?: string | null
          police_contacted?: boolean | null
          police_result?: string | null
          primary_role?: string
          secondary_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_participants_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          disposition: string | null
          id: string
          incident_type: string
          location_id: string | null
          org_id: string
          property_id: string | null
          record_number: string
          reported_by: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          synopsis: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          disposition?: string | null
          id?: string
          incident_type: string
          location_id?: string | null
          org_id: string
          property_id?: string | null
          record_number: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          synopsis?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          disposition?: string | null
          id?: string
          incident_type?: string
          location_id?: string | null
          org_id?: string
          property_id?: string | null
          record_number?: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          synopsis?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          location_type: string | null
          name: string
          parent_id: string | null
          property_id: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          name: string
          parent_id?: string | null
          property_id: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          name?: string
          parent_id?: string | null
          property_id?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_reports: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          org_id: string
          property_id: string | null
          record_number: string
          reported_at: string
          reported_by_contact: string | null
          reported_by_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          org_id: string
          property_id?: string | null
          record_number: string
          reported_at?: string
          reported_by_contact?: string | null
          reported_by_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          org_id?: string
          property_id?: string | null
          record_number?: string
          reported_at?: string
          reported_by_contact?: string | null
          reported_by_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          created_at: string
          description: string | null
          email_enabled: boolean
          event_type: string
          id: string
          org_id: string
          push_enabled: boolean
          recipients: Json
          sms_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email_enabled?: boolean
          event_type: string
          id?: string
          org_id: string
          push_enabled?: boolean
          recipients?: Json
          sms_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email_enabled?: boolean
          event_type?: string
          id?: string
          org_id?: string
          push_enabled?: boolean
          recipients?: Json
          sms_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          org_id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          org_id: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          org_id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string
          settings: Json
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string
          settings?: Json
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string
          settings?: Json
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      patrons: {
        Row: {
          created_at: string
          deleted_at: string | null
          dob: string | null
          email: string | null
          first_name: string
          flag: Database["public"]["Enums"]["patron_flag"]
          id: string
          id_number: string | null
          id_type: string | null
          last_name: string
          notes: string | null
          org_id: string
          phone: string | null
          photo_url: string | null
          ticket_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dob?: string | null
          email?: string | null
          first_name: string
          flag?: Database["public"]["Enums"]["patron_flag"]
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          photo_url?: string | null
          ticket_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string
          flag?: Database["public"]["Enums"]["patron_flag"]
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          photo_url?: string | null
          ticket_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badge_number: string | null
          certifications: string[] | null
          created_at: string
          deleted_at: string | null
          email: string
          emergency_contact: Json | null
          full_name: string
          id: string
          org_id: string
          phone: string | null
          property_id: string | null
          role: Database["public"]["Enums"]["staff_role"]
          shift: string | null
          start_date: string | null
          status: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          avatar_url?: string | null
          badge_number?: string | null
          certifications?: string[] | null
          created_at?: string
          deleted_at?: string | null
          email: string
          emergency_contact?: Json | null
          full_name: string
          id: string
          org_id: string
          phone?: string | null
          property_id?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          shift?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          avatar_url?: string | null
          badge_number?: string | null
          certifications?: string[] | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          emergency_contact?: Json | null
          full_name?: string
          id?: string
          org_id?: string
          phone?: string | null
          property_id?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          shift?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          org_id: string
          status: string
          timezone: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          org_id: string
          status?: string
          timezone?: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
          status?: string
          timezone?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      record_sequences: {
        Row: {
          current: number
          id: string
          org_id: string
          prefix: string
        }
        Insert: {
          current?: number
          id?: string
          org_id: string
          prefix: string
        }
        Update: {
          current?: number
          id?: string
          org_id?: string
          prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          org_id: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          org_id: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          org_id?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_status_records: {
        Row: {
          id: string
          staff_id: string
          status: Database["public"]["Enums"]["officer_status"]
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          status?: Database["public"]["Enums"]["officer_status"]
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["officer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_status_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_incidents: {
        Row: {
          incident_id: string
          linked_at: string
          vehicle_id: string
        }
        Insert: {
          incident_id: string
          linked_at?: string
          vehicle_id: string
        }
        Update: {
          incident_id?: string
          linked_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_incidents_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_incidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          id: string
          license_plate: string | null
          license_state: string | null
          make: string
          model: string
          notes: string | null
          org_id: string
          owner_id: string | null
          owner_type: string | null
          updated_at: string
          vehicle_type: string
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          license_plate?: string | null
          license_state?: string | null
          make: string
          model: string
          notes?: string | null
          org_id: string
          owner_id?: string | null
          owner_type?: string | null
          updated_at?: string
          vehicle_type: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          license_plate?: string | null
          license_state?: string | null
          make?: string
          model?: string
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          owner_type?: string | null
          updated_at?: string
          vehicle_type?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          company: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          expected_date: string | null
          expected_time: string | null
          first_name: string
          host_department: string | null
          host_name: string | null
          id: string
          id_number: string | null
          id_type: string | null
          last_name: string
          nda_required: boolean
          org_id: string
          phone: string | null
          property_id: string | null
          purpose: string
          status: string
          updated_at: string
          vehicle_plate: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          expected_date?: string | null
          expected_time?: string | null
          first_name: string
          host_department?: string | null
          host_name?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name: string
          nda_required?: boolean
          org_id: string
          phone?: string | null
          property_id?: string | null
          purpose: string
          status?: string
          updated_at?: string
          vehicle_plate?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          expected_date?: string | null
          expected_time?: string | null
          first_name?: string
          host_department?: string | null
          host_name?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name?: string
          nda_required?: boolean
          org_id?: string
          phone?: string | null
          property_id?: string | null
          purpose?: string
          status?: string
          updated_at?: string
          vehicle_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          id: string
          location_id: string | null
          org_id: string
          priority: Database["public"]["Enums"]["dispatch_priority"]
          property_id: string | null
          record_number: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          location_id?: string | null
          org_id: string
          priority?: Database["public"]["Enums"]["dispatch_priority"]
          property_id?: string | null
          record_number: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          location_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["dispatch_priority"]
          property_id?: string | null
          record_number?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_permission: {
        Args: { module: string; required_level: string; user_id: string }
        Returns: boolean
      }
      get_user_org_id: { Args: never; Returns: string }
      next_record_number: {
        Args: { p_org_id: string; p_prefix: string }
        Returns: string
      }
    }
    Enums: {
      case_status: "open" | "on_hold" | "closed" | "archived"
      daily_log_status: "open" | "pending" | "high_prio" | "closed" | "archived"
      dispatch_priority: "critical" | "high" | "medium" | "low"
      dispatch_status:
        | "pending"
        | "scheduled"
        | "in_progress"
        | "on_scene"
        | "overdue"
        | "cleared"
        | "completed"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "follow_up"
        | "investigation"
        | "completed"
        | "closed"
        | "archived"
      lost_found_status:
        | "stored"
        | "pending_return"
        | "returned"
        | "disposed"
        | "overdue"
      officer_status:
        | "available"
        | "on_break"
        | "dispatched"
        | "on_scene"
        | "overdue"
        | "off_duty"
        | "break_overdue"
      patron_flag: "none" | "watch" | "banned" | "vip" | "warning"
      staff_role:
        | "super_admin"
        | "org_admin"
        | "manager"
        | "dispatcher"
        | "supervisor"
        | "staff"
        | "viewer"
      work_order_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "completed"
        | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      case_status: ["open", "on_hold", "closed", "archived"],
      daily_log_status: ["open", "pending", "high_prio", "closed", "archived"],
      dispatch_priority: ["critical", "high", "medium", "low"],
      dispatch_status: [
        "pending",
        "scheduled",
        "in_progress",
        "on_scene",
        "overdue",
        "cleared",
        "completed",
      ],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: [
        "open",
        "assigned",
        "in_progress",
        "follow_up",
        "investigation",
        "completed",
        "closed",
        "archived",
      ],
      lost_found_status: [
        "stored",
        "pending_return",
        "returned",
        "disposed",
        "overdue",
      ],
      officer_status: [
        "available",
        "on_break",
        "dispatched",
        "on_scene",
        "overdue",
        "off_duty",
        "break_overdue",
      ],
      patron_flag: ["none", "watch", "banned", "vip", "warning"],
      staff_role: [
        "super_admin",
        "org_admin",
        "manager",
        "dispatcher",
        "supervisor",
        "staff",
        "viewer",
      ],
      work_order_status: [
        "open",
        "assigned",
        "in_progress",
        "completed",
        "closed",
      ],
    },
  },
} as const
