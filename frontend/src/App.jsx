import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Edit3, Info, BarChart3, FileText, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Copy, Download, ScanText } from 'lucide-react';
import HandwritingCanvas from './components/HandwritingCanvas';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all border-b-2 ${
            active
                ? 'text-primary border-primary bg-white/5'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-white/20'
        }`}
    >
        <Icon size={16} />
        {label}
    </button>
);

const ModeButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`py-2 rounded-xl text-sm font-semibold transition-all ${
            active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-500 hover:text-gray-300'
        }`}
    >
        {label}
    </button>
);

const Spinner = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-gray-400 text-sm animate-pulse">Neural net is thinking…</p>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 opacity-40 select-none">
        <Edit3 size={52} className="text-gray-500 mb-4" />
        <p className="text-gray-400 text-sm text-center leading-relaxed">
            Draw or upload to see<br />live predictions
        </p>
    </div>
);

const PredictionResult = ({ prediction }) => (
    <div className="flex flex-col items-center">
        <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse rounded-full" />
            <div className="relative text-8xl font-black text-transparent bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text leading-none py-4 px-2">
                {prediction.prediction}
            </div>
        </div>
        <div className="flex items-center gap-2 mb-6">
            <CheckCircle size={16} className="text-accent" />
            <span className="text-accent font-bold text-lg">{prediction.confidence.toFixed(1)}% Confident</span>
        </div>

        <div className="w-full bg-black/30 p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
                <BarChart3 size={13} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Confidence Breakdown</span>
            </div>
            <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prediction.top3} layout="vertical">
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                            dataKey="label"
                            type="category"
                            width={30}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }}
                            reversed
                        />
                        <Tooltip cursor={{ fill: 'transparent' }} content={() => null} />
                        <Bar dataKey="confidence" radius={[0, 4, 4, 0]}>
                            {prediction.top3.map((_, i) => (
                                <Cell key={i} fill={i === 0 ? '#a78bfa' : i === 1 ? '#60a5fa' : '#34d399'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PDF Results Panel
// ─────────────────────────────────────────────────────────────────────────────

const PdfResults = ({ pdfResult }) => {
    const [currentPage, setCurrentPage] = useState(0);

    if (!pdfResult || !pdfResult.results || pdfResult.results.length === 0) return null;

    const page = pdfResult.results[currentPage];
    const total = pdfResult.results.length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <span className="text-sm font-bold text-gray-300">
                        {total} page{total > 1 ? 's' : ''} processed
                    </span>
                </div>
                <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                    Mode: {pdfResult.mode === 'digit' ? '🔢 Digits' : '🔡 Alphanumeric'}
                </span>
            </div>

            {/* Page Navigator */}
            {total > 1 && (
                <div className="flex items-center justify-between bg-black/30 rounded-2xl p-3 border border-white/5">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={18} className="text-gray-300" />
                    </button>
                    <span className="text-sm text-gray-300 font-semibold">
                        Page {currentPage + 1} / {total}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(total - 1, p + 1))}
                        disabled={currentPage === total - 1}
                        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                </div>
            )}

            {/* Page preview + result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preview */}
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Page Preview</p>
                    <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/5">
                        <img
                            src={`data:image/png;base64,${page.preview}`}
                            alt={`Page ${page.page}`}
                            className="w-full object-contain max-h-60 rounded-2xl"
                        />
                    </div>
                </div>

                {/* Prediction */}
                <div className="flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3 text-right">Prediction</p>
                    <PredictionResult prediction={page} />
                </div>
            </div>

            {/* Page summary strip */}
            {total > 1 && (
                <div className="overflow-x-auto">
                    <div className="flex gap-2 pb-2">
                        {pdfResult.results.map((r, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                    i === currentPage
                                        ? 'border-primary bg-primary/10'
                                        : 'border-white/5 hover:border-white/20 bg-black/20'
                                }`}
                            >
                                <span className="text-[10px] text-gray-500">Pg {r.page}</span>
                                <span className="text-base font-black text-white">{r.prediction}</span>
                                <span className="text-[10px] text-accent">{r.confidence.toFixed(0)}%</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────

