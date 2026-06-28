import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Search } from 'lucide-react';

const HandwritingCanvas = ({ onPredict, isCharacter }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState(null);

    // FIX: Track whether user has drawn anything.
    // Without this, submitting a blank canvas yields arbitrary predictions.
    const [isCanvasDirty, setIsCanvasDirty] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;

        // ─────────────────────────────────────────────────────────────────
        // FIX: Scale the canvas context by devicePixelRatio to prevent
        // blurry strokes on high-DPI (Retina) screens. The canvas physical
        // pixel buffer is enlarged, then scaled down via CSS to the desired
        // visual size, giving crisp rendering. Without this, coordinates
        // reported by mouse events are misaligned on scaled displays.
        // ─────────────────────────────────────────────────────────────────
        const dpr = window.devicePixelRatio || 1;
        const logicalSize = 280;

        // Set the internal bitmap size (actual physical pixels)
        canvas.width  = logicalSize * dpr;
        canvas.height = logicalSize * dpr;

        // Keep visual CSS size fixed at the logical size
        canvas.style.width  = `${logicalSize}px`;
        canvas.style.height = `${logicalSize}px`;

        const context = canvas.getContext('2d');

        // Scale all drawing operations so 1 unit = 1 CSS pixel
        context.scale(dpr, dpr);

        context.lineCap   = 'round';
        context.lineJoin  = 'round';
        context.strokeStyle = 'white';
        context.lineWidth = 18;
        setCtx(context);

        // Initial black background
        context.fillStyle = 'black';
        context.fillRect(0, 0, logicalSize, logicalSize);
    }, []);

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        e.preventDefault();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Mark canvas as having content once first stroke is drawn
        if (!isCanvasDirty) setIsCanvasDirty(true);

        e.preventDefault();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // FIX: Reset dirty flag when canvas is cleared
        setIsCanvasDirty(false);
    };

    const handlePredict = () => {
        // FIX: Prevent submitting an empty canvas
        if (!isCanvasDirty) {
            alert('Please draw something before predicting!');
            return;
        }
        canvasRef.current.toBlob((blob) => {
            onPredict(blob);
        }, 'image/png');
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group p-1 bg-white/10 rounded-xl">
                <canvas
                    ref={canvasRef}
                    className="rounded-lg cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            <div className="flex gap-3 w-full">
                <button
                    onClick={clear}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-gray-300"
                >
                    <Eraser size={18} />
                    Clear
                </button>
                <button
                    onClick={handlePredict}
                    disabled={!isCanvasDirty}
                    className={`flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl transition-all shadow-lg ${
                        isCanvasDirty
                            ? 'bg-primary hover:bg-primary/80 hover:shadow-primary/20'
                            : 'bg-primary/40 cursor-not-allowed opacity-60'
                    }`}
                >
                    <Search size={18} />
                    Predict
                </button>
            </div>
        </div>
    );
};

export default HandwritingCanvas;
