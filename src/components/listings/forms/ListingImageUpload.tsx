import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, Star, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_MAX_IMAGES = 5;
const PREMIUM_MAX_IMAGES = 10;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

interface ListingImageUploadProps {
  images: File[];
  setImages: (images: File[]) => void;
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  titleImageIndex: number;
  setTitleImageIndex: (index: number) => void;
  isPremium?: boolean;
}

interface SortableImageProps {
  url: string;
  index: number;
  titleImageIndex: number;
  setTitleImageIndex: (index: number) => void;
  removeImage: (index: number) => void;
}

function SortableImage({ url, index, titleImageIndex, setTitleImageIndex, removeImage }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="relative">
        <img
          src={url}
          alt={`Preview ${index + 1}`}
          className={cn(
            "w-full h-40 object-cover rounded-lg",
            titleImageIndex === index && "ring-2 ring-primary"
          )}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={() => setTitleImageIndex(index)}
            className={cn(
              "bg-white/90 text-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
              titleImageIndex === index && "opacity-100 text-primary"
            )}
            title="Als Titelbild festlegen"
          >
            <Star className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => removeImage(index)}
            className="bg-destructive text-destructive-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Bild entfernen"
          >
            ×
          </button>
        </div>
        {titleImageIndex === index && (
          <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            Titelbild
          </span>
        )}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          title="Zum Verschieben ziehen"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function ListingImageUpload({
  images,
  setImages,
  imageUrls,
  setImageUrls,
  titleImageIndex,
  setTitleImageIndex,
  isPremium = false
}: ListingImageUploadProps) {
  const { toast } = useToast();
  const maxImages = isPremium ? PREMIUM_MAX_IMAGES : DEFAULT_MAX_IMAGES;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter out files that exceed size limit
    const validFiles = acceptedFiles.filter(
      (file) => file.size <= MAX_FILE_SIZE
    );

    // Check if any files were rejected due to size
    if (validFiles.length < acceptedFiles.length) {
      toast({
        title: 'Zu große Dateien',
        description: 'Einige Bilder wurden nicht hinzugefügt, da sie größer als 3MB sind',
        variant: 'destructive',
      });
    }

    // Check if adding these files would exceed the maximum
    if (validFiles.length + images.length > maxImages) {
      toast({
        title: 'Zu viele Bilder',
        description: `Sie können maximal ${maxImages} Bilder hochladen`,
        variant: 'destructive',
      });
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);
    
    // Create preview URLs
    const urls = validFiles.map((file) => URL.createObjectURL(file));
    setImageUrls((prev) => [...prev, ...urls]);
  }, [images, toast, setImages, setImageUrls]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = imageUrls.indexOf(active.id);
      const newIndex = imageUrls.indexOf(over.id);

      setImages((items) => arrayMove(items, oldIndex, newIndex));
      setImageUrls((items) => arrayMove(items, oldIndex, newIndex));

      // Update title image index if necessary
      if (titleImageIndex === oldIndex) {
        setTitleImageIndex(newIndex);
      } else if (
        titleImageIndex > oldIndex && 
        titleImageIndex <= newIndex
      ) {
        setTitleImageIndex(titleImageIndex - 1);
      } else if (
        titleImageIndex < oldIndex && 
        titleImageIndex >= newIndex
      ) {
        setTitleImageIndex(titleImageIndex + 1);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    if (titleImageIndex === index) {
      setTitleImageIndex(0);
    } else if (titleImageIndex > index) {
      setTitleImageIndex(titleImageIndex - 1);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: MAX_FILE_SIZE
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Ziehe Bilder hierher oder klicke zum Auswählen (max. {maxImages} Bilder)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max. {maxImages} Bilder, je max. 3MB (JPG, PNG, WebP)
          {!isPremium && (
            <span className="block mt-1 text-primary">
              Premium-Nutzer können bis zu 10 Bilder hochladen!
            </span>
          )}
        </p>
      </div>

      {imageUrls.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={imageUrls}
            strategy={horizontalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {imageUrls.map((url, index) => (
                <SortableImage
                  key={url}
                  url={url}
                  index={index}
                  titleImageIndex={titleImageIndex}
                  setTitleImageIndex={setTitleImageIndex}
                  removeImage={removeImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}