// API Response Types
export interface ApiResponse<T = unknown> {
  status: 'SUCCESS' | 'ERROR'
  message: string
  data?: T
  token?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// User Types
export interface User {
  _id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  account_status: boolean
  role: 'Client' | 'admin' | 'agent'
  createdAt: string
  updatedAt: string
  birth_date?: string
  has_team?: boolean
  agent_code?: string
  credit?: number
  canReceiveNotifications?: boolean
  fcm_token?: string
  environment?: string
  // Legacy fields for backward compatibility
  name?: string
  status?: 'active' | 'inactive' | 'banned' | 'pending'
  created_at?: string
  updated_at?: string
}

export interface AdminUser {
  _id: string
  email: string
  name: string
  role: 'admin'
  status: string
  created_at: string
  updated_at: string
}

// Game Week Types
export interface GameWeek {
  _id: string
  game_week: string
  sid: string
  cid: string
  season_id: string
  competition_id: string
  transfer_deadline: string
  purchase_deadline: string
  is_free: boolean
  is_done: boolean
  is_active: boolean
  first_match_start_date: string
  last_match_end_date: string
  match_ids: string[]
  time_interval?: string
  is_double_gameweek: boolean
  double_gameweek_first_match?: string
  double_gameweek_transfer_deadline?: string
  double_gameweek_teams?: string[]
  createdAt: string
  updatedAt: string
  // Legacy fields for backward compatibility
  name?: string
  week_number?: number
  start_date?: string
  end_date?: string
  status?: string
  participants_count?: number
  created_at?: string
  updated_at?: string
}

// Season Types  
export interface Season {
  _id: string
  name: string
  season_id: string
  is_active: boolean
  createdAt: string
  updatedAt: string
  competitions?: Competition[]
}

// Competition Types
export interface Competition {
  _id: string
  competition_name: string
  competition_slug: string
  cid: string
  sid: string
  logo?: string
  is_active: boolean
  start_date: string
  end_date: string
  status: number // 1=active, 2=completed, 3=cancelled
  season: string
  createdAt: string
  updatedAt: string
  participants_count?: number
  prize_pool?: number
}

// Player in Team Types
export interface TeamPlayer {
  full_name: string
  pid: string
  position: string
  price: number
  club: string
  club_logo?: string
  is_bench?: boolean
  is_captain?: boolean
  is_vice_captain?: boolean
  is_switched?: boolean
  fantasy_point?: number
  final_fantasy_point?: number
  minutesplayed?: number
  goalscored?: number
  assist?: number
  [key: string]: string | number | boolean | undefined // Allow for additional fields
}

// Team Types
export interface Team {
  _id: string
  name: string
  user_id?: string
  client_id?: string
  game_week_id?: string
  players: TeamPlayer[] | string[] // Can be array of objects or strings
  formation?: string
  captain_id?: string
  vice_captain_id?: string
  total_points?: number
  total_fantasy_point?: number
  budget?: number
  created_at: string
  updated_at: string
}

// Player Types
export interface Player {
  _id: string
  name: string
  team: string
  position: string
  price: number
  total_points?: number
  form?: number
  status: 'active' | 'injured' | 'suspended'
  created_at: string
  updated_at: string
}

// Player Statistics Types
export interface PlayerStat {
  _id?: string
  pid: string
  full_name: string
  tname: string
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'
  fantasy_point: number
  minutesplayed: number
  goalscored: number
  assist: number
  passes?: number
  shotsontarget?: number
  cleansheet: number
  shotssaved: number
  penaltysaved: number
  tacklesuccessful?: number
  yellowcard: number
  redcard: number
  owngoal: number
  goalsconceded: number
  penaltymissed: number
  chancecreated?: number
  starting11?: number
  substitute?: number
  blockedshot?: number
  interceptionwon?: number
  clearance?: number
}

// Fantasy Roaster Types
export interface FantasyPlayer {
  pid: string
  pname: string
  role: string
  rating: string
  prev_rating?: string
  transfer_radar?: boolean
  is_new?: boolean
  is_injuried?: boolean
  is_banned?: boolean
  team: {
    tid: string
    tname: string
    fullname: string
    abbr: string
    logo: string
  }
}

export interface FantasyRoaster {
  _id: string
  season_name: string
  season_id: string
  competition_id: string
  competition_cid: string
  is_active: boolean
  players: FantasyPlayer[]
  createdAt: string
  updatedAt: string
}

export interface CreateFantasyRoasterData {
  season_name: string
  season_id: string
  competition_id: string
  competition_cid: string
  players: FantasyPlayer[]
}

export interface UpdatePlayerRatingData {
  pid: string
  rating: number
}

export interface UpdateRoasterStatusData {
  is_active: boolean
}

export interface AddPlayerData {
  pid: string
  pname: string
  rating: number
  role: string
  tid: string
  tname: string
  logo: string
  fullname: string
  abbr: string
}

export interface RemovePlayerData {
  pid: string
}

// Transaction Types
export interface Transaction {
  _id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description?: string
  created_at: string
  updated_at: string
}

// FAQ Types
export interface FAQ {
  _id: string
  title: string
  content: string
  category?: string
  order?: number
  created_at: string
  updated_at: string
}

// Content Types
export interface Content {
  _id: string
  title: string
  content: string
  type: 'terms' | 'privacy' | 'about'
  is_published?: boolean
  is_message?: boolean
  version_title?: string
  version_content?: string
  created_at: string
  updated_at: string
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalGameWeeks: number
  activeGameWeeks: number
  totalCompetitions: number
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  userGrowth: number
}

// Form Data Types
export interface LoginFormData {
  email: string
  password: string
}

export interface CreateGameWeekData {
  game_week: string
  season_id: string
  competition_id: string
  is_free?: boolean
}

export interface UpdateGameWeekDeadlinesData {
  transfer_deadline: string
  purchase_deadline: string
  first_match_start_date: string
  last_match_end_date: string
  time_interval?: string
}

export interface CreateCompetitionData {
  cid: string
  season: string
}

export interface UpdateCompetitionData {
  cid: string
}

export interface CreateSeasonData {
  name: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  status?: string
  agent_code?: string
  commission_rate?: number
}

// API Parameters Types
export interface ApiParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  order?: 'asc' | 'desc'
}

