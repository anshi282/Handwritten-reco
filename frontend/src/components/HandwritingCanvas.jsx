import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Search } from 'lucide-react';

const HandwritingCanvas = ({ onPredict, isCharacter }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = 'white';
        context.lineWidth = 18;
        setCtx(context);

        // Initial black background
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
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
        e.preventDefault();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handlePredict = () => {
        canvasRef.current.toBlob((blob) => {
            onPredict(blob);
        }, 'image/png');
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group p-1 bg-white/10 rounded-xl">
                <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
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
                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/80 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20"
                >
                    <Search size={18} />
                    Predict
                </button>
            </div>
        </div>
    );
};

export default HandwritingCanvas;
