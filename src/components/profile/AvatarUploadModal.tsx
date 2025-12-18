import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCroppedImage, validateImageFile } from "@/lib/imageUtils";
import { Upload, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

interface AvatarUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: Blob) => Promise<void>;
}

export function AvatarUploadModal({
  open,
  onClose,
  onUpload,
}: AvatarUploadModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
      await onUpload(croppedBlob);
      toast.success("Foto de perfil atualizada com sucesso!");
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload da foto");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alterar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Selecione uma imagem e ajuste o enquadramento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!imageSrc ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG ou WEBP até 2MB
                  </p>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <>
              <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-gray-500" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <ZoomIn className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-xs text-center text-gray-500">
                  Arraste para posicionar, use o controle para zoom
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          {imageSrc && (
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Enviando..." : "Aplicar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