const App = () => {
    const [activeTab, setActiveTab]     = useState('upload');
    const [mode, setMode]               = useState('digit');
    const [prediction, setPrediction]   = useState(null);
    const [pdfResult, setPdfResult]     = useState(null);
    const [ocrResult, setOcrResult]     = useState(null);   // NEW: extract-text result
    const [loading, setLoading]         = useState(false);
    const [previewUrl, setPreviewUrl]   = useState(null);
    const [dragOver, setDragOver]       = useState(false);
    const [error, setError]             = useState(null);
    const [copied, setCopied]           = useState(false);  // NEW: copy feedback
    const fileInputRef                  = useRef(null);

    const clearResults = () => {
        setPrediction(null);
        setPdfResult(null);
        setOcrResult(null);
        setError(null);
    };

    // ── Image prediction ──────────────────────────────────────────────────────
    const handleImagePredict = async (imageBlob) => {
        setLoading(true);
        clearResults();

        const formData = new FormData();
        formData.append('file', imageBlob, 'image.png');

        try {
            const endpoint = mode === 'digit' ? '/api/predict/digit' : '/api/predict/character';
            const { data } = await axios.post(endpoint, formData);
            setPrediction(data);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Prediction failed. Is the backend running?';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── PDF prediction ────────────────────────────────────────────────────────
    const handlePdfPredict = async (pdfFile) => {
        setLoading(true);
        clearResults();

        const formData = new FormData();
        // Explicitly set MIME type to application/pdf so the backend validates correctly
        const blob = new Blob([pdfFile], { type: 'application/pdf' });
        formData.append('file', blob, pdfFile.name || 'upload.pdf');

        try {
            // Do NOT set Content-Type manually — axios auto-sets multipart/form-data
            // with the correct boundary string. Manual setting strips the boundary
            // and causes the server to fail parsing the request body.
            const { data } = await axios.post(`/api/predict/pdf?mode=${mode}`, formData);
            setPdfResult(data);
        } catch (err) {
            const detail = err.response?.data?.detail;
            const status = err.response?.status;
            const msg = detail
                ? `Error ${status}: ${detail}`
                : 'PDF processing failed. Is the backend running?';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── File change handler (images) ──────────────────────────────────────────
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            setPreviewUrl(null);
            handlePdfPredict(file);
        } else {
            // Revoke previous URL to prevent memory leak
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(file);
            });
            handleImagePredict(file);
        }
    };

    // ── Drag and drop ─────────────────────────────────────────────────────────
    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (file.type === 'application/pdf') {
            setPreviewUrl(null);
            handlePdfPredict(file);
        } else {
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(file);
            });
            handleImagePredict(file);
        }
    };

    // ── Tab switch — clear stale state ────────────────────────────────────────
    const switchTab = (tab) => {
        setActiveTab(tab);
        clearResults();
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    };

    // ── PDF → Text extraction (EasyOCR) ──────────────────────────────────────────
    const handleExtractPdf = async (pdfFile) => {
        setLoading(true);
        clearResults();
        setCopied(false);

        const formData = new FormData();
        const blob = new Blob([pdfFile], { type: 'application/pdf' });
        formData.append('file', blob, pdfFile.name || 'upload.pdf');

        try {
            const { data } = await axios.post('/api/extract/pdf', formData);
            setOcrResult(data);
        } catch (err) {
            const detail = err.response?.data?.detail;
            const status = err.response?.status;
            const msg = detail
                ? `Error ${status}: ${detail}`
                : 'Text extraction failed. Is the backend running?';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Copy full text to clipboard ────────────────────────────────────────────
    const copyAllText = () => {
        if (!ocrResult?.full_text) return;
        navigator.clipboard.writeText(ocrResult.full_text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    // ── Download as .txt file ────────────────────────────────────────────────
    const downloadTxt = () => {
        if (!ocrResult?.full_text) return;
        const blob = new Blob([ocrResult.full_text], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'extracted_text.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 mb-12">
            {/* Header */}
            <header className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    ✍️ AI Handwriting
                </h1>
                <p className="text-gray-400 text-lg font-light tracking-wide">
                    Transforming strokes into data using Deep Learning
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="lg:col-span-4 space-y-6">
                    {/* Settings */}
                    <div className="bg-card backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                        <h2 className="text-primary font-bold uppercase tracking-wider text-xs mb-5">Settings</h2>

                        <label className="block text-gray-400 text-xs font-semibold mb-2 uppercase tracking-widest">
                            Recognition Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-2xl mb-6">
                            <ModeButton active={mode === 'digit'}     onClick={() => { setMode('digit');     clearResults(); }} label="🔢 Digits" />
                            <ModeButton active={mode === 'character'} onClick={() => { setMode('character'); clearResults(); }} label="🔡 Alphanumeric" />
                        </div>

                        <div className="flex items-start gap-3 bg-black/20 p-4 rounded-2xl">
                            <Info size={16} className="text-secondary shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                {mode === 'digit'
                                    ? 'MNIST digit model — 10 classes (0–9), trained on 70,000 samples.'
                                    : 'EMNIST character model — 47 classes (A–Z, a–z, 0–9).'}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-card backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                        <h2 className="text-secondary font-bold uppercase tracking-wider text-xs mb-5">Model Stats</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-4 bg-black/20 rounded-2xl">
                                <div className="text-2xl font-black text-accent">{mode === 'digit' ? '99%+' : '87%'}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Accuracy</div>
                            </div>
                            <div className="text-center p-4 bg-black/20 rounded-2xl">
                                <div className="text-2xl font-black text-white">{mode === 'digit' ? '10' : '47'}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Classes</div>
                            </div>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-card backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                        <h2 className="text-accent font-bold uppercase tracking-wider text-xs mb-4">Tips</h2>
                        <ul className="space-y-2 text-xs text-gray-400 leading-relaxed">
                            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Draw on a dark background with thick white strokes.</li>
                            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Upload PNG / JPG images — one character per image works best.</li>
                            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Upload a PDF — each page is processed individually.</li>
                        </ul>
                    </div>
                </aside>

                {/* ── Main panel ──────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-card backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">

                        {/* Tab bar */}
                        <div className="flex border-b border-white/5 bg-black/20">
                            <TabButton active={activeTab === 'upload'} onClick={() => switchTab('upload')} icon={Upload}   label="Upload Image" />
                            <TabButton active={activeTab === 'extract'} onClick={() => switchTab('extract')} icon={ScanText} label="Extract Text" />
                            <TabButton active={activeTab === 'pdf'}    onClick={() => switchTab('pdf')}    icon={FileText} label="Predict PDF"   />
                            <TabButton active={activeTab === 'draw'}   onClick={() => switchTab('draw')}   icon={Edit3}    label="Canvas Draw"  />
                        </div>

                        <div className="p-8">
                            {/* ── Extract Text tab ──────────────────────────────── */}
                            {activeTab === 'extract' && (
                                <div className="space-y-6">
                                    {/* Drop zone — only show when no result yet */}
                                    {!ocrResult && !loading && (
                                        <label
                                            className={`block border-2 border-dashed rounded-2xl cursor-pointer p-10 text-center transition-all ${
                                                dragOver
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-white/10 hover:border-accent/50 hover:bg-white/5'
                                            }`}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setDragOver(false);
                                                const f = e.dataTransfer.files[0];
                                                if (f) handleExtractPdf(f);
                                            }}
                                        >
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={(e) => {
                                                    const f = e.target.files[0];
                                                    if (f) handleExtractPdf(f);
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                                                    <ScanText size={30} className="text-accent" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-200 font-bold text-base">Upload Handwritten PDF</p>
                                                    <p className="text-gray-500 text-sm mt-1">Each page will be OCR-scanned and converted to text</p>
                                                </div>
                                                <p className="text-gray-600 text-[10px] uppercase tracking-widest">PDF · Max 100 MB</p>
                                            </div>
                                        </label>
                                    )}

                                    {/* Loading */}
                                    {loading && (
                                        <div className="flex flex-col items-center gap-4 py-16">
                                            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                                            <p className="text-gray-400 text-sm animate-pulse">Reading handwriting with EasyOCR…</p>
                                            <p className="text-gray-600 text-xs">First run may take 10–20s to load the OCR model</p>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && <ErrorState msg={error} />}

                                    {/* Results */}
                                    {ocrResult && (
                                        <div className="space-y-6">
                                            {/* Action bar */}
                                            <div className="flex items-center justify-between flex-wrap gap-3">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-accent" />
                                                    <span className="text-sm font-bold text-gray-200">
                                                        {ocrResult.total_pages} page{ocrResult.total_pages > 1 ? 's' : ''} extracted
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={copyAllText}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                            copied
                                                                ? 'bg-accent text-black'
                                                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                        }`}
                                                    >
                                                        <Copy size={13} />
                                                        {copied ? 'Copied!' : 'Copy All'}
                                                    </button>
                                                    <button
                                                        onClick={downloadTxt}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                                                    >
                                                        <Download size={13} />
                                                        Download .txt
                                                    </button>
                                                    <button
                                                        onClick={() => { setOcrResult(null); clearResults(); }}
                                                        className="px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:bg-white/5 transition"
                                                    >
                                                        ✕ Clear
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Full text textarea — copyable */}
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Full Extracted Text</p>
                                                <textarea
                                                    readOnly
                                                    value={ocrResult.full_text}
                                                    className="w-full h-56 bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 font-mono leading-relaxed resize-y focus:outline-none focus:border-accent/50 transition"
                                                    placeholder="No text extracted"
                                                />
                                                <p className="text-gray-600 text-xs mt-1">You can select all (Ctrl+A) and copy from the box above, or use the buttons.</p>
                                            </div>

                                            {/* Per-page accordion */}
                                            {ocrResult.pages.length > 1 && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Per-Page Breakdown</p>
                                                    {ocrResult.pages.map((pg) => (
                                                        <details key={pg.page} className="group bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                                                            <summary className="flex items-center justify-between px-5 py-3 cursor-pointer list-none hover:bg-white/5 transition">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs font-bold text-primary">Page {pg.page}</span>
                                                                    <span className="text-gray-500 text-xs">{pg.lines.length} line{pg.lines.length !== 1 ? 's' : ''} detected</span>
                                                                </div>
                                                                <span className="text-gray-600 text-xs group-open:rotate-180 transition-transform">▼</span>
                                                            </summary>
                                                            <div className="px-5 pb-5 space-y-4">
                                                                {/* Page image */}
                                                                <img
                                                                    src={`data:image/png;base64,${pg.preview}`}
                                                                    alt={`Page ${pg.page}`}
                                                                    className="w-full max-h-64 object-contain rounded-xl border border-white/5"
                                                                />
                                                                {/* Lines */}
                                                                <div className="space-y-1">
                                                                    {pg.lines.length === 0 ? (
                                                                        <p className="text-gray-600 text-xs italic">No text detected on this page</p>
                                                                    ) : pg.lines.map((line, i) => (
                                                                        <div key={i} className="flex items-start justify-between gap-3 py-1 border-b border-white/5 last:border-0">
                                                                            <span className="text-sm text-gray-200 font-mono flex-1">{line.text}</span>
                                                                            <span className="text-[10px] text-gray-600 shrink-0">{line.confidence}%</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </details>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Image Upload tab ─────────────────────────────── */}
                            {activeTab === 'upload' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Input */}
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Input</p>
                                        <label
                                            className={`relative block border-2 border-dashed rounded-2xl cursor-pointer p-6 text-center transition-all overflow-hidden ${
                                                dragOver
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-white/10 hover:border-primary/40 hover:bg-white/5'
                                            }`}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={onDrop}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={onFileChange}
                                                accept="image/*"
                                            />
                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="max-h-[200px] mx-auto rounded-xl shadow-xl"
                                                />
                                            ) : (
                                                <div className="py-10 flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                                                        <Upload size={26} className="text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-300 font-semibold text-sm">Click to upload</p>
                                                        <p className="text-gray-600 text-xs mt-1">or drag & drop an image here</p>
                                                    </div>
                                                    <p className="text-gray-600 text-[10px] uppercase tracking-widest">PNG · JPG · WEBP</p>
                                                </div>
                                            )}
                                        </label>
                                        {previewUrl && (
                                            <button
                                                onClick={() => {
                                                    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
                                                    clearResults();
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="mt-3 w-full py-2 text-xs text-gray-500 hover:text-red-400 transition"
                                            >
                                                ✕ Clear image
                                            </button>
                                        )}
                                    </div>

                                    {/* Output */}
                                    <div className="flex flex-col">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4 text-right">Prediction</p>
                                        {loading ? <Spinner /> : prediction ? <PredictionResult prediction={prediction} /> : error ? <ErrorState msg={error} /> : <EmptyState />}
                                    </div>
                                </div>
                            )}

                            {/* ── PDF Upload tab ───────────────────────────────── */}
                            {activeTab === 'pdf' && (
                                <div className="space-y-8">
                                    {/* Drop zone */}
                                    {!pdfResult && !loading && (
                                        <label
                                            className={`block border-2 border-dashed rounded-2xl cursor-pointer p-10 text-center transition-all ${
                                                dragOver
                                                    ? 'border-secondary bg-secondary/10'
                                                    : 'border-white/10 hover:border-secondary/40 hover:bg-white/5'
                                            }`}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setDragOver(false);
                                                const f = e.dataTransfer.files[0];
                                                if (f) handlePdfPredict(f);
                                            }}
                                        >
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={(e) => {
                                                    const f = e.target.files[0];
                                                    if (f) handlePdfPredict(f);
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                                                    <FileText size={30} className="text-secondary" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-200 font-bold text-base">Upload a PDF document</p>
                                                    <p className="text-gray-500 text-sm mt-1">Each page will be processed individually</p>
                                                </div>
                                                <p className="text-gray-600 text-[10px] uppercase tracking-widest">PDF · Max 100 MB</p>
                                            </div>
                                        </label>
                                    )}

                                    {loading && <Spinner />}
                                    {error && <ErrorState msg={error} />}

                                    {/* PDF results */}
                                    {pdfResult && (
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-gray-300">Results</h3>
                                                <button
                                                    onClick={() => { setPdfResult(null); clearResults(); }}
                                                    className="text-xs text-gray-500 hover:text-red-400 transition px-3 py-1 rounded-lg hover:bg-white/5"
                                                >
                                                    ✕ Upload another PDF
                                                </button>
                                            </div>
                                            <PdfResults pdfResult={pdfResult} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Canvas Draw tab ──────────────────────────────── */}
                            {activeTab === 'draw' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Draw Here</p>
                                        <HandwritingCanvas onPredict={handleImagePredict} isCharacter={mode === 'character'} />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4 text-right">Prediction</p>
                                        {loading ? <Spinner /> : prediction ? <PredictionResult prediction={prediction} /> : error ? <ErrorState msg={error} /> : <EmptyState />}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const ErrorState = ({ msg }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-red-400 text-sm text-center max-w-xs leading-relaxed">{msg}</p>
    </div>
);

export default App;
