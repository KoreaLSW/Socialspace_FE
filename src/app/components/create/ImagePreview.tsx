import { X } from "lucide-react";

interface ImagePreviewProps {
  imagePreview: string[];
  removeImage: (index: number) => void;
}

export default function ImagePreview({
  imagePreview,
  removeImage,
}: ImagePreviewProps) {
  if (imagePreview.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {imagePreview.map((preview, index) => (
          <div key={index} className="relative">
            <img
              src={preview}
              alt={`미리보기 ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
