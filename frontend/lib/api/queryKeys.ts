/**
 * Query key factory for TanStack Query
 *
 * Hierarchical key structure enables granular cache invalidation:
 * - Invalidate all analyses: queryKeys.analyses.all
 * - Invalidate analysis lists only: queryKeys.analyses.lists()
 * - Invalidate a specific analysis: queryKeys.analyses.detail(id)
 */
export const queryKeys = {
  analyses: {
    all: ['analyses'] as const,
    lists: () => [...queryKeys.analyses.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.analyses.lists(), filters] as const,
    details: () => [...queryKeys.analyses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.analyses.details(), id] as const,
    results: (id: string) => [...queryKeys.analyses.detail(id), 'results'] as const,
    states: (id: string) => [...queryKeys.analyses.detail(id), 'states'] as const,
    stateDetail: (id: string, stateCode: string) => [...queryKeys.analyses.states(id), stateCode] as const,
    registrations: (id: string) => [...queryKeys.analyses.detail(id), 'registrations'] as const,
  },
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    notes: (id: string) => [...queryKeys.clients.detail(id), 'notes'] as const,
    analyses: (id: string) => [...queryKeys.clients.detail(id), 'analyses'] as const,
    contacts: (id: string) => [...queryKeys.clients.detail(id), 'contacts'] as const,
    overview: (id: string) => [...queryKeys.clients.detail(id), 'overview'] as const,
    intake: (id: string) => [...queryKeys.clients.detail(id), 'intake'] as const,
    intakeStatus: (id: string) => [...queryKeys.clients.detail(id), 'intake-status'] as const,
    stateWorklist: (id: string) => [...queryKeys.clients.detail(id), 'state-worklist'] as const,
    stateDetail: (clientId: string, state: string) => [...queryKeys.clients.stateWorklist(clientId), state] as const,
  },
  physicalNexus: {
    all: ['physicalNexus'] as const,
    list: (analysisId: string) => [...queryKeys.physicalNexus.all, analysisId] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    current: () => [...queryKeys.organizations.all, 'current'] as const,
    role: () => [...queryKeys.organizations.all, 'role'] as const,
    members: () => [...queryKeys.organizations.all, 'members'] as const,
    profile: () => [...queryKeys.organizations.all, 'profile'] as const,
  },
  compliance: {
    all: ['compliance'] as const,
    thresholds: () => [...queryKeys.compliance.all, 'thresholds'] as const,
    stateDetail: (stateCode: string) => [...queryKeys.compliance.all, 'state', stateCode] as const,
  },
} as const
