import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Upload, Trash2, Scissors, Info, Move, ZoomIn, FileText, Layers, Printer, Check, ArrowDown, Sparkles, Image as ImageIcon } from 'lucide-react';

// 定義統一的位移靈敏度常數
const OFFSET_SENSITIVITY = 20; 

// --- 1. 控制列元件 (優化樣式) ---
const ControlRow = memo(({ icon, label, val, min, max, step, onChange, isScale }) => {
  const displayValue = isScale ? Math.round(val * 100) : val;
  
  const handleInputChange = (e) => {
      let v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      if (isScale) v = v / 100;
      onChange(v);
  };

  return (
    <div className="group flex flex-col gap-2 pb-2">
      <div className="flex justify-between items-center text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
        <div className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </div>
        <div className="relative">
          <input 
              type="number"
              value={displayValue}
              onChange={handleInputChange}
              className="w-16 px-2 py-1 text-right border border-slate-200 rounded-md bg-slate-50 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-mono text-xs"
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none mr-[-18px]">
            {isScale ? '%' : 'px'}
          </span>
        </div>
      </div>
      <input 
        type="range" min={min} max={max} step={step} 
        value={val}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
      />
    </div>
  );
});

// --- 2. 圖片編輯卡片 (優化樣式) ---
const ImageEditorCard = memo(({ 
  id, label, sub, colorBadge, 
  imageState, 
  widthCm, heightCm, 
  onUpload, onUpdate, onRemove 
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageState?.src) return;

    const ctx = canvas.getContext('2d');
    const PREVIEW_SCALE = 20; 
    const w = widthCm * PREVIEW_SCALE;
    const h = heightCm * PREVIEW_SCALE;

    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.translate(w / 2, h / 2);

    const img = imageState.src;
    const scaleW = w / img.width;
    const scaleH = h / img.height;
    const baseScale = Math.max(scaleW, scaleH);
    
    const finalScale = imageState.scale * baseScale;
    const drawW = img.width * finalScale;
    const drawH = img.height * finalScale;
    
    const offsetMultiplier = PREVIEW_SCALE / OFFSET_SENSITIVITY;
    const offsetX = imageState.x * offsetMultiplier;
    const offsetY = imageState.y * offsetMultiplier;

    ctx.drawImage(img, -drawW/2 + offsetX, -drawH/2 + offsetY, drawW, drawH);
    ctx.restore();

    // 邊框
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);

  }, [imageState, widthCm, heightCm]);

  const handleScaleChange = useCallback((v) => onUpdate(id, 'scale', v), [id, onUpdate]);
  const handleXChange = useCallback((v) => onUpdate(id, 'x', v), [id, onUpdate]);
  const handleYChange = useCallback((v) => onUpdate(id, 'y', v), [id, onUpdate]);
  const handleUploadChange = useCallback((e) => onUpload(e, id), [id, onUpload]);

  const hasImage = !!imageState?.src;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-lg 
      transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
      flex flex-col h-full
      ${hasImage ? 'ring-2 ring-indigo-500/20' : ''}
    `}>
      {/* 頂部裝飾條 */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${colorBadge}`}></div>

      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              {label}
              {hasImage && <Check size={16} className="text-green-500" strokeWidth={3} />}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{sub}</p>
          </div>
          {hasImage && (
            <button 
              onClick={() => onRemove(id)} 
              className="group/btn p-2 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
              title="移除圖片"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* 預覽/上傳區 */}
        <div className={`
          relative w-full rounded-xl overflow-hidden mb-4 flex items-center justify-center 
          transition-all duration-300 min-h-[140px]
          ${hasImage ? 'bg-slate-50 border border-slate-200' : 'bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'}
        `}>
          {imageState?.url ? (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <canvas ref={canvasRef} className="max-w-full max-h-[160px] object-contain shadow-sm rounded bg-white" />
            </div>
          ) : (
            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors gap-3 py-8">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <ImageIcon size={24} />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold block">點擊上傳圖片</span>
                <span className="text-xs opacity-70">支援 JPG, PNG</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadChange} />
            </label>
          )}
        </div>

        {/* 控制面板 */}
        {hasImage && (
          <div className="flex flex-col gap-3 bg-white rounded-xl border border-slate-100 p-3 shadow-inner mt-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ControlRow 
                  icon={<ZoomIn size={14}/>} 
                  label="縮放大小" 
                  val={imageState.scale} 
                  min={0.1} max={3} step={0.01}
                  onChange={handleScaleChange}
                  isScale={true}
              />
              <ControlRow 
                  icon={<Move size={14}/>} 
                  label="水平移動" 
                  val={imageState.x} 
                  min={-400} max={400} step={1}
                  onChange={handleXChange}
              />
              <ControlRow 
                  icon={<Move size={14} className="rotate-90"/>} 
                  label="垂直移動" 
                  val={imageState.y} 
                  min={-400} max={400} step={1}
                  onChange={handleYChange}
              />
          </div>
        )}
      </div>
    </div>
  );
});

