'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

/**
 * Define preset crop dimensions for social media, documents, and other standard formats.
 * Presets include optimized dimensions for various platforms and use cases.
 * @author PNV Development Team
 */
type PresetCategory = 'Social Media' | 'Documents' | 'Print' | 'Devices' | 'E-commerce';

interface CropPreset {
  name: string;
  width: number;
  height: number;
  category: PresetCategory;
  aspectRatio: number;
  description?: string; // Optional description for the preset
}

const CROP_PRESETS: CropPreset[] = [
  // Social Media Presets
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'Social Media', aspectRatio: 1, description: 'Square format for feed posts' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'Social Media', aspectRatio: 9/16, description: 'Vertical format for stories' },
  { name: 'Instagram Reel', width: 1080, height: 1920, category: 'Social Media', aspectRatio: 9/16, description: 'Full-screen vertical videos' },
  { name: 'Instagram Profile', width: 320, height: 320, category: 'Social Media', aspectRatio: 1, description: 'Profile picture' },
  { name: 'Facebook Post', width: 1200, height: 630, category: 'Social Media', aspectRatio: 1200/630, description: 'Landscape format for feed' },
  { name: 'Facebook Cover', width: 1640, height: 624, category: 'Social Media', aspectRatio: 1640/624, description: 'Page cover photo' },
  { name: 'Facebook Profile', width: 500, height: 500, category: 'Social Media', aspectRatio: 1, description: 'Profile picture' },
  { name: 'X/Twitter Post', width: 1600, height: 900, category: 'Social Media', aspectRatio: 16/9, description: 'Standard tweet image' },
  { name: 'X/Twitter Header', width: 1500, height: 500, category: 'Social Media', aspectRatio: 3/1, description: 'Profile header image' },
  { name: 'X/Twitter Profile', width: 400, height: 400, category: 'Social Media', aspectRatio: 1, description: 'Profile picture' },
  { name: 'LinkedIn Post', width: 1200, height: 627, category: 'Social Media', aspectRatio: 1200/627, description: 'Standard post image' },
  { name: 'LinkedIn Cover', width: 1584, height: 396, category: 'Social Media', aspectRatio: 1584/396, description: 'Profile cover image' },
  { name: 'LinkedIn Profile', width: 400, height: 400, category: 'Social Media', aspectRatio: 1, description: 'Profile picture' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Social Media', aspectRatio: 16/9, description: 'Video thumbnail' },
  { name: 'YouTube Banner', width: 2560, height: 1440, category: 'Social Media', aspectRatio: 16/9, description: 'Channel banner' },
  { name: 'Pinterest Pin', width: 1000, height: 1500, category: 'Social Media', aspectRatio: 2/3, description: 'Vertical pin format' },
  { name: 'TikTok Video', width: 1080, height: 1920, category: 'Social Media', aspectRatio: 9/16, description: 'Full-screen vertical video' },
  { name: 'Snapchat Story', width: 1080, height: 1920, category: 'Social Media', aspectRatio: 9/16, description: 'Vertical story format' },
  
  // Document Presets
  { name: 'ID Photo', width: 413, height: 531, category: 'Documents', aspectRatio: 413/531, description: 'Standard ID dimensions' },
  { name: 'Passport Photo', width: 35, height: 45, category: 'Documents', aspectRatio: 35/45, description: 'International standard (mm)' },
  { name: 'Visa Photo', width: 51, height: 51, category: 'Documents', aspectRatio: 1, description: 'Square format (mm)' },
  { name: 'Resume Photo', width: 200, height: 200, category: 'Documents', aspectRatio: 1, description: 'Professional headshot' },
  { name: 'Business Card', width: 1050, height: 600, category: 'Documents', aspectRatio: 1050/600, description: 'Standard size (3.5×2 inches)' },
  { name: 'US Letter', width: 816, height: 1056, category: 'Documents', aspectRatio: 8.5/11, description: 'US standard page' },
  { name: 'A4 Paper', width: 794, height: 1123, category: 'Documents', aspectRatio: 210/297, description: 'International standard page' },
  
  // Print Presets
  { name: '4×6 Print', width: 1200, height: 1800, category: 'Print', aspectRatio: 2/3, description: 'Standard photo print' },
  { name: '5×7 Print', width: 1500, height: 2100, category: 'Print', aspectRatio: 5/7, description: 'Medium photo print' },
  { name: '8×10 Print', width: 2400, height: 3000, category: 'Print', aspectRatio: 4/5, description: 'Large photo print' },
  { name: '11×14 Print', width: 3300, height: 4200, category: 'Print', aspectRatio: 11/14, description: 'Poster size print' },
  { name: '16×20 Print', width: 4800, height: 6000, category: 'Print', aspectRatio: 4/5, description: 'Large poster print' },
  { name: 'Wallet Print', width: 1050, height: 1350, category: 'Print', aspectRatio: 7/9, description: 'Small wallet-sized print' },
  
  // Device Screen Presets
  { name: 'Smartphone', width: 1080, height: 1920, category: 'Devices', aspectRatio: 9/16, description: 'Common mobile screen' },
  { name: 'Tablet', width: 1620, height: 2160, category: 'Devices', aspectRatio: 3/4, description: 'Common tablet screen' },
  { name: 'Desktop Wallpaper', width: 1920, height: 1080, category: 'Devices', aspectRatio: 16/9, description: 'FHD monitor resolution' },
  { name: '4K Wallpaper', width: 3840, height: 2160, category: 'Devices', aspectRatio: 16/9, description: 'UHD monitor resolution' },
  { name: 'MacBook Pro', width: 1440, height: 900, category: 'Devices', aspectRatio: 16/10, description: 'Standard display resolution' },
  { name: 'iPhone Wallpaper', width: 1290, height: 2796, category: 'Devices', aspectRatio: 1290/2796, description: 'iPhone 15 Pro Max' },
  
  // E-commerce Presets
  { name: 'Product Image', width: 2000, height: 2000, category: 'E-commerce', aspectRatio: 1, description: 'Square product photo' },
  { name: 'Amazon Product', width: 2000, height: 2000, category: 'E-commerce', aspectRatio: 1, description: 'Main product image' },
  { name: 'eBay Product', width: 1600, height: 1600, category: 'E-commerce', aspectRatio: 1, description: 'Recommended size' },
  { name: 'Etsy Product', width: 2000, height: 1600, category: 'E-commerce', aspectRatio: 5/4, description: 'Landscape format' },
  { name: 'Shopify Product', width: 2048, height: 2048, category: 'E-commerce', aspectRatio: 1, description: 'High-res product image' },
  { name: 'Banner Ad', width: 728, height: 90, category: 'E-commerce', aspectRatio: 728/90, description: 'Standard leaderboard ad' },
];

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
): Crop {
  if (!aspect) {
    // For free aspect ratio, use full image dimensions
    return {
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    } as Crop;
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function ImageCropper() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Helper functions for EXIF data handling
  const extractExifData = (base64Data: string): ArrayBuffer | null => {
    try {
      // Convert base64 to binary
      const binary = atob(base64Data);
      const data = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        data[i] = binary.charCodeAt(i);
      }
      
      // Check for EXIF marker (FF E1)
      for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 0xFF && data[i + 1] === 0xE1) {
          // Get EXIF segment length (includes the length bytes)
          const segmentLength = (data[i + 2] << 8) + data[i + 3];
          
          // Extract EXIF segment (including marker and length)
          const exifSegment = data.slice(i, i + 2 + segmentLength);
          return exifSegment.buffer;
        }
      }
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
    }
    return null;
  };
  
  const insertExifData = (imageBase64: string, exifData: ArrayBuffer): string => {
    try {
      // Convert base64 to binary
      const binary = atob(imageBase64);
      const imageData = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        imageData[i] = binary.charCodeAt(i);
      }
        // Find the position after SOI marker (FF D8)
      const insertPosition = 2; // Default to just after SOI
      
      // Create a new array with the EXIF data inserted
      const exifUint8 = new Uint8Array(exifData);
      const result = new Uint8Array(imageData.length + exifUint8.length);
      
      // Copy SOI marker
      result.set(imageData.slice(0, insertPosition), 0);
      
      // Insert EXIF data
      result.set(exifUint8, insertPosition);
      
      // Copy the rest of the image
      result.set(imageData.slice(insertPosition), insertPosition + exifUint8.length);
      
      // Convert back to base64
      let resultStr = '';
      for (let i = 0; i < result.length; i++) {
        resultStr += String.fromCharCode(result[i]);
      }
      return btoa(resultStr);
    } catch (error) {
      console.error('Error inserting EXIF data:', error);
      return imageBase64; // Return original if there's an error
    }
  };
  
  const [crop, setCrop] = useState<Crop>();  // Remove initial state to let it be set on image load
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [outputQuality, setOutputQuality] = useState(0.92);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // Image adjustment controls
  const [brightness, setBrightness] = useState(100); // 100% is normal
  const [contrast, setContrast] = useState(100);     // 100% is normal
  const [saturation, setSaturation] = useState(100); // 100% is normal
  const [showAdjustments, setShowAdjustments] = useState(false);
  
  // Preset dimensions state
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [presetCategory, setPresetCategory] = useState<PresetCategory | 'All'>('Social Media');
  const [showPresets, setShowPresets] = useState(false);
  const [showPresetInfo, setShowPresetInfo] = useState(false);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // EXIF data preservation
  const [preserveExif, setPreserveExif] = useState(false);
  
  // Instagram-like filter presets
  const filters = {
    normal: { 
      name: 'Normal', 
      style: {}, 
      adjustments: { brightness: 100, contrast: 100, saturation: 100 } 
    },
    clarendon: { 
      name: 'Clarendon', 
      style: { filter: 'contrast(1.2) saturate(1.35)' },
      adjustments: { brightness: 105, contrast: 120, saturation: 135 } 
    },
    gingham: { 
      name: 'Gingham', 
      style: { filter: 'brightness(1.05) hue-rotate(-10deg)' },
      adjustments: { brightness: 105, contrast: 90, saturation: 85 } 
    },
    moon: { 
      name: 'Moon', 
      style: { filter: 'grayscale(1) contrast(1.1) brightness(1.1)' },
      adjustments: { brightness: 110, contrast: 110, saturation: 0 } 
    },
    lark: { 
      name: 'Lark', 
      style: { filter: 'contrast(0.9) brightness(1.1) saturate(1.1)' },
      adjustments: { brightness: 110, contrast: 90, saturation: 110 } 
    },
    reyes: { 
      name: 'Reyes', 
      style: { filter: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
      adjustments: { brightness: 110, contrast: 85, saturation: 75 } 
    },
    juno: { 
      name: 'Juno', 
      style: { filter: 'saturate(1.4) contrast(1.1)' },
      adjustments: { brightness: 100, contrast: 110, saturation: 140 } 
    },
    slumber: { 
      name: 'Slumber', 
      style: { filter: 'saturate(0.66) brightness(1.05)' },
      adjustments: { brightness: 105, contrast: 100, saturation: 66 } 
    },
    crema: { 
      name: 'Crema', 
      style: { filter: 'sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)' },
      adjustments: { brightness: 115, contrast: 125, saturation: 90 } 
    },
    valencia: { 
      name: 'Valencia', 
      style: { filter: 'contrast(1.08) brightness(1.08) sepia(0.08)' },
      adjustments: { brightness: 108, contrast: 108, saturation: 108 } 
    },
    sierra: { 
      name: 'Sierra', 
      style: { filter: 'contrast(0.95) brightness(0.9)' },
      adjustments: { brightness: 90, contrast: 95, saturation: 100 } 
    },
  };
  
  // Multiple output options
  const [outputOptions, setOutputOptions] = useState<{
    id: string;
    enabled: boolean;
    format: 'jpeg' | 'png' | 'webp';
    quality: number;
    scale: number;
    label: string;
  }[]>([
    {
      id: '1',
      enabled: true,
      format: 'jpeg',
      quality: 0.92,
      scale: 1,
      label: 'Original Size'
    }
  ]);
  const [showMultipleOptions, setShowMultipleOptions] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        setPreviewSrc(null); // Reset preview when changing image
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    
    // Set initial crop to encompass the entire image
    const initialCrop: Crop = {
      unit: 'px',
      x: 0,
      y: 0,
      width: width,
      height: height
    };
    
    setCrop(initialCrop);
  };  // Helper function to create a cropped image canvas
  const createCroppedCanvas = useCallback((
    scale: number = 1,
  ): HTMLCanvasElement | null => {
    if (!imgRef.current || !crop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Get the actual pixel dimensions
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    // Apply zoom factor to scaling calculations
    const zoomScaleX = scaleX / zoom;
    const zoomScaleY = scaleY / zoom;
    
    // Set canvas size to match the crop dimensions with optional scaling
    const baseWidth = crop.unit === '%' 
      ? Math.floor((crop.width / 100) * imgRef.current.naturalWidth)
      : Math.floor(crop.width * zoomScaleX);
    const baseHeight = crop.unit === '%'
      ? Math.floor((crop.height / 100) * imgRef.current.naturalHeight)
      : Math.floor(crop.height * zoomScaleY);
    
    // Apply output scaling
    canvas.width = Math.floor(baseWidth * scale);
    canvas.height = Math.floor(baseHeight * scale);

    ctx.imageSmoothingQuality = 'high';
    ctx.imageSmoothingEnabled = true;

    // Calculate crop coordinates adjusted for zoom
    const cropX = crop.unit === '%'
      ? (crop.x / 100) * imgRef.current.naturalWidth
      : crop.x * zoomScaleX;
    const cropY = crop.unit === '%'
      ? (crop.y / 100) * imgRef.current.naturalHeight
      : crop.y * zoomScaleY;

    const rotRad = (rotation * Math.PI) / 180;

    ctx.save();

    // Apply flips first
    ctx.translate(flipHorizontal ? canvas.width : 0, flipVertical ? canvas.height : 0);
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
    
    // Then apply rotation around the center of the (possibly flipped) canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw the cropped image with scaling
    ctx.drawImage(
      imgRef.current,
      cropX,
      cropY,
      baseWidth / scale,
      baseHeight / scale,
      0,
      0,
      canvas.width,
      canvas.height
    );    // Apply image adjustments (brightness, contrast, saturation)
    if (brightness !== 100 || contrast !== 100 || saturation !== 100 || activeFilter) {
      // Get the image data to apply adjustments
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Get filter adjustments if a filter is active
      let brightnessValue = brightness / 100;
      let contrastValue = contrast / 100;
      let saturationValue = saturation / 100;
      
      // Apply filter adjustments if a filter is selected
      if (activeFilter && filters[activeFilter as keyof typeof filters]) {
        const filterAdjustments = filters[activeFilter as keyof typeof filters].adjustments;
        brightnessValue = (filterAdjustments.brightness / 100) * brightnessValue;
        contrastValue = (filterAdjustments.contrast / 100) * contrastValue;
        saturationValue = (filterAdjustments.saturation / 100) * saturationValue;
      }

      // Apply adjustments to each pixel
      for (let i = 0; i < data.length; i += 4) {
        // Apply brightness
        if (brightness !== 100) {
          data[i] = Math.min(255, Math.max(0, data[i] * brightnessValue));     // R
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessValue)); // G
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessValue)); // B
        }

        // Apply contrast
        if (contrast !== 100) {
          const factor = (259 * (contrastValue * 255 + 255)) / (255 * (259 - contrastValue * 255));
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
        }

        // Apply saturation
        if (saturation !== 100) {
          const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2]; // Weighted grayscale conversion
          data[i] = Math.min(255, Math.max(0, gray + saturationValue * (data[i] - gray)));
          data[i + 1] = Math.min(255, Math.max(0, gray + saturationValue * (data[i + 1] - gray)));
          data[i + 2] = Math.min(255, Math.max(0, gray + saturationValue * (data[i + 2] - gray)));
        }
      }

      // Put the modified image data back on the canvas
      ctx.putImageData(imageData, 0, 0);
    }
  ctx.restore();
    return canvas;
  }, [imgRef, crop, rotation, flipHorizontal, flipVertical, brightness, contrast, saturation, zoom, activeFilter, filters]);
  // Function to download a single cropped image
  const downloadCroppedImage = (
    format: 'jpeg' | 'png' | 'webp' = 'jpeg',
    quality: number = 0.92,
    scale: number = 1,
    customFilename?: string
  ) => {
    const canvas = createCroppedCanvas(scale);
    if (!canvas) return;

    const link = document.createElement('a');
    const filename = customFilename || `cropped-image-${scale.toFixed(1)}x.${format}`;
    link.download = filename;
    
    // Handle EXIF data
    if (preserveExif && imageSrc && imageSrc.startsWith('data:image/')) {
      try {
        // Create a new image with the same dimensions as the canvas
        const img = new Image();
        img.src = imageSrc;
        
        // Create a temporary canvas to combine the cropped image with EXIF data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          // Draw the cropped image on the temporary canvas
          tempCtx.drawImage(canvas, 0, 0);
          
          // Get the cropped image data without EXIF
          const croppedImageData = tempCanvas.toDataURL(`image/${format}`, quality);
          
          // Extract base64 part of data URL
          const base64Data = croppedImageData.split(',')[1];
          
          // Extract EXIF data from original image
          const originalBase64 = imageSrc.split(',')[1];
          const exifData = extractExifData(originalBase64);
          
          // If EXIF data exists and format supports it (JPEG)
          if (exifData && format === 'jpeg') {
            // Combine EXIF data with cropped image
            const imageWithExif = insertExifData(base64Data, exifData);
            link.href = `data:image/jpeg;base64,${imageWithExif}`;
          } else {
            // Just use the regular data URL if no EXIF or format doesn't support it
            link.href = croppedImageData;
          }
        }
      } catch (error) {
        console.error('Error preserving EXIF data:', error);
        // Fallback to standard method without EXIF
        link.href = canvas.toDataURL(`image/${format}`, quality);
      }
    } else {
      // Standard method without preserving EXIF
      link.href = canvas.toDataURL(`image/${format}`, quality);
    }
    
    link.click();
  };

  // Function to handle single download (original behavior)
  const handleSingleDownload = () => {
    downloadCroppedImage(outputFormat, outputQuality, 1);
  };

  // Function to handle multiple downloads
  const handleMultipleDownloads = () => {
    // Filter only enabled output options
    const enabledOptions = outputOptions.filter(option => option.enabled);
    
    if (enabledOptions.length === 0) {
      // If no options are enabled, download with default settings
      handleSingleDownload();
      return;
    }
    
    // Download each enabled version
    enabledOptions.forEach((option, index) => {
      // Small delay between downloads to prevent browser blocking
      setTimeout(() => {
        const filename = `cropped-image-${option.label.toLowerCase().replace(/\s+/g, '-')}.${option.format}`;
        downloadCroppedImage(option.format, option.quality, option.scale, filename);
      }, index * 100);
    });
  };

  // Main download handler
  const handleDownload = () => {
    if (showMultipleOptions) {
      handleMultipleDownloads();
    } else {
      handleSingleDownload();
    }
  };

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newAspect = value === 'free' ? undefined : Number(value);
    setAspect(newAspect);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, newAspect);
      setCrop(newCrop);
    }
    
    // Clear any selected preset when manually changing aspect ratio
    setSelectedPreset(null);
  };
  /**
   * Applies a preset crop dimension to the current image.
   * Centers the crop with the specified aspect ratio from the preset.
   * 
   * @param presetName - The name of the preset to apply
   * @return void
   */
  const applyPreset = (presetName: string) => {
    if (!imgRef.current) return;
    
    const preset = CROP_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    
    // Set the aspect ratio based on the preset
    setAspect(preset.aspectRatio);
    
    // Apply the crop with the new aspect ratio
    const { width, height } = imgRef.current;
    const newCrop = centerAspectCrop(width, height, preset.aspectRatio);
    setCrop(newCrop);
    
    // Update selected preset
    setSelectedPreset(presetName);
    
    // Generate a new preview with the updated crop
    generatePreview();
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImageSrc(reader.result?.toString() || null);
          setPreviewSrc(null); // Reset preview when changing image
        });
        reader.readAsDataURL(file);
      }
    }
  }, []);  // Function to generate preview image
  const generatePreview = useCallback(() => {
    if (!showPreview) {
      setPreviewSrc(null);
      return;
    }

    const canvas = createCroppedCanvas(1);
    if (!canvas) {
      setPreviewSrc(null);
      return;
    }

    // Generate preview URL
    setPreviewSrc(canvas.toDataURL(`image/${outputFormat}`, outputQuality));
  }, [showPreview, createCroppedCanvas, outputFormat, outputQuality]);
  // Update preview when crop or image transformations change
  useEffect(() => {    generatePreview();
  }, [generatePreview, crop, rotation, zoom, flipHorizontal, flipVertical, brightness, contrast, saturation, outputFormat, outputQuality, activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Cropper</h1>
          <p className="text-gray-600">Upload, crop, and convert your images with precision</p>
        </div>

        <Card className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            {!imageSrc ? (
              <div 
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed 
                  ${isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  } rounded-lg transition-colors`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <label className="w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="hidden"
                  />
                  <div className="text-center">
                    <div className={`mx-auto h-12 w-12 mb-4 transition-colors
                      ${isDragging ? 'text-primary' : 'text-gray-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div className={`flex flex-col items-center text-sm
                      ${isDragging ? 'text-primary' : 'text-gray-600'}`}>
                      <span className="font-medium">Drop your image here</span>
                      <span>or click to upload</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (max 10MB)</span>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-6">                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">Aspect Ratio:</label>
                    <select
                      value={aspect?.toString() || 'free'}
                      onChange={handleAspectRatioChange}
                      className="min-w-[120px] rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="free">Free Selection</option>
                      <option value="1">Square (1:1)</option>
                      <option value="1.7777777777777777">Landscape (16:9)</option>
                      <option value="0.5625">Portrait (9:16)</option>
                      <option value="1.3333333333333333">Standard (4:3)</option>
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPresets(prev => !prev)}
                      className="text-sm"
                    >
                      {showPresets ? 'Hide Presets' : 'Show Presets'}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(prev => !prev)}
                      className="text-sm"
                    >
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImageSrc(null);
                        setPreviewSrc(null);
                        setCrop({
                          unit: '%',
                          x: 0,
                          y: 0,
                          width: 100,
                          height: 100
                        } as Crop);
                        setSelectedPreset(null);
                      }}
                      className="text-sm"
                    >
                      Change Image
                    </Button>
                  </div>
                </div>                {/* Preset Crop Dimensions */}
                {showPresets && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="mb-3">
                      <div className="flex flex-wrap justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-700 mb-2 md:mb-0">Preset Dimensions</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            key="All"
                            variant={presetCategory === 'All' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPresetCategory('All')}
                            className="text-xs"
                          >
                            All
                          </Button>
                          {(['Social Media', 'Documents', 'Print', 'Devices', 'E-commerce'] as const).map(category => (
                            <Button
                              key={category}
                              variant={presetCategory === category ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPresetCategory(category)}
                              className="text-xs"
                            >
                              {category}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPresetInfo(prev => !prev)}
                            className="text-xs"
                          >
                            {showPresetInfo ? 'Hide Info' : 'Show Info'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                        {CROP_PRESETS
                          .filter(preset => presetCategory === 'All' || preset.category === presetCategory)
                          .map(preset => (
                            <Button
                              key={preset.name}
                              variant={selectedPreset === preset.name ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => applyPreset(preset.name)}
                              className="text-xs justify-start overflow-hidden"
                              title={showPresetInfo ? `${preset.width}×${preset.height} - ${preset.description || ''}` : undefined}
                            >
                              <div className="truncate flex items-center w-full">
                                <span className="truncate">{preset.name}</span>
                                {showPresetInfo && (
                                  <span className="text-xs opacity-70 ml-1 truncate">
                                    ({preset.width}×{preset.height})
                                  </span>
                                )}
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                    
                    {selectedPreset && (
                      <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 mt-2">
                        <div className="font-medium">Applied preset: {selectedPreset}</div>
                        {(() => {
                          const preset = CROP_PRESETS.find(p => p.name === selectedPreset);
                          return preset ? (
                            <div className="mt-1">
                              <div>Dimensions: {preset.width}×{preset.height} pixels</div>
                              <div>Aspect Ratio: {preset.aspectRatio.toFixed(3)}</div>
                              {preset.description && <div>Description: {preset.description}</div>}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative w-full bg-black/5 rounded-lg overflow-hidden">
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      aspect={aspect}
                      className="max-h-[600px]"
                    >
                      <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imageSrc}
                        onLoad={onImageLoad}                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
                          maxWidth: '100%',
                          maxHeight: '600px',
                          ...(activeFilter && activeFilter !== 'normal' ? filters[activeFilter as keyof typeof filters].style : {})
                        }}
                        className="mx-auto"
                      />
                    </ReactCrop>
                  </div>                  {/* Preview Section */}
                  {showPreview && previewSrc && (
                    <div className="relative w-full bg-black/5 rounded-lg overflow-hidden flex flex-col">
                      <div className="absolute top-2 left-2 z-10">
                        <span className="text-xs font-medium bg-black/70 text-white px-2 py-1 rounded">Preview</span>
                      </div>
                      <div className="flex items-center justify-center h-full">
                        <div className="relative p-4">                          <img 
                            src={previewSrc} 
                            alt="Preview" 
                            className="max-w-full max-h-[300px] rounded shadow-sm"
                            style={activeFilter && activeFilter !== 'normal' ? filters[activeFilter as keyof typeof filters].style : undefined}
                          /><div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {outputFormat.toUpperCase()} • {Math.round(outputQuality * 100)}%
                            {selectedPreset && (() => {
                              const preset = CROP_PRESETS.find(p => p.name === selectedPreset);
                              return preset ? ` • ${preset.width}×${preset.height}` : '';
                            })()}
                            {(brightness !== 100 || contrast !== 100 || saturation !== 100) && (
                              <span className="ml-1">
                                • Adjusted
                              </span>
                            )}
                            {activeFilter && activeFilter !== 'normal' && (
                              <span className="ml-1">
                                • Filter: {filters[activeFilter as keyof typeof filters].name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button variant="outline" onClick={() => setFlipHorizontal(prev => !prev)}>
                    Flip Horizontal {flipHorizontal && "(On)"}
                  </Button>
                  <Button variant="outline" onClick={() => setFlipVertical(prev => !prev)}>
                    Flip Vertical {flipVertical && "(On)"}
                  </Button>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Image Adjustments</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdjustments(prev => !prev)}
                      className="text-xs"
                    >
                      {showAdjustments ? 'Hide Adjustments' : 'Show Adjustments'}
                    </Button>
                  </div>
                  
                  {showAdjustments && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Brightness
                          </label>
                          <span className="text-xs text-gray-600">{brightness}%</span>
                        </div>
                        <Slider
                          value={[brightness]}
                          onValueChange={(value) => setBrightness(value[0])}
                          min={0}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Contrast
                          </label>
                          <span className="text-xs text-gray-600">{contrast}%</span>
                        </div>
                        <Slider
                          value={[contrast]}
                          onValueChange={(value) => setContrast(value[0])}
                          min={0}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Saturation
                          </label>
                          <span className="text-xs text-gray-600">{saturation}%</span>
                        </div>
                        <Slider
                          value={[saturation]}
                          onValueChange={(value) => setSaturation(value[0])}
                          min={0}
                          max={200}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBrightness(100);
                            setContrast(100);
                            setSaturation(100);
                          }}
                          className="text-xs"
                        >
                          Reset to Default
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instagram-like Filters */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(prev => !prev)}
                      className="text-xs"
                    >
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                  </div>
                  
                  {showFilters && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="overflow-x-auto pb-2">
                        <div className="flex space-x-4">
                          {Object.entries(filters).map(([id, filter]) => (
                            <div 
                              key={id} 
                              className={`flex flex-col items-center cursor-pointer transition-all ${
                                activeFilter === id ? 'scale-105 ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
                              }`}
                              onClick={() => setActiveFilter(id === 'normal' && activeFilter === 'normal' ? null : id)}
                            >                              <div 
                                className="w-20 h-20 mb-1 rounded-md overflow-hidden bg-gray-200 border border-gray-300 relative"
                              >
                                {imageSrc && (
                                  <div 
                                    className="absolute inset-0"
                                    style={{ 
                                      backgroundImage: `url(${imageSrc})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      ...filter.style
                                    }}
                                  ></div>
                                )}
                              </div>
                              <span className="text-xs font-medium">{filter.name}</span>
                              {activeFilter === id && <div className="mt-1 w-3 h-1 bg-primary rounded-full"></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {activeFilter && activeFilter !== 'normal' && (
                        <div className="mt-4 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setActiveFilter('normal')}
                            className="text-xs"
                          >
                            Reset Filter
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Rotation</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[rotation]}
                        onValueChange={(value) => setRotation(value[0])}
                        min={0}
                        max={360}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12 text-right">{rotation}°</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Zoom</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[zoom]}
                        onValueChange={(value) => setZoom(value[0])}
                        min={0.5}
                        max={3}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12 text-right">{zoom.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
                
                {/* Format, Quality, and Download Section */}
                <div className="grid gap-6 md:grid-cols-2 items-start">
                  {/* Column 1: Format and (conditional) Quality Slider */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                        <select
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
                          className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                          disabled={showMultipleOptions}
                        >
                          <option value="jpeg">JPEG</option>
                          <option value="png">PNG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </div>
                      <div className="pt-6">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowMultipleOptions(prev => !prev)}
                          className="text-xs whitespace-nowrap"
                        >
                          {showMultipleOptions ? 'Single Output' : 'Multiple Outputs'}
                        </Button>
                      </div>
                    </div>

                    {!showMultipleOptions && (outputFormat === 'jpeg' || outputFormat === 'webp') && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Quality ({Math.round(outputQuality * 100)}%)
                        </label>
                        <Slider
                          value={[outputQuality]}
                          onValueChange={(value) => setOutputQuality(value[0])}
                          min={0.1}
                          max={1}
                          step={0.01}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* EXIF Metadata Preservation */}
                    <div className="mt-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="preserve-exif"
                          checked={preserveExif}
                          onChange={() => setPreserveExif(prev => !prev)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="preserve-exif" className="ml-2 block text-sm text-gray-700">
                          Preserve EXIF metadata
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {preserveExif 
                          ? "EXIF data like camera settings and location will be preserved in the output image (JPEG format only)"
                          : "EXIF metadata will be stripped from the output image"}
                      </p>
                    </div>

                    {/* Multiple Output Options */}
                    {showMultipleOptions && (
                      <div className="mt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-gray-700">Output Versions</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Create a new unique ID
                              const newId = String(Date.now());
                              
                              // Add a new output option
                              setOutputOptions(prev => [
                                ...prev, 
                                {
                                  id: newId,
                                  enabled: true,
                                  format: 'jpeg',
                                  quality: 0.92,
                                  scale: 1,
                                  label: `Version ${prev.length + 1}`
                                }
                              ]);
                            }}
                            className="text-xs"
                          >
                            Add Version
                          </Button>
                        </div>
                        
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {outputOptions.map((option, index) => (
                            <div key={option.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    id={`enable-${option.id}`}
                                    checked={option.enabled}
                                    onChange={() => {
                                      const updatedOptions = [...outputOptions];
                                      updatedOptions[index].enabled = !option.enabled;
                                      setOutputOptions(updatedOptions);
                                    }}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <div className="relative">
                                    <input 
                                      type="text"
                                      value={option.label}
                                      onChange={(e) => {
                                        const updatedOptions = [...outputOptions];
                                        updatedOptions[index].label = e.target.value;
                                        setOutputOptions(updatedOptions);
                                      }}
                                      className="rounded-md border border-gray-300 py-1 px-2 text-sm w-full focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                  </div>
                                </div>
                                
                                {/* Only show delete button if there's more than one option */}
                                {outputOptions.length > 1 && (
                                  <button 
                                    onClick={() => {
                                      // Remove this option
                                      setOutputOptions(prev => prev.filter(item => item.id !== option.id));
                                    }}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                    aria-label="Remove output version"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
                                  <select
                                    value={option.format}
                                    onChange={(e) => {
                                      const updatedOptions = [...outputOptions];
                                      updatedOptions[index].format = e.target.value as 'jpeg' | 'png' | 'webp';
                                      setOutputOptions(updatedOptions);
                                    }}
                                    className="w-full rounded-md border border-gray-300 py-1 px-2 text-xs focus:ring-2 focus:ring-primary focus:border-primary"
                                  >
                                    <option value="jpeg">JPEG</option>
                                    <option value="png">PNG</option>
                                    <option value="webp">WebP</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Scale</label>
                                  <select
                                    value={option.scale}
                                    onChange={(e) => {
                                      const updatedOptions = [...outputOptions];
                                      updatedOptions[index].scale = Number(e.target.value);
                                      setOutputOptions(updatedOptions);
                                    }}
                                    className="w-full rounded-md border border-gray-300 py-1 px-2 text-xs focus:ring-2 focus:ring-primary focus:border-primary"
                                  >
                                    <option value="0.25">0.25x</option>
                                    <option value="0.5">0.5x</option>
                                    <option value="1">1x (Original)</option>
                                    <option value="1.5">1.5x</option>
                                    <option value="2">2x</option>
                                  </select>
                                </div>
                              </div>
                              
                              {(option.format === 'jpeg' || option.format === 'webp') && (
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-gray-600">
                                    Quality ({Math.round(option.quality * 100)}%)
                                  </label>
                                  <Slider
                                    value={[option.quality]}
                                    onValueChange={(value) => {
                                      const updatedOptions = [...outputOptions];
                                      updatedOptions[index].quality = value[0];
                                      setOutputOptions(updatedOptions);
                                    }}
                                    min={0.1}
                                    max={1}
                                    step={0.01}
                                    className="w-full"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Download Button */}
                  <div className="flex items-end h-full">
                    <Button 
                      onClick={handleDownload}
                      className="w-full min-w-[140px] mt-auto" // mt-auto for vertical alignment
                    >
                      {showMultipleOptions 
                        ? `Download ${outputOptions.filter(o => o.enabled).length} Versions`
                        : 'Download'
                      }
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-2">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
