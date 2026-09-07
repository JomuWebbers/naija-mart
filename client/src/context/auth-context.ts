import { createContext } from 'react'

export type User = {
  id: string
  name: string
  email: string
  role: string
}

export type AuthContextType = {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)



