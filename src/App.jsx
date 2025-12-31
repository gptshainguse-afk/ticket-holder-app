import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Upload, Trash2, Scissors, Move, ZoomIn, FileText, Layers, Printer, Check, ArrowDown, Sparkles, Settings, ChevronRight, Store, CreditCard, PenTool, ToggleLeft, ToggleRight, Image as ImageIcon, Ruler, AlertCircle } from 'lucide-react';

// 注意：在標準 npm 開發環境中，您可以使用 npm install jspdf 並取消下行註解
// import { jsPDF } from 'jspdf';

// 定義統一的位移靈敏度
const OFFSET_SENSITIVITY = 20; 

// 預設尺寸參數
const DEFAULT_DIMS = {
  width: 23,
  backHeight: 7.8,
  frontHeight: 7.3,
  pocketHeight: 3,
  buttonTab: { w: 1, h: 0.5, tipW: 0.6 },
  innerTotalHeight: 15.1,
  glueTab: { w: 1, h: 2.5 },
  hole: { w: 0.8, h: 0.3, margin: 0.5 }
};

// 定義票券選項 (移至外部以便 App 與 SetupWizard 共用)
const TICKET_OPTIONS = [
    { 
      id: '711', 
      name: '7-Eleven', 
      desc: '標準尺寸', 
      color: 'bg-green-600',
      dims: { ...DEFAULT_DIMS, width: 23 } 
    },
    { 
      id: 'family', 
      name: '全家 FamilyMart', 
      desc: '短版尺寸', 
      color: 'bg-blue-500',
      dims: { ...DEFAULT_DIMS, width: 20 }
    },
    { 
      id: 'hilife', 
      name: '萊爾富 / OK', 
      desc: '特規尺寸', 
      color: 'bg-rose-500',
      dims: { 
        ...DEFAULT_DIMS, 
        width: 23, 
        frontHeight: 8.5, 
        backHeight: 9, 
        innerTotalHeight: 17.5 
      }
    },
    { 
        id: 'custom',
        name: '自訂尺寸',
        desc: '輸入票券長寬自動計算',
        color: 'bg-slate-500',
        dims: null // 將在下一步計算
    }
];

