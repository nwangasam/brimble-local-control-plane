import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createGitDeployment, createUploadDeployment, deploymentKeys, type Deployment } from "@/api"

type CreateDeploymentInput =
  | { sourceMode: "git"; gitUrl: string }
  | { sourceMode: "upload"; file: File | null }

export function useCreateDeploymentMutation(options: {
  onCreated?: (deploymentId: string) => void
  onUploadSettled?: () => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateDeploymentInput) => {
      if (input.sourceMode === "git") {
        return createGitDeployment(input.gitUrl)
      }

      if (!input.file) {
        throw new Error("Choose a .zip file to upload.")
      }

      return createUploadDeployment(input.file)
    },
    onSuccess: (result, input) => {
      queryClient.setQueryData<Deployment[] | undefined>(deploymentKeys.all, (current) =>
        [result.deployment, ...(current ?? [])].sort((left, right) =>
          right.createdAt.localeCompare(left.createdAt)
        )
      )
      options.onCreated?.(result.deployment.id)

      if (input.sourceMode === "upload") {
        options.onUploadSettled?.()
      }

      void queryClient.invalidateQueries({ queryKey: deploymentKeys.all })
    },
  })
}
