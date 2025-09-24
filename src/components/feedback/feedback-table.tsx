"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { feedbackApi, Feedback } from "@/lib/api/feedback"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Eye, Trash2, MessageCircle, Clock, CheckCircle } from "lucide-react"

export function FeedbackTable() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const queryClient = useQueryClient()

  // Fetch feedback
  const { data: feedbackData, isLoading, error } = useQuery({
    queryKey: ['feedback'],
    queryFn: feedbackApi.getAll,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: feedbackApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
      toast.success("Feedback deleted successfully")
      setDeleteId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // View feedback mutation (marks as read)
  const viewMutation = useMutation({
    mutationFn: feedbackApi.getById,
    onSuccess: (data) => {
      setSelectedFeedback(data.data.feedback)
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleView = (id: string) => {
    viewMutation.mutate(id)
    setViewId(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading feedback...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-100 mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-error-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Feedback</h3>
          <p className="text-gray-500">There was an error loading feedback submissions.</p>
        </div>
      </div>
    )
  }

  const feedbacks = feedbackData?.data?.feedbacks || []

  return (
    <>
      <div className="rounded-xl border-0 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-b border-gray-100">
              <TableHead className="font-semibold text-gray-700 py-4">Title</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Read By</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Submitted</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4 w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No feedback submissions</h3>
                      <p className="text-gray-500">Client feedback will appear here when submitted.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              feedbacks.map((feedback) => (
                <TableRow key={feedback._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        feedback.read_status ? 'bg-success-100' : 'bg-warning-100'
                      }`}>
                        <MessageCircle className={`h-5 w-5 ${
                          feedback.read_status ? 'text-success-600' : 'text-warning-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{feedback.title}</p>
                        <p className="text-sm text-gray-500">ID: {feedback._id.slice(-8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge 
                      variant={feedback.read_status ? 'default' : 'secondary'}
                      className={`flex items-center space-x-1 w-fit ${
                        feedback.read_status 
                          ? 'bg-success-100 text-success-800 border-success-200' 
                          : 'bg-warning-100 text-warning-800 border-warning-200'
                      }`}
                    >
                      {feedback.read_status ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{feedback.read_status ? 'Read' : 'Unread'}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {feedback.read_status ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-600">
                            {feedback.first_read_by?.charAt(0)?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{feedback.first_read_by}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(feedback._id)}
                        className="h-8 w-8 p-0 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(feedback._id)}
                        className="h-8 w-8 p-0 hover:bg-destructive-100 hover:text-destructive-600 transition-colors"
                        title="Delete Feedback"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Feedback Dialog */}
      <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
        <DialogContent className="max-w-3xl bg-white border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="flex items-center space-x-3 text-xl font-semibold text-gray-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <MessageCircle className="h-5 w-5 text-primary-600" />
              </div>
              <span>Feedback Details</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Client feedback submission details and information
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-6 py-4">
              {/* Title Section */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Title</label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-base font-medium text-gray-900">{selectedFeedback.title}</p>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Content</label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[120px]">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedFeedback.content}</p>
                </div>
              </div>

              {/* Status and Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status</label>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={selectedFeedback.read_status ? 'default' : 'secondary'}
                      className={`flex items-center space-x-1 w-fit ${
                        selectedFeedback.read_status 
                          ? 'bg-success-100 text-success-800 border-success-200' 
                          : 'bg-warning-100 text-warning-800 border-warning-200'
                      }`}
                    >
                      {selectedFeedback.read_status ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{selectedFeedback.read_status ? 'Read' : 'Unread'}</span>
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Read By</label>
                  <div className="flex items-center space-x-2">
                    {selectedFeedback.read_status ? (
                      <>
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-600">
                            {selectedFeedback.first_read_by?.charAt(0)?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{selectedFeedback.first_read_by}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Not read yet</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Submitted</label>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(selectedFeedback.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Last Updated</label>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(selectedFeedback.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-0 shadow-2xl">
          <AlertDialogHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive-100">
                <Trash2 className="h-5 w-5 text-destructive-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold text-gray-900">Delete Feedback</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 mt-1">
                  This action cannot be undone. This will permanently delete the feedback submission.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex space-x-3">
            <AlertDialogCancel className="px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-6"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