const App = () => {
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false);
  const [isIbonMode, setIsIbonMode] = useState(false); 

  useEffect(() => {
    if (window.jspdf) {
      setJsPDFLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      setJsPDFLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  const [images, setImages] = useState({
    back: null,
    front: null,
    pocket: null,
    inner: null,
  });

  const DIMS = {
    width: 21,
    backHeight: 7.8,
    frontHeight: 7.3, 
    pocketHeight: 3,
    buttonTab: { w: 1, h: 0.5 },
    innerTotalHeight: 15.1,
    glueTab: { w: 1, h: 3 },
    hole: { w: 1.3, h: 0.2, margin: 0.5 }
  };

  const PREVIEW_PIXELS_PER_CM = 40; 
  const PRINT_PIXELS_PER_CM = 118.11; 

  const outerCanvasRef = useRef(null);
  const innerCanvasRef = useRef(null);

  const handleImageUpload = useCallback((e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImages(prev => ({ 
            ...prev, 
            [type]: { 
              src: img, 
              url: event.target.result,
              scale: 1, 
              x: 0, 
              y: 0 
            } 
          }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const updateImageSettings = useCallback((type, setting, value) => {
    setImages(prev => ({
      ...prev,
      [type]: { ...prev[type], [setting]: parseFloat(value) }
    }));
  }, []);

  const removeImage = useCallback((type) => {
    setImages(prev => ({ ...prev, [type]: null }));
  }, []);

  const drawOuterLayer = useCallback((ctx, width, height, scaleFactor) => {
    const cm = (val) => val * scaleFactor;
    const offsetMultiplier = scaleFactor / OFFSET_SENSITIVITY;
    const earW = cm(DIMS.glueTab.w);
    const earH = cm(DIMS.glueTab.h);
    const contentW = cm(DIMS.width);
    const startX = (width - contentW) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(startX, 0);

    const startY = cm(DIMS.buttonTab.h);
    const centerX = contentW / 2;

    const drawSectionImage = (imgData, rectX, rectY, rectW, rectH, rotate) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rectX, rectY, rectW, rectH);
        ctx.clip();
        const areaCenterX = rectX + rectW / 2;
        const areaCenterY = rectY + rectH / 2;
        ctx.translate(areaCenterX, areaCenterY);
        if (rotate) ctx.rotate(Math.PI);

        if (imgData && imgData.src) {
            const img = imgData.src;
            const scaleW = rectW / img.width;
            const scaleH = rectH / img.height;
            const baseScale = Math.max(scaleW, scaleH);
            const finalScale = imgData.scale * baseScale;
            const drawW = img.width * finalScale;
            const drawH = img.height * finalScale;
            const offsetX = imgData.x * offsetMultiplier;
            const offsetY = imgData.y * offsetMultiplier;
            ctx.drawImage(img, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH);
        } else {
            ctx.fillStyle = rotate ? '#fff1f2' : '#eff6ff'; // pink-50 : blue-50
            if(rotate && rectY > height/2) ctx.fillStyle = '#f0fdf4'; // green-50
            ctx.fillRect(-rectW/2, -rectH/2, rectW, rectH);
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${cm(0.4)}px sans-serif`;
            ctx.fillText(rotate ? '需旋轉' : '正面/背面', 0, 0);
        }
        ctx.restore();
    };

    const frontH = cm(DIMS.frontHeight);
    drawSectionImage(images.front, 0, startY, contentW, frontH, true);

    const backY = startY + frontH;
    const backH = cm(DIMS.backHeight);
    drawSectionImage(images.back, 0, backY, contentW, backH, false);

    const pocketY = backY + backH;
    const pocketH = cm(DIMS.pocketHeight);
    drawSectionImage(images.pocket, 0, pocketY, contentW, pocketH, true);

    // 耳朵
    const drawEar = (x, y, isLeft) => {
        ctx.save();
        ctx.fillStyle = '#f1f5f9'; // slate-100
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = cm(0.04);
        ctx.beginPath();
        if (isLeft) {
            ctx.moveTo(0, y); 
            ctx.lineTo(-earW, y - 10); 
            ctx.lineTo(-earW, y - earH + 10);
            ctx.lineTo(0, y - earH);
        } else {
            ctx.moveTo(contentW, y);
            ctx.lineTo(contentW + earW, y - 10);
            ctx.lineTo(contentW + earW, y - earH + 10);
            ctx.lineTo(contentW, y - earH);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = `${cm(0.25)}px Arial`;
        ctx.textAlign = 'center';
        if(isLeft) {
            ctx.translate(-earW/2, y - earH/2);
            ctx.rotate(-Math.PI/2);
        } else {
            ctx.translate(contentW + earW/2, y - earH/2);
            ctx.rotate(Math.PI/2);
        }
        ctx.fillText('黏貼處', 0, 0);
        ctx.restore();
    };

    drawEar(0, backY + backH, true);
    drawEar(contentW, backY + backH, false);

    // Button Tab
    const btnW = cm(DIMS.buttonTab.w);
    const btnH = cm(DIMS.buttonTab.h);
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = cm(0.05);
    ctx.beginPath();
    ctx.rect(centerX - btnW/2, 0, btnW, btnH + 2); 
    ctx.fill();
    ctx.strokeRect(centerX - btnW/2, 0, btnW, btnH); 
    ctx.restore();

    // Hole
    const holeW = cm(DIMS.hole.w);
    const holeH = cm(DIMS.hole.h);
    const holeMargin = cm(DIMS.hole.margin);
    const holeY = pocketY + holeMargin; 
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = cm(0.03);
    ctx.beginPath();
    ctx.rect(centerX - holeW/2, holeY - holeH/2, holeW, holeH);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Fold Lines
    ctx.save();
    ctx.setLineDash([cm(0.2), cm(0.2)]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = cm(0.04);
    ctx.beginPath();
    ctx.moveTo(0, backY);
    ctx.lineTo(contentW, backY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pocketY);
    ctx.lineTo(contentW, pocketY);
    ctx.stroke();
    ctx.restore();

    // Main Outline
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = cm(0.06);
    ctx.strokeRect(0, startY, contentW, height - startY);
    ctx.restore();

  }, [images, DIMS]);


  const drawInnerLayer = useCallback((ctx, width, height, scaleFactor) => {
    const cm = (val) => val * scaleFactor;
    const offsetMultiplier = scaleFactor / OFFSET_SENSITIVITY;

    const contentW = cm(DIMS.width);
    const contentH = cm(DIMS.innerTotalHeight);
    const startX = (width - contentW) / 2;
    const startY = (height - contentH) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, startY, contentW, contentH);
    ctx.clip();

    if (images.inner && images.inner.src) {
        const img = images.inner.src;
        const scaleW = contentW / img.width;
        const scaleH = contentH / img.height;
        const baseScale = Math.max(scaleW, scaleH);
        const finalScale = images.inner.scale * baseScale;
        const drawW = img.width * finalScale;
        const drawH = img.height * finalScale;
        
        const offsetX = images.inner.x * offsetMultiplier;
        const offsetY = images.inner.y * offsetMultiplier;

        ctx.translate(startX + contentW/2, startY + contentH/2);
        ctx.drawImage(img, -drawW/2 + offsetX, -drawH/2 + offsetY, drawW, drawH);
    } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(startX, startY, contentW, contentH);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${cm(0.4)}px sans-serif`;
        ctx.fillText('內層圖 (無耳朵)', startX + contentW/2, startY + contentH/2);
    }
    ctx.restore();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = cm(0.06);
    ctx.strokeRect(startX, startY, contentW, contentH);

  }, [images, DIMS]);

  useEffect(() => {
    const canvas = outerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const totalHeightCm = DIMS.frontHeight + DIMS.backHeight + DIMS.pocketHeight + DIMS.buttonTab.h;
    const totalWidthCm = DIMS.width + (DIMS.glueTab.w * 2) + 0.5;
    
    canvas.width = totalWidthCm * PREVIEW_PIXELS_PER_CM;
    canvas.height = totalHeightCm * PREVIEW_PIXELS_PER_CM;
    drawOuterLayer(ctx, canvas.width, canvas.height, PREVIEW_PIXELS_PER_CM);
  }, [images, DIMS, drawOuterLayer]);

  useEffect(() => {
    const canvas = innerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const contentW_cm = DIMS.width + 1;
    const contentH_cm = DIMS.innerTotalHeight + 1;
    canvas.width = contentW_cm * PREVIEW_PIXELS_PER_CM;
    canvas.height = contentH_cm * PREVIEW_PIXELS_PER_CM;
    drawInnerLayer(ctx, canvas.width, canvas.height, PREVIEW_PIXELS_PER_CM);
  }, [images, DIMS, drawInnerLayer]);

  const handleDownloadPDF = async (mode) => {
    if (!window.jspdf) {
      alert("PDF 模組尚未載入完成，請稍候再試。");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const pageWidth = 297; 
    const pageHeight = 210; 
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const outerTotalHeightCm = DIMS.frontHeight + DIMS.backHeight + DIMS.pocketHeight + DIMS.buttonTab.h;
    const outerTotalWidthCm = DIMS.width + (DIMS.glueTab.w * 2); 
    const outerTotalHeightMm = outerTotalHeightCm * 10;
    const outerTopMargin = (pageHeight - outerTotalHeightMm) / 2;

    const processOuter = () => {
        const canvasW = (outerTotalWidthCm + 0.2) * PRINT_PIXELS_PER_CM;
        const canvasH = outerTotalHeightCm * PRINT_PIXELS_PER_CM;
        canvas.width = canvasW;
        canvas.height = canvasH;
        drawOuterLayer(ctx, canvas.width, canvas.height, PRINT_PIXELS_PER_CM);
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfImgWidth = outerTotalWidthCm * 10; 
        const pdfImgHeight = outerTotalHeightCm * 10; 
        const x = (pageWidth - pdfImgWidth) / 2;
        const y = outerTopMargin;
        doc.addImage(imgData, 'JPEG', x, y, pdfImgWidth, pdfImgHeight);
    };

    const processInner = () => {
        const contentW_cm = DIMS.width;
        const contentH_cm = DIMS.innerTotalHeight;
        canvas.width = contentW_cm * PRINT_PIXELS_PER_CM;
        canvas.height = contentH_cm * PRINT_PIXELS_PER_CM;
        
        if (isIbonMode) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }
        drawInnerLayer(ctx, canvas.width, canvas.height, PRINT_PIXELS_PER_CM);
        if (isIbonMode) ctx.restore();
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfTotalW = contentW_cm * 10;
        const pdfTotalH = contentH_cm * 10;
        let finalImageY;
        let x = (pageWidth - pdfTotalW) / 2;

        if (isIbonMode) {
            const p1BlockStartMm = (DIMS.buttonTab.h * 10);
            const p1BlockHeightMm = (DIMS.frontHeight + DIMS.backHeight) * 10;
            const p1BlockCenterRelativeMm = p1BlockStartMm + (p1BlockHeightMm / 2);
            const p1BlockCenterAbsoluteY = outerTopMargin + p1BlockCenterRelativeMm;
            const p2TargetCenterY = pageHeight - p1BlockCenterAbsoluteY;
            const imageContentHeightMm = contentH_cm * 10;
            finalImageY = p2TargetCenterY - (imageContentHeightMm / 2);
            // 校正
            finalImageY = finalImageY - 1;
            x = x + 2;
        } else {
            const bodyInImageOffsetY = (pdfTotalH - (DIMS.innerTotalHeight * 10)) / 2;
            const targetBodyY = outerTopMargin + (DIMS.buttonTab.h * 10);
            finalImageY = targetBodyY - bodyInImageOffsetY;
        }
        doc.addImage(imgData, 'JPEG', x, finalImageY, pdfTotalW, pdfTotalH);
    };

    if (mode === 'combined') {
        processOuter();
        doc.text("Page 1: Outer Layer", 10, 10);
        doc.addPage();
        processInner();
        if (isIbonMode) {
            doc.text("Page 2: Inner Layer (Mirrored & Calibrated for ibon)", 10, 10);
        } else {
            doc.text("Page 2: Inner Layer", 10, 10);
        }
        doc.save('ticket-holder-complete.pdf');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        
        {/* Header */}
        <header className="mb-10 text-center flex flex-col items-center">
          <div className="bg-white p-4 rounded-full shadow-lg mb-4 ring-4 ring-indigo-50">
            <Scissors className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
            演唱會票夾 DIY 專業版
          </h1>
          <p className="text-slate-500 mt-3 font-medium text-lg max-w-2xl">
            打造獨一無二的應援小物 • 即時預覽裁切 • 精準對位輸出
          </p>
        </header>

        {/* 編輯區域 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <ImageEditorCard 
                id="front" 
                label="1. 正面 (頭對頭)" 
                sub="21 x 7.3 cm" 
                colorBadge="from-pink-400 to-rose-400"
                imageState={images.front}
                widthCm={21}
                heightCm={7.3} 
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />

            <ImageEditorCard 
                id="back" 
                label="2. 背面 (主體)" 
                sub="21 x 7.8 cm" 
                colorBadge="from-blue-400 to-cyan-400"
                imageState={images.back}
                widthCm={21}
                heightCm={7.8}
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />

            <ImageEditorCard 
                id="pocket" 
                label="3. 夾層 (底對底)" 
                sub="21 x 3 cm" 
                colorBadge="from-emerald-400 to-teal-400"
                imageState={images.pocket}
                widthCm={21}
                heightCm={3}
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />

            <ImageEditorCard 
                id="inner" 
                label="4. 內層 (襯紙)" 
                sub="21 x 15.1 cm" 
                colorBadge="from-violet-400 to-purple-400"
                imageState={images.inner}
                widthCm={21}
                heightCm={15.1} 
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />
        </div>

        {/* 下載與全域預覽控制列 */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 p-6 md:p-8 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Layers size={24} />
                        </div>
                        輸出設定與下載
                    </h2>
                    <p className="text-slate-500 mt-2 leading-relaxed">
                        我們會生成一份包含兩頁的 A4 PDF 檔案。請根據您的列印需求選擇模式，確保雙面列印時圖案能完美對齊。
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* ibon Toggle */}
                    <div 
                        className={`
                            group flex items-center gap-4 px-5 py-4 rounded-2xl border cursor-pointer transition-all duration-300 w-full sm:w-auto select-none
                            ${isIbonMode 
                                ? 'bg-indigo-50/80 border-indigo-200 shadow-inner ring-1 ring-indigo-200' 
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                        `}
                        onClick={() => setIsIbonMode(!isIbonMode)}
                    >
                        <div className={`
                            w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300
                            ${isIbonMode ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'}
                        `}>
                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isIbonMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`font-bold text-sm flex items-center gap-2 ${isIbonMode ? 'text-indigo-700' : 'text-slate-700'}`}>
                                <Printer size={16} /> ibon 雙面列印校正
                                {isIbonMode && <Sparkles size={14} className="text-amber-500 animate-pulse" />}
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5">
                                {isIbonMode ? '已啟用：自動旋轉 180° + 偏移補償' : '未啟用：標準置中 (適合單面)'}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => handleDownloadPDF('combined')}
                        className={`
                            relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl 
                            font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300
                            active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
                            bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                        `}
                        disabled={!jsPDFLoaded}
                    >
                        {jsPDFLoaded ? (
                            <>
                                <FileText size={20} /> 
                                <span>下載完整 PDF</span>
                            </>
                        ) : (
                            <span>載入中...</span>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* 預覽區塊 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Page 1 */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">1</span>
                        頁面 1：外殼 (背面+耳朵)
                    </h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">23 x 11.8 cm</span>
                </div>
                <div className="w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 flex justify-center overflow-auto">
                    <canvas ref={outerCanvasRef} className="bg-white shadow-lg max-w-full h-auto rounded-sm" style={{ maxHeight: '500px' }} />
                </div>
            </div>

            {/* Page 2 */}
            <div className={`
                bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center transition-all duration-500
                ${isIbonMode ? 'ring-2 ring-indigo-500/30 shadow-indigo-100' : ''}
            `}>
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">2</span>
                        頁面 2：內層 (襯紙)
                    </h3>
                    {isIbonMode ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            <ArrowDown size={14} />
                            已偏移校正
                        </span>
                    ) : (
                         <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">21 x 15.1 cm</span>
                    )}
                </div>
                <div className="w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 flex justify-center overflow-auto relative">
                    <canvas ref={innerCanvasRef} className="bg-white shadow-lg max-w-full h-auto rounded-sm" style={{ maxHeight: '500px' }} />
                    
                    {/* 示意提示 */}
                    {isIbonMode && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-medium">
                                輸出時將自動旋轉 180°
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <footer className="mt-16 text-center pb-8 border-t border-slate-200 pt-8">
            <p className="text-slate-400 text-sm font-medium">
                Designed for DIY Fans • 建議使用 160磅以上紙張列印
            </p>
        </footer>

      </div>
    </div>
  );
};

export default App;