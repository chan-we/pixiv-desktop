interface SimpleImageProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Simple image display that fits the image to container without zoom.
 * Used for viewing full images without the overhead of zoom controls.
 */
export function SimpleImage({ src, alt = 'illustration', className = '' }: SimpleImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`max-w-full max-h-full object-contain ${className}`}
    />
  );
}