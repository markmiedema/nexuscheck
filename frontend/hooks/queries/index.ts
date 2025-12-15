// Query key factory
export { queryKeys } from '@/lib/api/queryKeys'

// Client hooks
export {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useClientNotes,
  useCreateClientNote,
  useClientAnalyses,
  useClientOverview,
  useClientIntakeItems,
  useClientIntakeStatus,
  useInitializeClientIntake,
  useUpdateClientIntakeItem,
} from './useClients'
export type {
  ClientOverview,
  IntakeItem,
  IntakeStatus,
  NextAction,
  Deadline,
  BlockingItem,
  StatesSummary,
  StageInfo,
} from '@/lib/api/clients'

// Analysis hooks
export {
  useAnalyses,
  useAnalysis,
  useDeleteAnalysis,
  useCreateAnalysis,
  useAnalysisWithPolling,
  useAnalysisColumns,
  useAnalysisResultsSummary,
  useCalculateAnalysis,
  useMarkAnalysisPresented,
  useUnmarkAnalysisPresented,
} from './useAnalyses'
export type { AnalysisResultsSummary, ColumnInfo, DataSummary, ColumnsResponse } from './useAnalyses'

// State results hooks
export {
  useStateResults,
  useStateDetail,
  useClientStateResults,
} from './useStateResults'
export type { StateDetailResponse } from './useStateResults'

// Registration hooks
export {
  useRegistrationsQuery,
  useToggleRegistration,
  useSetMultipleRegistrations,
  useRegistrations,
} from './useRegistrations'

// Organization hooks
export {
  useOrganization,
  useUpdateOrganization,
  useUserRole,
  useIsAdmin,
  useOrganizationMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useUserProfile,
  useUpdateUserProfile,
} from './useOrganizations'
export type {
  Organization,
  OrganizationMember,
  UpdateOrganizationData,
  InviteMemberData,
  UserProfile,
  UpdateProfileData,
} from '@/lib/api/organizations'

// Compliance hooks
export {
  useComplianceThresholds,
  useComplianceStateDetail,
} from './useCompliance'
export type { ThresholdData, StateDetailData } from './useCompliance'
