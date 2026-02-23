/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Type, 
  Move, 
  Palette, 
  Maximize, 
  Trash2, 
  Image as ImageIcon,
  Settings2,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Position = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'custom';

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [text, setText] = useState('水印文字');
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [customX, setCustomX] = useState(50);
  const [customY, setCustomY] = useState(50);
  const [rotation, setRotation] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to get coordinates relative to canvas
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Calculate scale factor between canvas internal size and display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!image) return;
    setIsDragging(true);
    setPosition('custom');
    handleMove(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !image || !canvasRef.current) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    // Convert to percentage
    const pX = Math.max(0, Math.min(100, (x / canvasRef.current.width) * 100));
    const pY = Math.max(0, Math.min(100, (y / canvasRef.current.height) * 100));
    
    setCustomX(pX);
    setCustomY(pY);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw background image
    ctx.drawImage(image, 0, 0);

    // Configure text style
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate position
    let x = 0;
    let y = 0;
    const padding = fontSize;

    switch (position) {
      case 'top-left':
        x = padding + ctx.measureText(text).width / 2;
        y = padding;
        ctx.textAlign = 'left';
        break;
      case 'top-center':
        x = canvas.width / 2;
        y = padding;
        break;
      case 'top-right':
        x = canvas.width - padding - ctx.measureText(text).width / 2;
        y = padding;
        ctx.textAlign = 'right';
        break;
      case 'center':
        x = canvas.width / 2;
        y = canvas.height / 2;
        break;
      case 'bottom-left':
        x = padding + ctx.measureText(text).width / 2;
        y = canvas.height - padding;
        ctx.textAlign = 'left';
        break;
      case 'bottom-center':
        x = canvas.width / 2;
        y = canvas.height - padding;
        break;
      case 'bottom-right':
        x = canvas.width - padding - ctx.measureText(text).width / 2;
        y = canvas.height - padding;
        ctx.textAlign = 'right';
        break;
      case 'custom':
        x = (customX / 100) * canvas.width;
        y = (customY / 100) * canvas.height;
        break;
    }

    // Apply rotation
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [image, text, fontSize, color, opacity, position, customX, customY, rotation]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = '带水印的图片.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const reset = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 bg-white border-r border-black/5 flex flex-col h-screen overflow-y-auto z-10 shadow-sm">
        <div className="p-6 border-b border-black/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <ImageIcon className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight">浅香水印</h1>
            <p className="text-xs text-black/40 font-medium uppercase tracking-wider">专业版</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Text Input */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-black/60">
              <Type size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">内容</span>
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入水印文字..."
              className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl border-none focus:ring-2 focus:ring-black/5 outline-none text-sm transition-all"
            />
          </section>

          {/* Styling */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-black/60">
              <Settings2 size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">样式</span>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-black/40 uppercase">
                  <span>大小</span>
                  <span>{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-black/40 uppercase">
                  <span>不透明度</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-black/40 uppercase">
                  <span>旋转角度</span>
                  <span>{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-black"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-black/40 uppercase">颜色</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-none cursor-pointer overflow-hidden"
                  />
                  <span className="text-xs font-mono text-black/60">{color.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Position */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-black/60">
              <LayoutGrid size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">位置</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`h-10 rounded-lg border flex items-center justify-center transition-all ${
                    position === pos 
                    ? 'bg-black border-black text-white shadow-lg shadow-black/20' 
                    : 'bg-white border-black/10 text-black/40 hover:border-black/30'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full bg-current ${pos === 'center' ? 'scale-150' : ''}`} />
                </button>
              ))}
              <button
                onClick={() => setPosition('custom')}
                className={`col-span-2 h-10 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                  position === 'custom' 
                  ? 'bg-black border-black text-white shadow-lg shadow-black/20' 
                  : 'bg-white border-black/10 text-black/40 hover:border-black/30'
                }`}
              >
                自定义坐标
              </button>
            </div>

            {position === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-black/40 uppercase">
                    <span>横向位置 (X)</span>
                    <span>{customX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customX}
                    onChange={(e) => setCustomX(parseInt(e.target.value))}
                    className="w-full accent-black"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-black/40 uppercase">
                    <span>纵向位置 (Y)</span>
                    <span>{customY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customY}
                    onChange={(e) => setCustomY(parseInt(e.target.value))}
                    className="w-full accent-black"
                  />
                </div>
              </motion.div>
            )}
          </section>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto p-6 border-t border-black/5 space-y-3 bg-white/80 backdrop-blur-md sticky bottom-0">
          {image && (
            <button
              onClick={downloadImage}
              className="w-full bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-black/90 transition-all active:scale-[0.98] shadow-xl shadow-black/10"
            >
              <Download size={18} />
              下载结果
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              image 
              ? 'bg-black/5 text-black hover:bg-black/10' 
              : 'bg-black text-white hover:bg-black/90 shadow-xl shadow-black/10'
            }`}
          >
            <Upload size={18} />
            {image ? '更换图片' : '选择图片'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          {image && (
            <button
              onClick={reset}
              className="w-full py-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
            >
              移除图片
            </button>
          )}
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 relative flex items-center justify-center p-8 md:p-12 bg-[#F5F5F7]">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6 max-w-md"
            >
              <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl shadow-black/5 flex items-center justify-center mx-auto mb-8">
                <ImageIcon size={40} className="text-black/20" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">准备好添加水印了吗？</h2>
              <p className="text-black/40 text-lg font-medium leading-relaxed">
                上传照片，开始添加您的专业签名。
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-semibold hover:bg-black/90 transition-all shadow-xl shadow-black/10"
              >
                立即开始
                <ChevronRight size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div className={`relative max-w-full max-h-full shadow-2xl rounded-2xl overflow-hidden bg-white border border-black/5 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                  className="max-w-full max-h-[70vh] object-contain block touch-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Info */}
        {image && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-black/5 shadow-xl flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-black/60 uppercase tracking-widest">实时预览</span>
            </div>
            <div className="w-px h-4 bg-black/10" />
            <span className="text-xs font-medium text-black/40">
              {image.width} × {image.height} px
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
