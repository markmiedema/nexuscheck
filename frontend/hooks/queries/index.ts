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
} from './useClients'

// Analysis hooks
export {
  useAnalyses,
  useAnalysis,
  useDeleteAnalysis,
  useCreateAnalysis,
  useAnalysisWithPolling,
} from './useAnalyses'

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
