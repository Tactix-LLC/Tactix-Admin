"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { playersAPI } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Edit3 } from "lucide-react"
import { Player } from "@/types"

export default function PlayersPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["players", search],
    queryFn: playersAPI.getAll,
  })

  const all = useMemo(() => data?.data?.data ?? [], [data])
  const players = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return all
    return all.filter((p: Player & { full_name?: string; tname?: string; pid?: string; fantasy_point?: number }) =>
      (p.full_name || p.name || "").toLowerCase().includes(term) ||
      (p.tname || p.team || "").toLowerCase().includes(term) ||
      (p.position || "").toLowerCase().includes(term)
    )
  }, [all, search])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Failed to load players</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Players</h1>
            <p className="text-gray-600">View all-time player stats</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">Refresh</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by player, team or position..." className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {players.map((p: Player & { full_name?: string; tname?: string; pid?: string; fantasy_point?: number }, idx: number) => (
                    <tr key={`${p.pid || p._id || idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{p.full_name || p.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{p.tname || p.team}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{p.position}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{p.fantasy_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}