// --- 1. 設定精靈元件 (Setup Wizard) ---
const SetupWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [ticketType, setTicketType] = useState('711'); // default
  const [hasTab, setHasTab] = useState(true);
  
  // 自訂尺寸狀態
  const [customLength, setCustomLength] = useState(15);
  const [customWidth, setCustomWidth] = useState(6);
  const [customError, setCustomError] = useState('');

  // 驗證自訂尺寸
  useEffect(() => {
    if (step === 1.5) {
      if (customWidth > 8.64) {
        setCustomError('票券寬度不可大於 8.64cm，否則展開圖將超出 A4 紙張範圍。');
      } else {
        setCustomError('');
      }
    }
  }, [customWidth, step]);

  const handleNext = () => {
    if (step === 1) {
        if (ticketType === 'custom') {
            setStep(1.5); // 進入自訂輸入
        } else {
            setStep(2); // 進入卡扣設定
        }
    } else if (step === 1.5) {
        if (customError) return; // 有錯誤不能繼續
        setStep(2);
    } else {
      // 計算最終尺寸
      let finalDims;

      if (ticketType === 'custom') {
          // --- 自訂尺寸計算邏輯 ---
          // 1. 票夾寬度 (長邊): (長度 + 1) / 0.96，無條件進位
          const calcWidth = Math.ceil((parseFloat(customLength) + 1) / 0.96);
          
          // 2. 票夾高度 (短邊/正面): (寬度 + 1.3) / 0.96 (修正後公式)
          let calcFrontHeight = (parseFloat(customWidth) + 1.3) / 0.96;
          
          // 3. 高度限制: 若票寬 > 8.5，則正面高最多 9
          if (parseFloat(customWidth) > 8.5) {
              calcFrontHeight = 9;
          }

          // 4. 背面高度: 正面 + 0.5 (緩衝)
          const calcBackHeight = calcFrontHeight + 0.5;

          // 5. 內層高度: 正面 + 背面
          const calcInnerHeight = calcFrontHeight + calcBackHeight;

          finalDims = {
              ...DEFAULT_DIMS,
              width: calcWidth,
              frontHeight: Number(calcFrontHeight.toFixed(2)),
              backHeight: Number(calcBackHeight.toFixed(2)),
              innerTotalHeight: Number(calcInnerHeight.toFixed(2))
          };
      } else {
          const selectedOption = TICKET_OPTIONS.find(t => t.id === ticketType);
          finalDims = JSON.parse(JSON.stringify(selectedOption.dims));
      }

      // 處理卡扣邏輯
      if (!hasTab) {
        // 如果不做卡扣：把扣子高度加回正面高度
        finalDims.frontHeight += finalDims.buttonTab.h;
        finalDims.buttonTab.h = 0;
      }

      onComplete(finalDims, ticketType, hasTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2 relative z-10">
                {step === 1.5 ? <Ruler size={24} /> : <Settings size={24} />}
                {step === 1 && '選擇票券類型'}
                {step === 1.5 && '輸入票券尺寸'}
                {step === 2 && '卡扣設定'}
            </h2>
            <p className="text-indigo-200 text-sm mt-1 relative z-10">
                {step === 1 && '依照您的超商票券選擇版型'}
                {step === 1.5 && '請測量您手中的票券實際長寬'}
                {step === 2 && '選擇是否製作上方扣子'}
            </p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
            {step === 1 ? (
                <div className="grid grid-cols-1 gap-3">
                    {TICKET_OPTIONS.map((opt) => (
                        <div 
                            key={opt.id}
                            onClick={() => setTicketType(opt.id)}
                            className={`
                                cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all duration-200
                                ${ticketType === opt.id 
                                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                                    : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}
                            `}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${opt.color}`}>
                                {opt.id === 'custom' ? <PenTool size={20} /> : <Store size={20} />}
                            </div>
                            <div className="ml-4 flex-grow">
                                <div className="font-bold text-slate-800">{opt.name}</div>
                                <div className="text-xs text-slate-500">{opt.desc}</div>
                            </div>
                            {ticketType === opt.id && <Check className="text-indigo-600" size={20} />}
                        </div>
                    ))}
                </div>
            ) : step === 1.5 ? (
                <div className="space-y-6">
                    {/* 已移除公式提示區塊 */}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">票券長度 (cm)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={customLength}
                                    onChange={(e) => setCustomLength(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-lg font-mono text-slate-800"
                                    placeholder="例如：15"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">cm</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">對應票夾的左右寬度</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">票券寬度 (cm)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={customWidth}
                                    onChange={(e) => setCustomWidth(e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 outline-none text-lg font-mono 
                                        ${customError ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500' : 'border-slate-200 text-slate-800 focus:border-indigo-500'}
                                    `}
                                    placeholder="例如：6"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">cm</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">對應票夾的上下高度</p>
                            
                            {customError && (
                                <div className="flex items-start gap-2 mt-2 text-red-600 text-xs font-bold animate-pulse">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <span>{customError}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div 
                        className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${hasTab ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                        onClick={() => setHasTab(true)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                <ToggleRight className="text-indigo-600" size={24} /> 
                                製作卡扣
                            </span>
                            {hasTab && <Check className="text-indigo-600" size={20} />}
                        </div>
                        <p className="text-sm text-slate-500 ml-8">
                            上方會有一個小梯形凸起，並在夾層打孔，可將票夾扣上防止票券掉出。
                        </p>
                    </div>

                    <div 
                        className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${!hasTab ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                        onClick={() => setHasTab(false)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                <ToggleLeft className="text-slate-400" size={24} /> 
                                不做卡扣
                            </span>
                            {!hasTab && <Check className="text-indigo-600" size={20} />}
                        </div>
                        <p className="text-sm text-slate-500 ml-8">
                            移除上方凸起，並將該長度(0.5cm)直接加回正面主體，外觀為平整的長方形。
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between">
            {step > 1 ? (
                <button 
                    onClick={() => {
                        if (step === 2) {
                            setStep(ticketType === 'custom' ? 1.5 : 1);
                        } else {
                            setStep(1);
                        }
                    }}
                    className="px-6 py-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors font-medium"
                >
                    上一步
                </button>
            ) : (
                <div></div> // Spacer
            )}
            <button 
                onClick={handleNext}
                disabled={step === 1.5 && !!customError}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg 
                    ${step === 1.5 && customError 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}
                `}
            >
                {step === 2 ? '開始製作' : '下一步'}
                <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. 控制列元件 ---
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

// --- 3. 圖片編輯卡片 ---
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

// --- 4. 主應用程式 ---
const App = () => {
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false);
  const [isIbonMode, setIsIbonMode] = useState(false); 
  
  // 新增狀態: 應用程式模式 ('setup' | 'editor')
  const [appMode, setAppMode] = useState('setup');
  // 新增狀態: 尺寸設定 (由 Wizard 傳入)
  const [dims, setDims] = useState(DEFAULT_DIMS);
  const [hasTab, setHasTab] = useState(true);
  // 新增狀態: 票券類型 ID
  const [ticketTypeId, setTicketTypeId] = useState('711');

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

  // Wizard 完成時的回調
  const handleSetupComplete = (newDims, type, tabEnabled) => {
      setDims(newDims);
      setHasTab(tabEnabled);
      setTicketTypeId(type);
      setAppMode('editor');
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
    
    const earW = cm(dims.glueTab.w);
    const earH = cm(dims.glueTab.h);
    const contentW = cm(dims.width);
    
    const startX = (width - contentW) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(startX, 0);

    // 這裡 buttonTab.h 如果在 setup 設為 0，startY 就會是 0，正常
    const startY = cm(dims.buttonTab.h);
    const centerX = contentW / 2;

    const drawSectionImage = (imgData, rectX, rectY, rectW, rectH, rotate, customPath) => {
        ctx.save();
        ctx.beginPath();
        if (customPath) {
            customPath(ctx);
        } else {
            ctx.rect(rectX, rectY, rectW, rectH);
        }
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
            ctx.fillStyle = rotate ? '#fff1f2' : '#eff6ff';
            if(rotate && rectY > height/2) ctx.fillStyle = '#f0fdf4';
            
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

    // 1. 正面
    const frontH = cm(dims.frontHeight);
    
    // 正面裁切路徑：如果有卡扣才畫梯形，否則畫矩形
    const frontPath = (context) => {
        const tabBaseW = cm(dims.buttonTab.w);
        const tabTipW = cm(dims.buttonTab.tipW);
        // 如果 hasTab = false, dims.buttonTab.h = 0, 以下邏輯依然成立(變平)
        const tabH = cm(dims.buttonTab.h);
        
        context.moveTo(0, startY);
        
        if (hasTab) {
            context.lineTo(centerX - tabBaseW/2, startY);
            context.lineTo(centerX - tabTipW/2, 0);
            context.lineTo(centerX + tabTipW/2, 0);
            context.lineTo(centerX + tabBaseW/2, startY);
        } else {
            // 無卡扣，直接平的
            context.lineTo(contentW, startY); 
        }
        
        context.lineTo(contentW, startY);
        context.lineTo(contentW, startY + frontH);
        context.lineTo(0, startY + frontH);
        context.closePath();
    };

    drawSectionImage(images.front, 0, startY, contentW, frontH, true, frontPath);

    // 2. 背面
    const backY = startY + frontH;
    const backH = cm(dims.backHeight);
    drawSectionImage(images.back, 0, backY, contentW, backH, false);

    // 3. 夾層
    const pocketY = backY + backH;
    const pocketH = cm(dims.pocketHeight);
    drawSectionImage(images.pocket, 0, pocketY, contentW, pocketH, true);

    // 繪製耳朵
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

    // 扣子輪廓 (僅在有卡扣時繪製)
    if (hasTab) {
        const tabBaseW = cm(dims.buttonTab.w);
        const tabTipW = cm(dims.buttonTab.tipW);
        
        ctx.save();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = cm(0.06);
        ctx.beginPath();
        ctx.moveTo(centerX - tabBaseW/2, startY);
        ctx.lineTo(centerX - tabTipW/2, 0);
        ctx.lineTo(centerX + tabTipW/2, 0);
        ctx.lineTo(centerX + tabBaseW/2, startY);
        ctx.stroke();
        ctx.restore();
    }

    // 扣孔 (僅在有卡扣時繪製)
    if (hasTab) {
        const holeW = cm(dims.hole.w);
        const holeH = cm(dims.hole.h);
        const holeMargin = cm(dims.hole.margin);
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
    }

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

    // 外框線
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = cm(0.06);
    ctx.beginPath();
    
    // 左邊界
    ctx.moveTo(0, startY);
    ctx.lineTo(0, height); 
    // 下邊界
    ctx.lineTo(contentW, height);
    // 右邊界
    ctx.lineTo(contentW, startY);
    
    // 上邊界 (根據是否有卡扣決定路徑)
    if (hasTab) {
        const tabBaseW = cm(dims.buttonTab.w);
        ctx.moveTo(0, startY);
        ctx.lineTo(centerX - tabBaseW/2, startY); 
        ctx.moveTo(centerX + tabBaseW/2, startY); 
        ctx.lineTo(contentW, startY);
    } else {
        ctx.lineTo(0, startY); // 直接連起來
    }
    
    ctx.stroke();
    ctx.restore();

  }, [images, dims, hasTab]);

  // 繪製：內層 (Page 2)
  const drawInnerLayer = useCallback((ctx, width, height, scaleFactor) => {
    const cm = (val) => val * scaleFactor;
    const offsetMultiplier = scaleFactor / OFFSET_SENSITIVITY;

    const contentW = cm(dims.width);
    const bodyH = cm(dims.innerTotalHeight);
    const tabH = cm(dims.buttonTab.h); // 若 hasTab=false，這裡會是0
    const tabBaseW = cm(dims.buttonTab.w);
    const tabTipW = cm(dims.buttonTab.tipW);

    const totalH = bodyH + tabH;
    const startX = (width - contentW) / 2;
    const startY = (height - totalH) / 2 + tabH; 

    const centerX = contentW / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(startX, startY); 

    const innerPath = (context) => {
        context.moveTo(0, 0); 
        
        if (hasTab) {
            context.lineTo(centerX - tabBaseW / 2, 0);
            context.lineTo(centerX - tabTipW / 2, -tabH);
            context.lineTo(centerX + tabTipW / 2, -tabH);
            context.lineTo(centerX + tabBaseW / 2, 0);
        } else {
            // 平的頂部
        }

        context.lineTo(contentW, 0); 
        context.lineTo(contentW, bodyH); 
        context.lineTo(0, bodyH); 
        context.closePath();
    };

    ctx.save();
    ctx.beginPath();
    innerPath(ctx);
    ctx.clip();

    if (images.inner && images.inner.src) {
        const img = images.inner.src;
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
        const big = Math.max(contentW, totalH) * 2;
        ctx.fillRect(-big/2, -big/2, big, big);
        
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(contentW / 2, bodyH / 2);
        ctx.font = `bold ${cm(0.4)}px sans-serif`;
        ctx.fillText(hasTab ? '內層圖 (含扣子)' : '內層圖 (無扣子)', 0, 0);
    }
    ctx.restore();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = cm(0.06);
    ctx.beginPath();
    innerPath(ctx);
    ctx.stroke();

    ctx.restore();

  }, [images, dims, hasTab]);

  useEffect(() => {
    if (appMode !== 'editor') return; // 只在編輯模式繪製

    const canvas = outerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const totalHeightCm = dims.frontHeight + dims.backHeight + dims.pocketHeight + dims.buttonTab.h;
    const totalWidthCm = dims.width + (dims.glueTab.w * 2) + 0.5;
    
    canvas.width = totalWidthCm * PREVIEW_PIXELS_PER_CM;
    canvas.height = totalHeightCm * PREVIEW_PIXELS_PER_CM;
    drawOuterLayer(ctx, canvas.width, canvas.height, PREVIEW_PIXELS_PER_CM);
  }, [images, dims, drawOuterLayer, appMode]);

  useEffect(() => {
    if (appMode !== 'editor') return;

    const canvas = innerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const contentW_cm = dims.width + 1;
    // 內層高度需包含扣子 (如果是0就沒影響)
    const contentH_cm = dims.innerTotalHeight + dims.buttonTab.h + 1;
    canvas.width = contentW_cm * PREVIEW_PIXELS_PER_CM;
    canvas.height = contentH_cm * PREVIEW_PIXELS_PER_CM;
    drawInnerLayer(ctx, canvas.width, canvas.height, PREVIEW_PIXELS_PER_CM);
  }, [images, dims, drawInnerLayer, appMode]);

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

    const outerTotalHeightCm = dims.frontHeight + dims.backHeight + dims.pocketHeight + dims.buttonTab.h;
    const outerTotalWidthCm = dims.width + (dims.glueTab.w * 2); 
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
        const contentW_cm = dims.width;
        const contentH_cm = dims.innerTotalHeight + dims.buttonTab.h;
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
            const p1BlockStartMm = (dims.buttonTab.h * 10);
            const p1BlockHeightMm = (dims.frontHeight + dims.backHeight) * 10;
            const p1BlockCenterRelativeMm = p1BlockStartMm + (p1BlockHeightMm / 2);
            const p1BlockCenterAbsoluteY = outerTopMargin + p1BlockCenterRelativeMm;
            const p2TargetCenterY = pageHeight - p1BlockCenterAbsoluteY;
            const imageContentHeightMm = contentH_cm * 10;
            finalImageY = p2TargetCenterY - (imageContentHeightMm / 2);
            finalImageY = finalImageY - 1;
            x = x + 2;
        } else {
            const bodyInImageOffsetY = (pdfTotalH - (dims.innerTotalHeight * 10)) / 2;
            const targetBodyY = outerTopMargin + (dims.buttonTab.h * 10);
            finalImageY = outerTopMargin; // 由於內層也有Tab或無Tab都對齊頂部
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

  // --- 根據 appMode 顯示不同介面 ---
  if (appMode === 'setup') {
      return <SetupWizard onComplete={handleSetupComplete} />;
  }

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
          
          <div className="mt-4 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2 text-slate-600 font-bold text-lg">
                <CreditCard size={20} className="text-indigo-500" /> 
                <span>模式：{TICKET_OPTIONS.find(t => t.id === ticketTypeId)?.name || '自訂尺寸'}</span>
                <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {hasTab ? '含卡扣' : '無卡扣'}
                </span>
                <button 
                    onClick={() => setAppMode('setup')}
                    className="ml-2 text-xs bg-slate-200 hover:bg-indigo-100 hover:text-indigo-600 px-3 py-1.5 rounded-md text-slate-500 flex items-center gap-1 transition-all"
                >
                    <Settings size={12} /> 重設
                </button>
            </div>
            <span className="text-xs text-slate-400 mt-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                註：尺寸有預留列印縮放的空間，所以會顯示偏大
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <ImageEditorCard 
                id="front" 
                label="1. 正面" 
                sub={`${dims.width} x ${dims.frontHeight} cm`} 
                colorBadge="from-pink-400 to-rose-400"
                imageState={images.front}
                widthCm={dims.width}
                heightCm={dims.frontHeight} 
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />
            <ImageEditorCard 
                id="back" 
                label="2. 背面" 
                sub={`${dims.width} x ${dims.backHeight} cm`} 
                colorBadge="from-blue-400 to-cyan-400"
                imageState={images.back}
                widthCm={dims.width}
                heightCm={dims.backHeight}
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />
            <ImageEditorCard 
                id="pocket" 
                label="3. 夾層" 
                sub={`${dims.width} x ${dims.pocketHeight} cm`} 
                colorBadge="from-emerald-400 to-teal-400"
                imageState={images.pocket}
                widthCm={dims.width}
                heightCm={dims.pocketHeight}
                onUpload={handleImageUpload}
                onUpdate={updateImageSettings}
                onRemove={removeImage}
            />
            <ImageEditorCard 
                id="inner" 
                label="4. 內層" 
                sub={`${dims.width} x ${dims.innerTotalHeight} cm`} 
                colorBadge="from-violet-400 to-purple-400"
                imageState={images.inner}
                widthCm={dims.width}
                heightCm={dims.innerTotalHeight} 
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
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{dims.width + (dims.glueTab.w*2)} x {dims.frontHeight+dims.backHeight+dims.pocketHeight+dims.buttonTab.h} cm</span>
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
                        頁面 2：內層 (襯紙{hasTab ? '+扣子' : ''})
                    </h3>
                    {isIbonMode ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            <ArrowDown size={14} />
                            已偏移校正
                        </span>
                    ) : (
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{dims.width} x {dims.innerTotalHeight + dims.buttonTab.h} cm</span>
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
