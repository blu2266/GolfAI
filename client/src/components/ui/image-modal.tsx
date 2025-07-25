import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}

export function ImageModal({ isOpen, onClose, src, alt }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <div className="relative w-full h-full">
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}