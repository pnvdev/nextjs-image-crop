'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

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

    // Set canvas size to match the crop dimensions with optional scaling
    const baseWidth = crop.unit === '%' 
      ? Math.floor((crop.width / 100) * imgRef.current.naturalWidth)
      : Math.floor(crop.width * scaleX);
    const baseHeight = crop.unit === '%'
      ? Math.floor((crop.height / 100) * imgRef.current.naturalHeight)
      : Math.floor(crop.height * scaleY);
    
    // Apply output scaling
    canvas.width = Math.floor(baseWidth * scale);
    canvas.height = Math.floor(baseHeight * scale);

    ctx.imageSmoothingQuality = 'high';
    ctx.imageSmoothingEnabled = true;

    // Calculate crop coordinates
    const cropX = crop.unit === '%'
      ? (crop.x / 100) * imgRef.current.naturalWidth
      : crop.x * scaleX;
    const cropY = crop.unit === '%'
      ? (crop.y / 100) * imgRef.current.naturalHeight
      : crop.y * scaleY;

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
    );

    ctx.restore();
    return canvas;
  }, [imgRef, crop, rotation, flipHorizontal, flipVertical]);

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
    
    // Pass quality for JPEG and WebP. It's ignored for PNG.
    link.href = canvas.toDataURL(`image/${format}`, quality);
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
  useEffect(() => {
    generatePreview();
  }, [generatePreview, crop, rotation, zoom, flipHorizontal, flipVertical, outputFormat, outputQuality]);

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
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
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
                      }}
                      className="text-sm"
                    >
                      Change Image
                    </Button>
                  </div>
                </div>

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
                        onLoad={onImageLoad}
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
                          maxWidth: '100%',
                          maxHeight: '600px',
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
                        <div className="relative p-4">
                          <img 
                            src={previewSrc} 
                            alt="Preview" 
                            className="max-w-full max-h-[300px] rounded shadow-sm"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {outputFormat.toUpperCase()} • {Math.round(outputQuality * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button variant="outline" onClick={() => setFlipHorizontal(prev => !prev)}>
                    Flip Horizontal {flipHorizontal && "(On)"}
                  </Button>
                  <Button variant="outline" onClick={() => setFlipVertical(prev => !prev)}>
                    Flip Vertical {flipVertical && "(On)"}
                  </Button>
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
