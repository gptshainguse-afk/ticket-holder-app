import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Upload, Trash2, Scissors, Move, ZoomIn, FileText, Layers, Printer, Check, ArrowDown, Sparkles, Image as ImageIcon } from 'lucide-react';

// 注意：在標準 npm 開發環境中，您可以使用 npm install jspdf 並取消下行註解
// import { jsPDF } from 'jspdf';

// 定義統一的位移靈敏度
const OFFSET_SENSITIVITY = 20; 

// --- 1. 控制列元件 ---
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
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all slider-thumb slider-runnable-track"
      />
    </div>
  );
});

// --- 2. 圖片編輯卡片 ---
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

// --- 3. 主應用程式 ---
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

  // 尺寸定義 (單位: cm)
  const DIMS = {
    width: 21,
    backHeight: 7.8,
    frontHeight: 7.3, 
    pocketHeight: 3,
    buttonTab: { w: 1, h: 0.5, tipW: 0.6 }, // 梯形扣子: 底部1cm, 頂部0.6cm, 高0.5cm
    innerTotalHeight: 15.1,
    glueTab: { w: 1, h: 3 },
    hole: { w: 0.8, h: 0.3, margin: 0.5 } // 修正扣孔: 0.8 x 0.3 cm
  };

  const PREVIEW_PIXELS_PER_CM = 40; 
  const PRINT_PIXELS_PER_CM = 118.11; // 300 DPI

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

  // 繪製：外層 (Page 1)
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

    const drawSectionImage = (imgData, rectX, rectY, rectW, rectH, rotate, customPath) => {
        ctx.save();
        ctx.beginPath();
        if (customPath) {
            customPath(ctx); // 使用自訂路徑 (包含梯形扣子)
        } else {
            ctx.rect(rectX, rectY, rectW, rectH);
        }
        ctx.clip();
        
        // 計算旋轉中心 (如果是自訂路徑，通常是正面，中心為 rect 的中心)
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
            ctx.fillStyle = rotate ? '#fff1f2' : '#eff6ff';
            if(rotate && rectY > height/2) ctx.fillStyle = '#f0fdf4';
            
            // 填充背景時要覆蓋整個可能區域
            const bigSize = Math.max(rectW, rectH) * 2;
            ctx.fillRect(-bigSize/2, -bigSize/2, bigSize, bigSize);
            
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${cm(0.4)}px sans-serif`;
            ctx.fillText(rotate ? '需旋轉' : '正面/背面', 0, 0);
        }
        ctx.restore();
    };

    // 1. 正面 (包含梯形扣子)
    const frontH = cm(DIMS.frontHeight);
    
    // 定義正面含扣子的裁切路徑 (重點：扣子部分現在也包含在剪裁範圍內)
    const frontPath = (context) => {
        const tabBaseW = cm(DIMS.buttonTab.w);
        const tabTipW = cm(DIMS.buttonTab.tipW);
        const tabH = cm(DIMS.buttonTab.h);
        
        // 從左上角開始 (正面主體左上角)
        context.moveTo(0, startY);
        
        // 走到扣子左基座
        context.lineTo(centerX - tabBaseW/2, startY);
        // 走到扣子左頂端 (梯形)
        context.lineTo(centerX - tabTipW/2, 0);
        // 走到扣子右頂端
        context.lineTo(centerX + tabTipW/2, 0);
        // 走到扣子右基座
        context.lineTo(centerX + tabBaseW/2, startY);
        
        // 走到右上角
        context.lineTo(contentW, startY);
        // 走到右下角
        context.lineTo(contentW, startY + frontH);
        // 走到左下角
        context.lineTo(0, startY + frontH);
        context.closePath();
    };

    // 這裡將正面圖案繪製在包含扣子的路徑中 -> 扣子會顯示圖案
    drawSectionImage(images.front, 0, startY, contentW, frontH, true, frontPath);

    // 2. 背面
    const backY = startY + frontH;
    const backH = cm(DIMS.backHeight);
    drawSectionImage(images.back, 0, backY, contentW, backH, false);

    // 3. 夾層
    const pocketY = backY + backH;
    const pocketH = cm(DIMS.pocketHeight);
    drawSectionImage(images.pocket, 0, pocketY, contentW, pocketH, true);

    // 繪製耳朵 (背面兩側)
    const drawEar = (x, y, isLeft) => {
        ctx.save();
        ctx.fillStyle = '#f1f5f9';
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

    // 繪製扣子輪廓線 (因為現在扣子是圖片的一部分，我們只畫外框加強視覺)
    const tabBaseW = cm(DIMS.buttonTab.w);
    const tabTipW = cm(DIMS.buttonTab.tipW);
    
    ctx.save();
    ctx.strokeStyle = '#334155'; // 與主框線同色
    ctx.lineWidth = cm(0.06);
    ctx.beginPath();
    // 只畫梯形的三邊，底部不畫(因為連接本體)
    ctx.moveTo(centerX - tabBaseW/2, startY);
    ctx.lineTo(centerX - tabTipW/2, 0);
    ctx.lineTo(centerX + tabTipW/2, 0);
    ctx.lineTo(centerX + tabBaseW/2, startY);
    ctx.stroke();
    ctx.restore();

    // 扣孔 (0.8 x 0.3)
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

    // 折線
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

    // 外框線 (正面+背面+夾層 的矩形外框)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = cm(0.06);
    ctx.beginPath();
    // 左邊界
    ctx.moveTo(0, startY);
    ctx.lineTo(0, height); // 直到底部 (包含 pocket)
    // 底部邊界
    ctx.lineTo(contentW, height);
    // 右邊界
    ctx.lineTo(contentW, startY);
    // 頂部邊界 (除去扣子部分)
    ctx.moveTo(0, startY);
    ctx.lineTo(centerX - tabBaseW/2, startY); // 左頂
    ctx.moveTo(centerX + tabBaseW/2, startY); // 右頂
    ctx.lineTo(contentW, startY);
    ctx.stroke();
    
    ctx.restore();

  }, [images, DIMS]);

  // 繪製：內層 (Page 2) - 修正：增加扣子
  const drawInnerLayer = useCallback((ctx, width, height, scaleFactor) => {
    const cm = (val) => val * scaleFactor;
    const offsetMultiplier = scaleFactor / OFFSET_SENSITIVITY;

    const contentW = cm(DIMS.width);
    const bodyH = cm(DIMS.innerTotalHeight);
    const tabH = cm(DIMS.buttonTab.h);
    const tabBaseW = cm(DIMS.buttonTab.w);
    const tabTipW = cm(DIMS.buttonTab.tipW);

    // 內層總高度 = 本體高 + 扣子高
    const totalH = bodyH + tabH;
    const startX = (width - contentW) / 2;
    // Y 起點要預留扣子的高度 (讓扣子在最上方)
    const startY = (height - totalH) / 2 + tabH; 

    const centerX = contentW / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(startX, startY); // 移動原點到本體左上角

    // 定義內層含扣子的路徑
    const innerPath = (context) => {
        context.moveTo(0, 0); // 本體左上
        
        // 上方扣子 (梯形) - 注意這裡是往上畫 (Y 負值)
        context.lineTo(centerX - tabBaseW / 2, 0);
        context.lineTo(centerX - tabTipW / 2, -tabH);
        context.lineTo(centerX + tabTipW / 2, -tabH);
        context.lineTo(centerX + tabBaseW / 2, 0);
        
        context.lineTo(contentW, 0); // 本體右上
        context.lineTo(contentW, bodyH); // 本體右下
        context.lineTo(0, bodyH); // 本體左下
        context.closePath();
    };

    // 1. 裁剪圖片區域 (含扣子)
    ctx.save();
    ctx.beginPath();
    innerPath(ctx);
    ctx.clip();

    if (images.inner && images.inner.src) {
        const img = images.inner.src;
        // 圖片中心點：本體中心
        const areaCenterX = contentW / 2;
        const areaCenterY = bodyH / 2;
        
        const scaleW = contentW / img.width;
        const scaleH = bodyH / img.height;
        const baseScale = Math.max(scaleW, scaleH);
        const finalScale = images.inner.scale * baseScale;
        const drawW = img.width * finalScale;
        const drawH = img.height * finalScale;
        const offsetX = images.inner.x * offsetMultiplier;
        const offsetY = images.inner.y * offsetMultiplier;

        ctx.translate(areaCenterX, areaCenterY);
        ctx.drawImage(img, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH);
    } else {
        ctx.fillStyle = '#f8fafc';
        // 填充足夠大的區域
        const big = Math.max(contentW, totalH) * 2;
        ctx.fillRect(-big/2, -big/2, big, big);
        
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(contentW / 2, bodyH / 2);
        ctx.font = `bold ${cm(0.4)}px sans-serif`;
        ctx.fillText('內層圖 (含扣子)', 0, 0);
    }
    ctx.restore();

    // 2. 繪製外框線
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = cm(0.06);
    ctx.beginPath();
    innerPath(ctx);
    ctx.stroke();

    ctx.restore();

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
    // 內層高度需增加扣子高度
    const contentH_cm = DIMS.innerTotalHeight + DIMS.buttonTab.h + 1;
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
        // 內層總高度 = 本體 + 扣子
        const contentH_cm = DIMS.innerTotalHeight + DIMS.buttonTab.h;
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
            // ibon 模式：使用簡單的上下對位邏輯
            // 外層 PDF 上邊界 = outerTopMargin
            // 內層翻轉後，扣子在下方，我們希望扣子底部對齊外層的扣子頂部位置
            // 因為是長邊翻頁，這其實就是將圖片置底於 `pageHeight - outerTopMargin`
            finalImageY = pageHeight - outerTopMargin - pdfTotalH;
            
            // 偏移校正 (User Feedback)
            finalImageY = finalImageY - 1; // 上移 1mm
            x = x + 2; // 右移 2mm
        } else {
            // 單面列印：垂直置中 (這裡為了美觀，可以稍微對齊外層的身體部分)
            // 外層 body 其實是從 Margin + Tab 開始的
            const bodyInImageOffsetY = (pdfTotalH - (DIMS.innerTotalHeight * 10)) / 2;
            // 讓內層的本體上緣對齊外層的本體上緣
            const targetBodyY = outerTopMargin + (DIMS.buttonTab.h * 10);
            // 由於現在內層也有 Tab，內層圖片頂端就是 Tab 頂端
            // 所以直接對齊外層頂端即可 (都是 Tab 頂端)
            finalImageY = outerTopMargin;
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
    <div className="min-h-screen font-sans text-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
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
                    >
                        <FileText size={20} /> 
                        <span>下載完整 PDF</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

            <div className={`
                bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center transition-all duration-500
                ${isIbonMode ? 'ring-2 ring-indigo-500/30 shadow-indigo-100' : ''}
            `}>
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">2</span>
                        頁面 2：內層 (襯紙+扣子)
                    </h3>
                    {isIbonMode ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            <ArrowDown size={14} />
                            已偏移校正
                        </span>
                    ) : (
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">21 x 15.6 cm</span>
                    )}
                </div>
                <div className="w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 flex justify-center overflow-auto relative">
                    <canvas ref={innerCanvasRef} className="bg-white shadow-lg max-w-full h-auto rounded-sm" style={{ maxHeight: '500px' }} />
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