// Advertisement Types
export interface Advertisement {
  _id: string
  ad_company: string
  ad_package: string
  start_date: string
  end_date: string
  link?: string
  is_active: boolean
  img: {
    cloudinary_secure_url: string
    cloudinary_public_id: string
  }
  created_at: string
  updated_at: string
}

export interface CreateAdvertisementData {
  ad_company: string
  ad_package: string
  start_date: string
  link?: string
  is_active?: boolean
  img: {
    cloudinary_secure_url: string
    cloudinary_public_id: string
  }
}

// AD Company Types
export interface AdCompany {
  _id: string
  comp_name: string
  comp_name_slug: string
  comp_tin: string
  comp_addr: string
  comp_contact: {
    phone_number: string[]
    email: string
  }
  business_type: string
  website?: string
  created_at: string
  updated_at: string
}

export interface CreateAdCompanyData {
  comp_name: string
  comp_tin: string
  comp_addr: string
  comp_contact: {
    phone_number: string[]
    email: string
  }
  business_type: string
  website?: string
}

// AD Package Types
export interface AdPackage {
  _id: string
  pack_name: string
  pack_name_slug: string
  price: number
  duration: number
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export interface CreateAdPackageData {
  pack_name: string
  price: number
  duration: number
}

// App Version Types
export interface AppVersion {
  _id: string
  latest_version: string
  os: 'Android' | 'iOS'
  url: string
  highly_severe: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAppVersionData {
  latest_version: string
  os: 'Android' | 'iOS'
  url: string
  highly_severe: boolean
}

export interface UpdateAppVersionData {
  latest_version?: string
  url?: string
}

export interface UpdateAppVersionSeverityData {
  highly_severe: boolean
}

// Award Types
export interface Award {
  _id: string
  client_id: string
  client_name?: string
  competition_id: string
  competition_name: string
  game_week: number
  position: number
  total_point: number
  award_type: 'first' | 'second' | 'third' | 'winner' | 'participant'
  prize_amount?: number
  prize_description?: string
  created_at: string
  updated_at: string
}

export interface CreateAwardData {
  client_id: string
  competition_id: string
  game_week: number
  position: number
  total_point: number
  award_type: 'first' | 'second' | 'third' | 'winner' | 'participant'
  prize_amount?: number
  prize_description?: string
}

// Poll interfaces
export interface PollChoice {
  _id: string
  choice: string
  selected_by: number
  id: string
}

export interface Poll {
  _id: string
  question: string
  choices: PollChoice[]
  status: 'Open' | 'Closed'
  close_date: string
  createdAt: string
  updatedAt: string
  __v: number
  id: string
}

export interface CreatePollData {
  question: string
  choices: Array<{ choice: string }>
  close_date: string
}

export interface UpdatePollData {
  question?: string
  close_date?: string
}

export interface UpdatePollStatusData {
  status: 'Open' | 'Closed'
}

export interface PollResponse {
  _id: string
  poll_id: string
  user_id: string
  choice_id: string
  createdAt: string
  updatedAt: string
  __v: number
  id: string
}

// Coach Types
export interface Coach {
  _id: string
  coach_name: string
  coach_slugify_name: string
  image_public_id: string
  image_secure_url: string
  is_active: boolean
  is_major: boolean
  createdAt: string
  updatedAt: string
  __v: number
}

export interface CreateCoachData {
  coach_name: string
  image_public_id: string
  image_secure_url: string
}

export interface UpdateCoachData {
  coach_name?: string
}

export interface UpdateCoachImageData {
  image_public_id: string
  image_secure_url: string
}

export interface UpdateCoachStatusData {
  is_active: boolean
}

export interface SwapMajorCoachData {
  newMajorCoachId: string
  existingCoachId: string
}

export interface DeleteAllCoachesData {
  deleteKey: string
}

// Generic Types
export type ApiFunction<T = unknown> = (params?: ApiParams) => Promise<ApiResponse<T>>
export type MutationFunction<T = unknown, R = unknown> = (data: T) => Promise<ApiResponse<R>> 