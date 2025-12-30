import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Trash2, Scissors, Info, Move, ZoomIn, FileText, Layers, RefreshCcw } from 'lucide-react';

// --- 子元件：獨立的圖片編輯與即時預覽卡片 ---
const ImageEditorCard = ({ 
  id, label, sub, color, 
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

    canvas.width = w;
    canvas.height = h;

    // 預覽背景改為純白，避免視覺干擾
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
    
    const offsetX = imageState.x * (PREVIEW_SCALE / 1.5); 
    const offsetY = imageState.y * (PREVIEW_SCALE / 1.5);

    ctx.drawImage(img, -drawW/2 + offsetX, -drawH/2 + offsetY, drawW, drawH);
    ctx.restore();

    // 邊框淡一點
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

  }, [imageState, widthCm, heightCm]);

  return (
    <div className={`p-3 rounded-xl shadow-sm border ${color} transition-all hover:shadow-md flex flex-col`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-base text-gray-800">{label}</h3>
          <p className="text-xs text-gray-500 font-mono">{sub}</p>
        </div>
        {imageState?.src && (
          <button onClick={() => onRemove(id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-white rounded-full transition-colors" title="移除圖片">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* 縮減預覽區塊的高度，減少留白 */}
      <div className="relative w-full bg-white rounded-lg overflow-hidden border border-dashed border-gray-300 mb-3 flex items-center justify-center group min-h-[120px]">
        {imageState?.url ? (
          <div className="flex flex-col items-center justify-center w-full h-full p-2">
            <canvas ref={canvasRef} className="max-w-full max-h-[150px] object-contain" />
            <div className="mt-1 text-[10px] text-indigo-400 font-bold flex items-center gap-1 opacity-50">
                <RefreshCcw size={8} /> 即時預覽
            </div>
          </div>
        ) : (
          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors py-6">
            <Upload size={20} className="mb-1" />
            <span className="text-xs font-medium">上傳圖片</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e, id)} />
          </label>
        )}
      </div>

      {imageState?.src && (
        <div className="space-y-2 bg-white/60 p-2 rounded-lg text-xs border border-gray-100 flex-grow backdrop-blur-sm">
          <div className="space-y-0.5">
            <div className="flex justify-between text-gray-500">
                <span className="flex items-center gap-1"><ZoomIn size={10}/> 縮放</span>
                <span>{Math.round(imageState.scale * 100)}%</span>
            </div>
            <input 
              type="range" min="0.5" max="3" step="0.05" 
              value={imageState.scale}
              onChange={(e) => onUpdate(id, 'scale', e.target.value)}
              className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
                <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1"><Move size={10}/> 水平</span>
                    <span>{imageState.x}</span>
                </div>
                <input 
                  type="range" min="-400" max="400" step="5" 
                  value={imageState.x}
                  onChange={(e) => onUpdate(id, 'x', e.target.value)}
                  className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>
            <div className="space-y-0.5">
                <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1"><Move size={10} className="rotate-90"/> 垂直</span>
                    <span>{imageState.y}</span>
                </div>
                <input 
                  type="range" min="-400" max="400" step="5" 
                  value={imageState.y}
                  onChange={(e) => onUpdate(id, 'y', e.target.value)}
                  className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const App = () => {
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false);

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

  // 更新尺寸設定
  const DIMS = {
    width: 21,
    backHeight: 7.8,
    frontHeight: 7.3, 
    pocketHeight: 3,
    buttonTab: { w: 1, h: 0.5 },
    innerTotalHeight: 15.3,
    glueTab: { w: 1, h: 3 },
    hole: { w: 1.3, h: 0.2, margin: 0.5 }
  };

  const PREVIEW_PIXELS_PER_CM = 40; 
  const PRINT_PIXELS_PER_CM = 118.11; 

  const outerCanvasRef = useRef(null);
  const innerCanvasRef = useRef(null);

  const handleImageUpload = (e, type) => {
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
  };

  const updateImageSettings = (type, setting, value) => {
    setImages(prev => ({
      ...prev,
      [type]: { ...prev[type], [setting]: parseFloat(value) }
    }));
  };

  const removeImage = (type) => {
    setImages(prev => ({ ...prev, [type]: null }));
  };

  const drawOuterLayer = useCallback((ctx, width, height, scaleFactor) => {
    const cm = (val) => val * scaleFactor;
    const controlSensitivity = 20; 
    const offsetMultiplier = scaleFactor / (controlSensitivity / 1.5);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const startY = cm(DIMS.buttonTab.h);
    const centerX = width / 2;

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
            
            const direction = rotate ? -1 : 1;
            const offsetX = imgData.x * offsetMultiplier * direction;
            const offsetY = imgData.y * offsetMultiplier * direction;

            ctx.drawImage(img, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH);
        } else {
            ctx.fillStyle = rotate ? '#ffe4e6' : '#e0f2fe';
            if(rotate && rectY > height/2) ctx.fillStyle = '#dcfce7'; 
            ctx.fillRect(-rectW/2, -rectH/2, rectW, rectH);
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${cm(0.4)}px Arial`;
            ctx.fillText(rotate ? '需旋轉 (系統已自動翻轉)' : '正常方向', 0, 0);
        }
        ctx.restore();
    };

    // 1. 正面
    const frontH = cm(DIMS.frontHeight);
    const contentW = cm(DIMS.width);
    drawSectionImage(images.front, 0, startY, contentW, frontH, true);

    // 2. 背面
    const backY = startY + frontH;
    const backH = cm(DIMS.backHeight);
    drawSectionImage(images.back, 0, backY, contentW, backH, false);

    // 3. 夾層
    const pocketY = backY + backH;
    const pocketH = cm(DIMS.pocketHeight);
    drawSectionImage(images.pocket, 0, pocketY, contentW, pocketH, true);

    // --- 線條與標記 ---
    const btnW = cm(DIMS.buttonTab.w);
    const btnH = cm(DIMS.buttonTab.h);
    
    // 扣子凸起
    ctx.save();
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = cm(0.05);
    ctx.beginPath();
    ctx.rect(centerX - btnW/2, 0, btnW, btnH + 2); 
    ctx.fill();
    ctx.strokeRect(centerX - btnW/2, 0, btnW, btnH); 
    ctx.restore();

    // 扣子孔 (移除文字，保留框線)
    const holeW = cm(DIMS.hole.w);
    const holeH = cm(DIMS.hole.h);
    const holeMargin = cm(DIMS.hole.margin);
    
    // 位於 pocketY + 0.5cm
    const holeY = pocketY + holeMargin; 

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = cm(0.03);
    
    ctx.beginPath();
    ctx.rect(centerX - holeW/2, holeY - holeH/2, holeW, holeH);
    ctx.fill();
    ctx.stroke();
    // 文字已移除
    ctx.restore();


    // 折線
    ctx.save();
    ctx.setLineDash([cm(0.2), cm(0.2)]);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = cm(0.03);
    ctx.beginPath();
    ctx.moveTo(0, backY);
    ctx.lineTo(contentW, backY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pocketY);
    ctx.lineTo(contentW, pocketY);
    ctx.stroke();
    ctx.restore();

    // 外框
    ctx.strokeStyle = '#000';
    ctx.lineWidth = cm(0.05);
    ctx.strokeRect(0, startY, contentW, height - startY);

  }, [images, DIMS]);


  const drawInnerLayer = useCallback((ctx, width, height, scaleFactor) => {
    const cm = (val) => val * scaleFactor;
    const controlSensitivity = 20;
    const offsetMultiplier = scaleFactor / (controlSensitivity / 1.5);

    const earW = cm(DIMS.glueTab.w);
    const earH = cm(DIMS.glueTab.h);
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
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(startX, startY, contentW, contentH);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${cm(0.4)}px Arial`;
        ctx.fillText('內層圖 (正常方向)', startX + contentW/2, startY + contentH/2);
    }
    ctx.restore();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = cm(0.05);
    ctx.strokeRect(startX, startY, contentW, contentH);

    const drawEar = (x, y, isLeft) => {
        ctx.save();
        ctx.fillStyle = '#e5e7eb';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = cm(0.04);
        ctx.beginPath();
        if (isLeft) {
            ctx.moveTo(x, y + contentH - earH);
            ctx.lineTo(x - earW, y + contentH - earH + cm(0.2));
            ctx.lineTo(x - earW, y + contentH - cm(0.2));
            ctx.lineTo(x, y + contentH);
        } else {
            ctx.moveTo(x, y + contentH - earH);
            ctx.lineTo(x + earW, y + contentH - earH + cm(0.2));
            ctx.lineTo(x + earW, y + contentH - cm(0.2));
            ctx.lineTo(x, y + contentH);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#666';
        ctx.font = `${cm(0.25)}px Arial`;
        ctx.textAlign = 'center';
        ctx.translate(isLeft ? x - earW/2 : x + earW/2, y + contentH - earH/2);
        ctx.rotate(isLeft ? -Math.PI/2 : Math.PI/2);
        ctx.fillText('黏貼', 0, 0);
        ctx.restore();
    };
    drawEar(startX, startY, true);
    drawEar(startX + contentW, startY, false);
  }, [images, DIMS]);


  useEffect(() => {
    const canvas = outerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const totalHeightCm = DIMS.frontHeight + DIMS.backHeight + DIMS.pocketHeight + DIMS.buttonTab.h;
    canvas.width = DIMS.width * PREVIEW_PIXELS_PER_CM;
    canvas.height = totalHeightCm * PREVIEW_PIXELS_PER_CM;
    drawOuterLayer(ctx, canvas.width, canvas.height, PREVIEW_PIXELS_PER_CM);
  }, [images, DIMS, drawOuterLayer]);

  useEffect(() => {
    const canvas = innerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const earW = DIMS.glueTab.w;
    const contentW_cm = DIMS.width + (earW * 2) + 1;
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

    const outerTotalHeightMm = (DIMS.frontHeight + DIMS.backHeight + DIMS.pocketHeight + DIMS.buttonTab.h) * 10;
    const outerTopMargin = (pageHeight - outerTotalHeightMm) / 2;

    const processOuter = () => {
        const totalHeightCm = DIMS.frontHeight + DIMS.backHeight + DIMS.pocketHeight + DIMS.buttonTab.h;
        canvas.width = DIMS.width * PRINT_PIXELS_PER_CM;
        canvas.height = totalHeightCm * PRINT_PIXELS_PER_CM;
        
        drawOuterLayer(ctx, canvas.width, canvas.height, PRINT_PIXELS_PER_CM);
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        const pdfImgWidth = DIMS.width * 10; 
        const pdfImgHeight = totalHeightCm * 10; 
        
        const x = (pageWidth - pdfImgWidth) / 2;
        const y = outerTopMargin;
        
        doc.addImage(imgData, 'JPEG', x, y, pdfImgWidth, pdfImgHeight);
    };

    const processInner = () => {
        const earW = DIMS.glueTab.w;
        const contentW_cm = DIMS.width + (earW * 2) + 1; 
        const contentH_cm = DIMS.innerTotalHeight + 1;
        
        canvas.width = contentW_cm * PRINT_PIXELS_PER_CM;
        canvas.height = contentH_cm * PRINT_PIXELS_PER_CM;
        
        drawInnerLayer(ctx, canvas.width, canvas.height, PRINT_PIXELS_PER_CM);
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        const pdfTotalW = contentW_cm * 10;
        const pdfTotalH = contentH_cm * 10;

        const bodyInImageOffsetY = (pdfTotalH - (DIMS.innerTotalHeight * 10)) / 2;
        const targetBodyY = outerTopMargin + (DIMS.buttonTab.h * 10);
        const finalImageY = targetBodyY - bodyInImageOffsetY;

        const x = (pageWidth - pdfTotalW) / 2;
        
        doc.addImage(imgData, 'JPEG', x, finalImageY, pdfTotalW, pdfTotalH);
    };

    if (mode === 'combined') {
        processOuter();
        doc.text("Page 1: Outer Layer (Top)", 10, 10);
        doc.addPage();
        processInner();
        doc.text("Page 2: Inner Layer (Matches Outer Top Section)", 10, 10);
        doc.save('ticket-holder-complete-landscape.pdf');
    } else if (mode === 'outer') {
        processOuter();
        doc.save('ticket-holder-outer-landscape.pdf');
    } else if (mode === 'inner') {
        processInner();
        doc.save('ticket-holder-inner-landscape.pdf');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-indigo-600 flex items-center justify-center gap-3">
            <Scissors className="w-8 h-8" />
            演唱會票夾 DIY 專業版
          </h1>
          <p className="text-gray-500 mt-2 font-medium text-sm">即時裁切預覽 • 橫向 A4 PDF 精準對位</p>
        </header>

        {/* 編輯區域 Grid (版面更緊湊) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <ImageEditorCard 
                id="front" 
                label="1. 正面 (頭對頭)" 
                sub="21 x 7.3 cm" 
                color="border-pink-200 bg-white"
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
                color="border-blue-200 bg-white"
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
                color="border-green-200 bg-white"
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
                sub="21 x 15.3 cm" 
                color="border-gray-200 bg-white"
                imageState={images.inner}
                widthCm={21}
                heightCm={15.3}
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />
        </div>

        {/* 操作與下載區 */}
        <div className="bg-white p-6 rounded-xl shadow border border-indigo-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Layers className="text-indigo-600" />
                    製作檔案下載
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    橫向 A4 PDF (共2頁)，支援雙面列印對位。
                </p>
            </div>
            
            <button 
                onClick={() => handleDownloadPDF('combined')}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all font-bold shadow-md shadow-indigo-100"
                disabled={!jsPDFLoaded}
            >
                {jsPDFLoaded ? (
                    <>
                        <FileText size={20} /> 
                        <span>下載完整 PDF</span>
                    </>
                ) : '載入中...'}
            </button>
        </div>

        {/* 預覽 Canvas (放大且背景乾淨) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-center font-bold text-gray-600 mb-4">頁面 1 預覽 (外層)</h3>
              <div className="flex justify-center bg-white">
                <canvas ref={outerCanvasRef} className="bg-white shadow max-w-full h-auto" style={{ maxHeight: '600px' }} />
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-center font-bold text-gray-600 mb-4">頁面 2 預覽 (內層)</h3>
              <div className="flex justify-center bg-white">
                <canvas ref={innerCanvasRef} className="bg-white shadow max-w-full h-auto" style={{ maxHeight: '600px' }} />
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;