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

// State Worklist hooks
export {
  useStateWorklist,
  useStateAssessment,
  useCreateStateAssessment,
  useUpdateStateAssessment,
  useDeleteStateAssessment,
  useCreateStateAction,
  useUpdateStateAction,
  useDeleteStateAction,
  useUpdateActionTask,
  useImportStatesFromAnalysis,
} from './useStateWorklist'
export type {
  StateWorklistResponse,
  StateAssessment,
  StateAssessmentCreate,
  StateAssessmentUpdate,
  StateAction,
  StateActionCreate,
  StateActionUpdate,
  StateActionTask,
  StateActionTaskUpdate,
} from './useStateWorklist'
export {
  NEXUS_STATUS_LABELS,
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS,
  TASK_STATUS_LABELS,
  type StateWorklistItem,
  type StateWorklistSummary,
  type ActionType,
  type ActionStatus,
  type TaskStatus,
} from '@/lib/api/stateWorklist'
