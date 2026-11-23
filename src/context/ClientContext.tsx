import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

export interface Client {
  _id: string
  name: string
  domain?: string
  niche?: string
  notes?: string
  isArchived: boolean
  campaignCount?: number
  prospectsTotal?: number
  linksWon?: number
  createdAt: string
  updatedAt: string
}

interface ClientContextType {
  selectedClientId: string
  setSelectedClientId: (id: string) => void
  selectedClient: Client | null
  clients: Client[]
  isLoading: boolean
  refetchClients: () => void
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

const STORAGE_KEY = 'outreach_selected_client_id'

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })

  // Fetch all active clients for the global selector
  const { data, isLoading, refetch: refetchClients } = useQuery({
    queryKey: ['global-clients'],
    queryFn: async () => {
      const res = await api.get('/clients?archived=false&limit=100')
      return res.data?.data?.clients as Client[] || []
    },
  })

  const clients = data || []

  // Ensure selected client is valid, or reset to '' (All Clients)
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const exists = clients.some((c) => c._id === selectedClientId)
      if (!exists) {
        setSelectedClientIdState('')
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [selectedClientId, clients])

  const setSelectedClientId = (id: string) => {
    setSelectedClientIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const selectedClient = clients.find((c) => c._id === selectedClientId) || null

  return (
    <ClientContext.Provider
      value={{
        selectedClientId,
        setSelectedClientId,
        selectedClient,
        clients,
        isLoading,
        refetchClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider')
  }
  return context
}
