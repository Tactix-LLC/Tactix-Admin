"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemSettingsAPI } from "@/lib/api";
import { useUIStore } from "@/lib/store";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Trophy, 
  Clock, 
  Users, 
  Shield, 
  Zap,
  Database,
  Globe,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface SystemSettings {
  point_system: {
    playing_under_60_minutes: number;
    playing_60_plus_minutes: number;
    goalkeeper_goal: number;
    defender_goal: number;
    midfielder_goal: number;
    forward_goal: number;
    assist: number;
    goalkeeper_clean_sheet: number;
    defender_clean_sheet: number;
    midfielder_clean_sheet: number;
    saves_per_3: number;
    penalty_save: number;
    defender_defensive_contributions: { threshold: number; points: number };
    midfielder_defensive_contributions: { threshold: number; points: number };
    forward_defensive_contributions: { threshold: number; points: number };
    penalty_miss: number;
    yellow_card: number;
    red_card: number;
    own_goal: number;
    goals_conceded_per_2: number;
    bonus_points: { first_place: number; second_place: number; third_place: number };
  };
  auto_join_hours_before: number;
  transfer_deadline_hours_before: number;
  purchase_deadline_minutes_before: number;
  default_timezone: string;
  max_group_members: number;
  auto_join: {
    enabled: boolean;
    hours_before_deadline: number;
    max_retry_attempts: number;
    retry_delay_minutes: number;
    notification_enabled: boolean;
  };
  auto_agent_on_registration: boolean;
  audit_log_retention_days: number;
  rate_limit_per_minute: number;
  mongo_pool_size: number;
  mongo_timeout: number;
  redis_ttl_hours: number;
  features: {
    groups_enabled: boolean;
    auto_join_enabled: boolean;
    oauth_enabled: boolean;
    manual_data_override_enabled: boolean;
  };

  // App status / season break
  season_break_enabled: boolean;
  season_break_title: string;
  season_break_message: string;
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'point-system' | 'general' | 'features' | 'auto-join' | 'app-status'>('point-system');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [pointSystem, setPointSystem] = useState<SystemSettings['point_system'] | null>(null);
  const [generalSettings, setGeneralSettings] = useState<Partial<SystemSettings> | null>(null);
  const [features, setFeatures] = useState<SystemSettings['features'] | null>(null);
  const [autoJoinSettings, setAutoJoinSettings] = useState<SystemSettings['auto_join'] | null>(null);
  const [appStatusSettings, setAppStatusSettings] = useState<Pick<SystemSettings, 'season_break_enabled' | 'season_break_title' | 'season_break_message'> | null>(null);
  
  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();

  // Fetch system settings
  const { data: systemSettingsData, isLoading, error } = useQuery({
    queryKey: ['system-settings'],
    queryFn: systemSettingsAPI.getSystemSettings,
  });

  // Fetch point system
  const { data: pointSystemData } = useQuery({
    queryKey: ['point-system'],
    queryFn: systemSettingsAPI.getPointSystem,
  });

  // Update system settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: systemSettingsAPI.updateSystemSettings,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'System settings updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error: unknown) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update system settings',
      });
    },
  });

  // Update point system mutation
  const updatePointSystemMutation = useMutation({
    mutationFn: systemSettingsAPI.updatePointSystem,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Point system updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['point-system'] });
    },
    onError: (error: unknown) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update point system',
      });
    },
  });

  // Reset to default mutation
  const resetMutation = useMutation({
    mutationFn: systemSettingsAPI.resetToDefaultSettings,
    onSuccess: () => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: 'Settings reset to default successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['point-system'] });
    },
    onError: (error: unknown) => {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset settings',
      });
    },
  });

  useEffect(() => {
    if (systemSettingsData?.data) {
      setSettings(systemSettingsData.data);
      setGeneralSettings({
        auto_join_hours_before: systemSettingsData.data.auto_join_hours_before,
        transfer_deadline_hours_before: systemSettingsData.data.transfer_deadline_hours_before,
        purchase_deadline_minutes_before: systemSettingsData.data.purchase_deadline_minutes_before,
        default_timezone: systemSettingsData.data.default_timezone,
        max_group_members: systemSettingsData.data.max_group_members,
        auto_agent_on_registration: systemSettingsData.data.auto_agent_on_registration,
        audit_log_retention_days: systemSettingsData.data.audit_log_retention_days,
        rate_limit_per_minute: systemSettingsData.data.rate_limit_per_minute,
        mongo_pool_size: systemSettingsData.data.mongo_pool_size,
        mongo_timeout: systemSettingsData.data.mongo_timeout,
        redis_ttl_hours: systemSettingsData.data.redis_ttl_hours,
      });
      setFeatures(systemSettingsData.data.features);
      setAutoJoinSettings(systemSettingsData.data.auto_join);
      setAppStatusSettings({
        season_break_enabled: systemSettingsData.data.season_break_enabled,
        season_break_title: systemSettingsData.data.season_break_title,
        season_break_message: systemSettingsData.data.season_break_message,
      });
    }
  }, [systemSettingsData]);

  useEffect(() => {
    if (pointSystemData?.data) {
      setPointSystem(pointSystemData.data);
    }
  }, [pointSystemData]);

  const handlePointSystemUpdate = () => {
    if (pointSystem) {
      updatePointSystemMutation.mutate(pointSystem);
    }
  };

  const handleGeneralSettingsUpdate = () => {
    if (generalSettings) {
      updateSettingsMutation.mutate(generalSettings);
    }
  };

  const handleFeaturesUpdate = () => {
    if (features) {
      updateSettingsMutation.mutate({ features });
    }
  };

  const handleAutoJoinUpdate = () => {
    if (autoJoinSettings) {
      updateSettingsMutation.mutate({ auto_join: autoJoinSettings });
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      resetMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">Failed to load system settings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Manage system configuration and point system</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={resetMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('point-system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'point-system'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Trophy className="h-4 w-4 inline mr-2" />
            Point System
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Features
          </button>
          <button
            onClick={() => setActiveTab('auto-join')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'auto-join'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Auto-Join
          </button>
          <button
            onClick={() => setActiveTab('app-status')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'app-status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Globe className="h-4 w-4 inline mr-2" />
            App Status
          </button>
        </nav>
      </div>

      {/* Point System Tab */}
      {activeTab === 'point-system' && pointSystem && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              FPL Point System Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Playing Time */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Playing Time
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Under 60 minutes
                  </label>
                  <input
                    type="number"
                    value={pointSystem.playing_under_60_minutes}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      playing_under_60_minutes: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    60+ minutes
                  </label>
                  <input
                    type="number"
                    value={pointSystem.playing_60_plus_minutes}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      playing_60_plus_minutes: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Goals by Position */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Goals by Position
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goalkeeper Goal
                  </label>
                  <input
                    type="number"
                    value={pointSystem.goalkeeper_goal}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      goalkeeper_goal: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Defender Goal
                  </label>
                  <input
                    type="number"
                    value={pointSystem.defender_goal}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      defender_goal: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Midfielder Goal
                  </label>
                  <input
                    type="number"
                    value={pointSystem.midfielder_goal}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      midfielder_goal: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forward Goal
                  </label>
                  <input
                    type="number"
                    value={pointSystem.forward_goal}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      forward_goal: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Other Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Other Actions</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assist
                  </label>
                  <input
                    type="number"
                    value={pointSystem.assist}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      assist: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clean Sheet (GK/DEF)
                  </label>
                  <input
                    type="number"
                    value={pointSystem.goalkeeper_clean_sheet}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      goalkeeper_clean_sheet: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clean Sheet (MID)
                  </label>
                  <input
                    type="number"
                    value={pointSystem.midfielder_clean_sheet}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      midfielder_clean_sheet: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Goalkeeper Specific */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Goalkeeper Specific</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saves (per 3)
                  </label>
                  <input
                    type="number"
                    value={pointSystem.saves_per_3}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      saves_per_3: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Penalty Save
                  </label>
                  <input
                    type="number"
                    value={pointSystem.penalty_save}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      penalty_save: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Defensive Contributions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Defensive Contributions</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Defender Threshold
                  </label>
                  <input
                    type="number"
                    value={pointSystem.defender_defensive_contributions.threshold}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      defender_defensive_contributions: {
                        ...pointSystem.defender_defensive_contributions,
                        threshold: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Defender Points
                  </label>
                  <input
                    type="number"
                    value={pointSystem.defender_defensive_contributions.points}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      defender_defensive_contributions: {
                        ...pointSystem.defender_defensive_contributions,
                        points: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Penalties and Cards */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Penalties & Cards</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Penalty Miss
                  </label>
                  <input
                    type="number"
                    value={pointSystem.penalty_miss}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      penalty_miss: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yellow Card
                  </label>
                  <input
                    type="number"
                    value={pointSystem.yellow_card}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      yellow_card: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Red Card
                  </label>
                  <input
                    type="number"
                    value={pointSystem.red_card}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      red_card: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Own Goal
                  </label>
                  <input
                    type="number"
                    value={pointSystem.own_goal}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      own_goal: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bonus Points */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Bonus Points</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Place
                  </label>
                  <input
                    type="number"
                    value={pointSystem.bonus_points.first_place}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      bonus_points: {
                        ...pointSystem.bonus_points,
                        first_place: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Second Place
                  </label>
                  <input
                    type="number"
                    value={pointSystem.bonus_points.second_place}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      bonus_points: {
                        ...pointSystem.bonus_points,
                        second_place: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Third Place
                  </label>
                  <input
                    type="number"
                    value={pointSystem.bonus_points.third_place}
                    onChange={(e) => setPointSystem({
                      ...pointSystem,
                      bonus_points: {
                        ...pointSystem.bonus_points,
                        third_place: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePointSystemUpdate}
                disabled={updatePointSystemMutation.isPending}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Point System</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Settings Tab */}
      {activeTab === 'general' && generalSettings && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-500" />
              General System Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto Join Hours Before
                </label>
                <input
                  type="number"
                  value={generalSettings.auto_join_hours_before}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    auto_join_hours_before: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Deadline Hours Before
                </label>
                <input
                  type="number"
                  value={generalSettings.transfer_deadline_hours_before}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    transfer_deadline_hours_before: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Deadline Minutes Before
                </label>
                <input
                  type="number"
                  value={generalSettings.purchase_deadline_minutes_before}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    purchase_deadline_minutes_before: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Timezone
                </label>
                <input
                  type="text"
                  value={generalSettings.default_timezone}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    default_timezone: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Group Members
                </label>
                <input
                  type="number"
                  value={generalSettings.max_group_members}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    max_group_members: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Limit Per Minute
                </label>
                <input
                  type="number"
                  value={generalSettings.rate_limit_per_minute}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    rate_limit_per_minute: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generalSettings.auto_agent_on_registration}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    auto_agent_on_registration: e.target.checked
                  })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Auto Agent on Registration</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGeneralSettingsUpdate}
                disabled={updateSettingsMutation.isPending}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save General Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && features && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-green-500" />
              Feature Flags
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={features.groups_enabled}
                    onChange={(e) => setFeatures({
                      ...features,
                      groups_enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Groups Enabled</span>
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={features.auto_join_enabled}
                    onChange={(e) => setFeatures({
                      ...features,
                      auto_join_enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto Join Enabled</span>
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={features.oauth_enabled}
                    onChange={(e) => setFeatures({
                      ...features,
                      oauth_enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">OAuth Enabled</span>
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={features.manual_data_override_enabled}
                    onChange={(e) => setFeatures({
                      ...features,
                      manual_data_override_enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Manual Data Override Enabled</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleFeaturesUpdate}
                disabled={updateSettingsMutation.isPending}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Features</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Join Tab */}
      {activeTab === 'auto-join' && autoJoinSettings && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-500" />
              Auto-Join Configuration
            </h3>
            
            <div className="space-y-6">
              {/* Enable Auto-Join */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoJoinSettings.enabled}
                    onChange={(e) => setAutoJoinSettings({
                      ...autoJoinSettings,
                      enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="font-medium">Enable Auto-Join</span>
                </label>
                <span className="text-sm text-gray-500">Automatically join users to game weeks</span>
              </div>

              {/* Hours Before Deadline */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hours Before Deadline
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={autoJoinSettings.hours_before_deadline}
                  onChange={(e) => setAutoJoinSettings({
                    ...autoJoinSettings,
                    hours_before_deadline: parseInt(e.target.value) || 2
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">How many hours before the deadline to auto-join users</p>
              </div>

              {/* Max Retry Attempts */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Max Retry Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={autoJoinSettings.max_retry_attempts}
                  onChange={(e) => setAutoJoinSettings({
                    ...autoJoinSettings,
                    max_retry_attempts: parseInt(e.target.value) || 3
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">Maximum number of retry attempts for failed joins</p>
              </div>

              {/* Retry Delay */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Retry Delay (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={autoJoinSettings.retry_delay_minutes}
                  onChange={(e) => setAutoJoinSettings({
                    ...autoJoinSettings,
                    retry_delay_minutes: parseInt(e.target.value) || 5
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">Delay between retry attempts in minutes</p>
              </div>

              {/* Notification Enabled */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoJoinSettings.notification_enabled}
                    onChange={(e) => setAutoJoinSettings({
                      ...autoJoinSettings,
                      notification_enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="font-medium">Enable Notifications</span>
                </label>
                <span className="text-sm text-gray-500">Send notifications for auto-join events</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAutoJoinUpdate}
                disabled={updateSettingsMutation.isPending}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Auto-Join Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Status Tab */}
      {activeTab === 'app-status' && appStatusSettings && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-500" />
              Season Break / Maintenance Screen
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              When enabled, the mobile app will show a single locked page telling users to come back next season (even if they are logged in).
            </p>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">Enable Season Break Screen</div>
                  <div className="text-sm text-gray-600">Blocks the whole app and shows only the message screen.</div>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appStatusSettings.season_break_enabled}
                    onChange={(e) => setAppStatusSettings({
                      ...appStatusSettings,
                      season_break_enabled: e.target.checked,
                    })}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    appStatusSettings.season_break_enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform translate-y-0.5 ${
                      appStatusSettings.season_break_enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={appStatusSettings.season_break_title}
                    onChange={(e) => setAppStatusSettings({
                      ...appStatusSettings,
                      season_break_title: e.target.value,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Season Break"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={appStatusSettings.season_break_message}
                    onChange={(e) => setAppStatusSettings({
                      ...appStatusSettings,
                      season_break_message: e.target.value,
                    })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="We’re preparing the next season. Please come back when the new season starts."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => updateSettingsMutation.mutate(appStatusSettings)}
                  disabled={updateSettingsMutation.isPending}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>Save App Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
