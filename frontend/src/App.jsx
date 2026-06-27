import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Edit3, Info, BarChart3 } from 'lucide-react';
import HandwritingCanvas from './components/HandwritingCanvas';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [mode, setMode] = useState('digit'); // 'digit' or 'character'
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handlePredict = async (imageSource) => {
        setLoading(true);
        setPrediction(null);

        const formData = new FormData();
        formData.append('file', imageSource, 'image.png');

        try {
            const endpoint = mode === 'digit' ? '/api/predict/digit' : '/api/predict/character';
            const response = await axios.post(endpoint, formData);
            setPrediction(response.data);
        } catch (error) {
            console.error('Prediction failed:', error);
            alert('Prediction failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
            handlePredict(file);
        }
    };

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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sidebar/Settings */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                        <h2 className="text-primary font-bold uppercase tracking-wider text-sm mb-4">Settings</h2>

                        <div className="space-y-4">
                            <label className="block text-gray-300 text-sm mb-2">Recognition Mode</label>
                            <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-2xl">
                                <button
                                    onClick={() => setMode('digit')}
                                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'digit' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    🔢 Digits
                                </button>
                                <button
                                    onClick={() => setMode('character')}
                                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'character' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    🔡 Alphanumeric
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-start gap-3">
                                <Info size={20} className="text-secondary shrink-0 mt-1" />
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {mode === 'digit'
                                        ? "Currently using MNIST model trained on 70,000 digits."
                                        : "Currently using EMNIST model trained on 47 character classes."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                        <h2 className="text-secondary font-bold uppercase tracking-wider text-sm mb-4">Stats</h2>
                        <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* Main Interface */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-card backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                        <div className="flex border-b border-white/5 bg-black/20">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'upload' ? 'text-primary bg-white/5' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <Upload size={18} />
                                Upload Image
                            </button>
                            <button
                                onClick={() => setActiveTab('draw')}
                                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'draw' ? 'text-primary bg-white/5' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <Edit3 size={18} />
                                Canvas Draw
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Input Column */}
                                <div>
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Input</h3>

                                    {activeTab === 'upload' ? (
                                        <div className="space-y-6">
                                            <label className="relative block group border-2 border-dashed border-white/10 hover:border-primary/50 transition-all rounded-2xl cursor-pointer p-8 text-center overflow-hidden">
                                                <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
                                                {previewUrl ? (
                                                    <img src={previewUrl} alt="Preview" className="max-h-[220px] mx-auto rounded-lg shadow-xl" />
                                                ) : (
                                                    <div className="py-8">
                                                        <Upload className="mx-auto text-gray-600 mb-4 group-hover:text-primary transition-colors" size={48} />
                                                        <p className="text-gray-500 group-hover:text-gray-300">Drop your handwritten digit here</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    ) : (
                                        <HandwritingCanvas onPredict={handlePredict} isCharacter={mode === 'character'} />
                                    )}
                                </div>

                                {/* Output Column */}
                                <div className="flex flex-col">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 text-right">Prediction</h3>

                                    {loading ? (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <p className="text-gray-500 text-sm font-medium animate-pulse">Neural net is thinking...</p>
                                        </div>
                                    ) : prediction ? (
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse"></div>
                                                <div className="relative text-9xl font-black text-transparent bg-gradient-to-br from-primary to-secondary bg-clip-text leading-none py-4">
                                                    {prediction.prediction}
                                                </div>
                                            </div>
                                            <div className="text-accent font-bold text-xl mb-8">
                                                {prediction.confidence.toFixed(1)}% Confident
                                            </div>

                                            <div className="w-full bg-black/30 p-6 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2 text-gray-500 mb-4">
                                                    <BarChart3 size={14} />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest leading-none">Confidence Breakdown</span>
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
                                                                {prediction.top3.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#a78bfa' : index === 1 ? '#60a5fa' : '#34d399'} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-30">
                                            <Edit3 size={64} className="text-gray-600 mb-6" />
                                            <p className="text-gray-500 text-center text-sm font-medium">Draw or upload to see<br />live predictions</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
