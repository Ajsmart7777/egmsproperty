import { useRef, useState } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  compact?: boolean;
  className?: string;
}

const ImageUpload = ({
  images,
  onImagesChange,
  maxImages = 5,
  compact = false,
  className,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles = Array.from(files)
      .filter((file) => {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          toast.error(`${file.name} is not a valid image or video`);
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          return false;
        }
        return true;
      })
      .slice(0, remainingSlots);

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImagesChange([...images, result]);
      };
      reader.readAsDataURL(file);
    });

    toast.success(
      `${validFiles.length} ${validFiles.length === 1 ? "file" : "files"} added`
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    inputRef.current?.click();
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={triggerFileSelect}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand-primary"
        >
          <Camera className="h-5 w-5" />
        </button>
        {images.length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"
              >
                <img
                  src={img}
                  alt={`Attachment ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-4 transition-colors",
          isDragging
            ? "border-primary bg-brand-light"
            : "border-border bg-card"
        )}
      >
        <button
          type="button"
          onClick={triggerFileSelect}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand-primary"
        >
          <Camera className="h-5 w-5" />
          Add photo or video
        </button>

        {images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative h-20 w-20 overflow-hidden rounded-lg shadow-soft"
              >
                <img
                  src={img}
                  alt={`Attachment ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Drag and drop files here, or click to browse
          </p>
        )}

        {images.length > 0 && images.length < maxImages && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {maxImages - images.length} more {maxImages - images.length === 1 ? "file" : "files"} allowed
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
