"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { feedbackTitlesApi, FeedbackTitle } from "@/lib/api/feedback"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Activity,
  MessageSquare
} from "lucide-react"
import Link from "next/link"

export function FeedbackTitlesTable() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusId, setStatusId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Active')
  const queryClient = useQueryClient()

  // Fetch feedback titles
  const { data: feedbackTitlesData, isLoading, error } = useQuery({
    queryKey: ['feedbackTitles'],
    queryFn: feedbackTitlesApi.getAll,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: feedbackTitlesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackTitles'] })
      toast.success("Feedback title deleted successfully")
      setDeleteId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) =>
      feedbackTitlesApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackTitles'] })
      toast.success("Status updated successfully")
      setStatusId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleStatusChange = (id: string, currentStatus: 'Active' | 'Inactive') => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    setStatusId(id)
    setNewStatus(newStatus)
  }

  const confirmStatusChange = () => {
    if (statusId) {
      statusMutation.mutate({ id: statusId, status: newStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading feedback titles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-100 mx-auto mb-4">
            <XCircle className="h-8 w-8 text-error-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Titles</h3>
          <p className="text-gray-500">There was an error loading feedback titles.</p>
        </div>
      </div>
    )
  }

  const feedbackTitles = feedbackTitlesData?.data?.feedbackTitles || []

  return (
    <>
      <div className="rounded-xl border-0 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-b border-gray-100">
              <TableHead className="font-semibold text-gray-700 py-4">Title</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Type</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Created</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4 w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbackTitles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No feedback titles</h3>
                      <p className="text-gray-500">Get started by creating your first feedback title.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              feedbackTitles.map((title) => (
                <TableRow key={title._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                        <MessageSquare className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[300px]">{title.title}</p>
                        <p className="text-sm text-gray-500">ID: {title._id.slice(-8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge 
                      variant={title.status === 'Active' ? 'default' : 'secondary'}
                      className={`flex items-center space-x-1 w-fit ${
                        title.status === 'Active' 
                          ? 'bg-success-100 text-success-800 border-success-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {title.status === 'Active' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{title.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {title.major ? (
                      <Badge variant="outline" className="flex items-center space-x-1 w-fit bg-warning-50 text-warning-700 border-warning-200">
                        <Star className="w-3 h-3" />
                        <span>Major</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Regular</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(title.createdAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/feedback/titles/${title._id}/edit`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Title
                          </Link>
                        </DropdownMenuItem>
                        {!title.major && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(title._id, title.status)}
                              className="cursor-pointer"
                            >
                              {title.status === 'Active' ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(title._id)}
                              className="text-destructive cursor-pointer focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the feedback title.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusId} onOpenChange={() => setStatusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status to {newStatus}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
