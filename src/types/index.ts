export type UserRole = 'CarOwner' | 'Mechanic' | 'Dealer'

export interface User {
  id: string
  role: UserRole
  name: string
  phone: string
  email?: string
  address?: string
  profile_image?: string
  rating?: number
  total_reviews?: number
  fcm_token?: string
  created_at: string
  updated_at?: string
  specializations?: string[] // For mechanics - deprecated, use mechanic_specializations
  mechanic_specializations?: {
    service_types: string[] // Engine, Brakes, Electrical, etc.
    vehicle_brands: string[] // Toyota, Honda, BMW, etc.
    experience_years?: number
    certifications?: string[]
    emergency_services?: boolean
  }
  location_data?: {
    coordinates?: { lat: number; lng: number }
    address_components?: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
    place_id?: string
    city?: string
    country?: string
  }
}

export interface Car {
  id: string
  owner_id: string
  make: string
  model: string
  year: number
  color: string
  license_plate: string
  vin?: string
  image_url?: string
  image_urls?: string[]
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export type RequestStatus = 'pending' | 'claimed' | 'diagnosed' | 'quoted' | 'approved' | 'in_progress' | 'parts_requested' | 'parts_received' | 'completed' | 'cancelled'

export interface Request {
  id: string
  car_id: string
  owner_id: string
  mechanic_id?: string | null
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  location: string
  location_coords?: { lat: number; lng: number }
  distance?: number
  status: RequestStatus
  status_notes?: string
  estimated_hours?: number
  actual_hours?: number
  estimated_cost?: number
  final_cost?: number
  images?: string[]
  created_at: string
  updated_at: string
  car?: Car
  owner?: User
  mechanic?: User
}

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'
export type DiagnosisStatus = 'draft' | 'submitted' | 'approved' | 'completed'

export interface Diagnosis {
  id: string
  request_id: string
  mechanic_id: string
  title?: string
  details?: string
  issue_description: string
  recommended_solution: string
  estimated_cost: number
  parts_needed: string[] | PartNeeded[]
  labor_hours: number
  labor_cost?: number
  urgency_level: 'low' | 'medium' | 'high'
  severity?: SeverityLevel
  status?: DiagnosisStatus
  follow_up_required?: boolean
  follow_up_notes?: string
  resolution_time?: string
  image_urls?: string[]
  photos?: string[]
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface PartNeeded {
  part_id?: string
  name: string
  quantity: number
  estimated_price?: number
  actual_price?: number
  status: 'needed' | 'requested' | 'approved' | 'received'
  dealer_id?: string
  transaction_id?: string
}

export interface Part {
  id: string
  dealer_id: string
  name: string
  description?: string
  category: string
  brand?: string
  part_number?: string
  compatibility: string[] // Array of car makes/models
  image_url?: string
  price: number
  stock: number
  min_stock_threshold?: number
  is_active: boolean
  specifications?: Record<string, any>
  created_at: string
  updated_at?: string
  dealer?: User
}

export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'

export interface Transaction {
  id: string
  request_id?: string
  diagnosis_id?: string
  part_id: string
  dealer_id: string
  mechanic_id: string
  quantity: number
  unit_price: number
  total_amount: number
  status: TransactionStatus
  notes?: string
  approved_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  part?: Part
  dealer?: User
  mechanic?: User
  request?: Request
}

export interface MaintenanceRecord {
  id: string
  request_id: string
  car_id: string
  mechanic_id: string
  diagnosis_id?: string
  title: string
  description: string
  parts_used: PartNeeded[]
  labor_hours: number
  total_cost: number
  maintenance_date: string
  next_service_date?: string
  warranty_period?: number // in months
  notes?: string
  images?: string[]
  created_at: string
}

export type ActivityType = 'request_created' | 'request_claimed' | 'diagnosis_submitted' | 'quote_approved' | 'work_started' | 'parts_requested' | 'parts_approved' | 'parts_received' | 'work_completed' | 'payment_processed' | 'status_updated'

export interface ActivityLog {
  id: string
  request_id?: string
  user_id: string
  activity_type: ActivityType
  description: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface NotificationData {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'request_update' | 'diagnosis' | 'message' | 'transaction'
  timestamp: string
  read: boolean
  data?: {
    request_id?: string
    car_info?: string
    mechanic_name?: string
    amount?: number
    [key: string]: any
  }
}

export interface InventoryStats {
  total_parts: number
  low_stock_items: number
  pending_orders: number
  monthly_sales: number
  monthly_revenue: number
}

export interface MechanicStats {
  available_requests: number
  active_jobs: number
  completed_jobs: number
  total_earnings: number
  average_rating: number
}

export interface MechanicAvailability {
  id: string
  mechanic_id: string
  is_available: boolean
  max_concurrent_jobs: number
  current_active_jobs: number
  service_radius: number // in kilometers
  base_location: {
    address: string
    lat: number
    lng: number
  }
  specializations: string[] // car makes, service types, etc.
  hourly_rate: number
  emergency_service: boolean
  working_hours: {
    start: string // HH:MM format
    end: string   // HH:MM format
    days: number[] // 0-6 (Sunday-Saturday)
  }
  created_at: string
  updated_at: string
  mechanic?: User
}

export interface MechanicSearchFilters {
  location?: {
    lat: number
    lng: number
    radius?: number // km
  }
  specializations?: string[]
  max_hourly_rate?: number
  emergency_service?: boolean
  availability_now?: boolean
  rating_min?: number
}

export interface MechanicSearchResult extends MechanicAvailability {
  distance?: number // calculated distance from search location
  estimated_arrival?: string // estimated time to reach location
  total_rating: number
  completed_jobs: number
  is_currently_available: boolean
}

export interface ChatMessage {
  id?: string
  request_id: string
  sender_id: string
  sender_type: 'CarOwner' | 'Mechanic'
  message: string
  timestamp: string
  read_by: string[]
}

export interface ServiceRequest {
  id: string
  car_owner_id: string
  car_id: string
  mechanic_id?: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  location: string
  status: RequestStatus
  created_at: string
  updated_at: string
  estimated_cost?: number
  actual_cost?: number
  [key: string]: unknown
}

// Settings and Preferences
export interface UserSettings {
  id: string
  user_id: string
  
