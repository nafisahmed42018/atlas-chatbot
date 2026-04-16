"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@workspace/ui/components/dropzone";
import { AlertTriangleIcon } from "lucide-react";
import { api } from "@workspace/backend/_generated/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["application/pdf", "text/csv", "text/plain"];
const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".txt"];

const formSchema = z.object({
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category must be 50 characters or less")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Category can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  filename: z
    .string()
    .max(100, "Filename must be 100 characters or less")
    .refine(
      (val) => !val || !/[/\\<>:"|?*\x00-\x1f]/.test(val),
      "Filename contains invalid characters"
    )
    .refine(
      (val) => !val || !val.includes(".."),
      "Filename contains invalid characters"
    )
    .optional(),
});

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUploaded?: () => void;
}

export const UploadDialog = ({
  open,
  onOpenChange,
  onFileUploaded,
}: UploadDialogProps) => {
  const addFile = useAction(api.private.files.addFile);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { category: "", filename: "" },
  });

  const handleFileDrop = (acceptedFiles: File[]) => {
    setFileError(null);
    const file = acceptedFiles[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError(`File type not allowed. Only ${ALLOWED_EXTENSIONS.join(", ")} are accepted.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File must be 10 MB or smaller.");
      return;
    }

    if (file.size === 0) {
      setFileError("File is empty.");
      return;
    }

    setUploadedFiles([file]);
    if (!form.getValues("filename")) {
      form.setValue("filename", file.name, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitError(null);

    const blob = uploadedFiles[0];
    if (!blob) {
      setFileError("Please select a file.");
      return;
    }

    try {
      const filename = values.filename?.trim() || blob.name;

      await addFile({
        bytes: await blob.arrayBuffer(),
        filename,
        mimeType: blob.type || "text/plain",
        category: values.category,
      });

      onFileUploaded?.();
      handleCancel();
    } catch (error) {
      const data = (error as { data?: { code?: string; message?: string } }).data;
      if (data?.code === "BAD_REQUEST" && data?.message) {
        setSubmitError(data.message);
      } else {
        setSubmitError("Upload failed. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setUploadedFiles([]);
    setFileError(null);
    setSubmitError(null);
    form.reset();
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload documents to your knowledge base for AI-powered search and retrieval.
            Accepted formats: PDF, CSV, TXT — max 10 MB.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Documentation, Support, Product"
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filename"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Filename{" "}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Override default filename"
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1">
              <Dropzone
                accept={{
                  "application/pdf": [".pdf"],
                  "text/csv": [".csv"],
                  "text/plain": [".txt"],
                }}
                disabled={form.formState.isSubmitting}
                maxFiles={1}
                onDrop={handleFileDrop}
                src={uploadedFiles}
              >
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>
              {fileError && (
                <p className="flex items-center gap-x-1.5 text-sm text-destructive">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  {fileError}
                </p>
              )}
            </div>

            {submitError && (
              <div className="flex items-start gap-x-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                disabled={form.formState.isSubmitting}
                onClick={handleCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  uploadedFiles.length === 0 ||
                  form.formState.isSubmitting ||
                  !!fileError
                }
                type="submit"
              >
                {form.formState.isSubmitting ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
