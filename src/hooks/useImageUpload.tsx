import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useImageUpload = () => {
  const { user } = useAuth();

  const uploadImages = async (base64Images: string[]): Promise<string[]> => {
    if (!user) throw new Error("Must be logged in to upload images");
    
    const uploadedUrls: string[] = [];

    for (const base64 of base64Images) {
      try {
        // Extract the base64 data and mime type
        const matches = base64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
          console.error("Invalid base64 format");
          continue;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const extension = mimeType.split("/")[1] || "jpg";
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        // Generate unique filename
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        // Upload to storage
        const { data, error } = await supabase.storage
          .from("request-images")
          .upload(fileName, blob, {
            contentType: mimeType,
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("request-images")
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    return uploadedUrls;
  };

  return { uploadImages };
};