  // Location Settings
  location_enabled: boolean
  current_location?: {
    lat: number
    lng: number
    address?: string
    last_updated: string
  }
  auto_update_location: boolean
  
  // Notification Settings
  notifications_enabled: boolean
  push_notifications: boolean
  email_notifications: boolean
  sms_notifications: boolean
  notification_types: {
    new_requests: boolean
    request_updates: boolean
    messages: boolean
    system_updates: boolean
  }
  
  // Privacy Settings
  share_location_with_customers: boolean
  show_online_status: boolean
  
  // Mechanic-specific Settings
  mechanic_settings?: MechanicSettings
  
  created_at: string
  updated_at: string
}

export interface MechanicSettings {
  // Service Area Settings
  service_radius: number // in kilometers (1-100)
  auto_accept_radius: number // auto-accept requests within this radius
  
  // Working Hours
  working_hours: {
    enabled: boolean
    schedule: {
      monday: { enabled: boolean; start: string; end: string }
      tuesday: { enabled: boolean; start: string; end: string }
      wednesday: { enabled: boolean; start: string; end: string }
      thursday: { enabled: boolean; start: string; end: string }
      friday: { enabled: boolean; start: string; end: string }
      saturday: { enabled: boolean; start: string; end: string }
      sunday: { enabled: boolean; start: string; end: string }
    }
  }
  
  // Request Preferences
  max_concurrent_requests: number // 1-10
  minimum_job_value: number // minimum GHS value
  preferred_urgency_levels: ('low' | 'medium' | 'high')[]
  emergency_services: boolean
  
  // Auto-Assignment Settings
  auto_accept_requests: boolean
  auto_accept_conditions: {
    within_radius: boolean
    during_working_hours: boolean
    below_max_concurrent: boolean
  }
}

// Re-export location types for backward compatibility
export type { 
  LocationPermissionStatus, 
  GeolocationCoords,
  Address,
  LocationSearchResult,
  ProximitySearch,
  ProximityResult,
  LocationBasedRequestMatch,
  EnhancedMechanicAvailability
} from './location' 