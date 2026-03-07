import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface ImageViewerProps {
  src: string;
  alt?: string;
}

export function ImageViewer({ src, alt = 'illustration' }: ImageViewerProps) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.5}
      maxScale={5}
      wheel={{ step: 0.1 }}
      doubleClick={{ mode: 'toggle', step: 2 }}
      centerOnInit
    >
      <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </TransformComponent>
    </TransformWrapper>
  );
}
