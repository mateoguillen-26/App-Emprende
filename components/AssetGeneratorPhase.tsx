import React, { useState } from 'react';
import { BusinessData } from '../types';
import { hasAnyApiKey, generateLogo, generateMockup } from '../services/geminiService';
import { Image as ImageIcon, Loader2, Package, Palette, Brush, Upload, Check, Download, Mail, Send } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface AssetGeneratorPhaseProps {
  data: BusinessData;
  updateData: (updates: Partial<BusinessData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AssetGeneratorPhase: React.FC<AssetGeneratorPhaseProps> = ({ data, updateData, onNext, onBack }) => {
  const [loading, setLoading] = useState({ logo: false, mockup: false, email: false });
  const [mockupPrompt, setMockupPrompt] = useState('Caja de delivery moderna');
  const [logoStyle, setLogoStyle] = useState('Minimalista y Moderno');
  const [logoColors, setLogoColors] = useState('Azul Marino y Dorado');
  const [userEmail, setUserEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkKey = async () => {
      // First check if we already have a key in the environment
      if (hasAnyApiKey()) {
        setHasKey(true);
        return;
      }

      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true); // Fallback if not in AI Studio environment
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Assume success as per guidelines
    }
  };

  const handleLogo = async () => {
    if (!hasKey) {
      await handleSelectKey();
    }
    setLoading(prev => ({ ...prev, logo: true }));
    try {
      const logo = await generateLogo(data.businessName, logoStyle, logoColors);
      updateData({ logoUrl: logo || undefined });
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Requested entity was not found') || e.message?.includes('403')) {
        if (!hasAnyApiKey()) {
          alert("Para generar imágenes, necesitas conectar tu propia API Key de Google AI Studio.");
          setHasKey(false);
          await handleSelectKey();
        } else {
          alert("Error de permisos (403): Tu clave de API actual parece no tener permisos para generar imágenes. Asegúrate de tener habilitada la API de Imagen en Google AI Studio.");
        }
      }
    }
    setLoading(prev => ({ ...prev, logo: false }));
  };

  const handleDownload = () => {
    if (!data.logoUrl) return;
    const link = document.createElement('a');
    link.href = data.logoUrl;
    link.download = `${data.businessName.replace(/\s+/g, '_')}_logo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRequestLogo = async () => {
    if (!userEmail || !data.logoUrl) return;
    setLoading(prev => ({ ...prev, email: true }));
    setEmailStatus('idle');
    try {
      const response = await fetch('/api/request-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          logoData: data.logoUrl,
          businessName: data.businessName
        })
      });
      if (response.ok) {
        setEmailStatus('success');
        setUserEmail('');
      } else {
        setEmailStatus('error');
      }
    } catch (e) {
      console.error(e);
      setEmailStatus('error');
    }
    setLoading(prev => ({ ...prev, email: false }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMockup = async () => {
    if (!data.logoUrl) return;
    if (!hasKey) {
      await handleSelectKey();
    }
    setLoading(prev => ({ ...prev, mockup: true }));
    try {
      const mockup = await generateMockup(data.logoUrl, mockupPrompt);
      updateData({ mockupUrl: mockup || undefined });
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Requested entity was not found') || e.message?.includes('403')) {
        if (!hasAnyApiKey()) {
          alert("Para generar imágenes, necesitas conectar tu propia API Key de Google AI Studio.");
          setHasKey(false);
          await handleSelectKey();
        } else {
          alert("Error de permisos (403): Tu clave de API actual parece no tener permisos para generar imágenes. Asegúrate de tener habilitada la API de Imagen en Google AI Studio.");
        }
      }
    }
    setLoading(prev => ({ ...prev, mockup: false }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        {/* 1. Identidad Visual */}
        <div className="bg-card rounded-[28px] p-8 shadow-soft flex flex-col h-full border border-white/50">
          <h3 className="text-lg font-bold flex items-center gap-3 mb-6 text-navy-950 uppercase tracking-wide">
            <div className="bg-brand-500/10 p-2 rounded-xl text-brand-600"><ImageIcon size={20} /></div>
            1. Tu Logo
          </h3>
          
          <div className="space-y-5 flex-1">
            {!data.hasLogo ? (
              <>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2 ml-1">Estilo Visual</label>
                  <select 
                    value={logoStyle}
                    onChange={e => setLogoStyle(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-[18px] text-sm font-medium bg-white text-navy-950 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  >
                    <option>Minimalista y Moderno</option>
                    <option>Vintage y Clásico</option>
                    <option>Tecnológico y Futurista</option>
                    <option>Orgánico y Natural</option>
                    <option>Lujoso y Elegante</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2 ml-1">Paleta de Colores</label>
                  <div className="relative">
                    <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      value={logoColors} 
                      onChange={e => setLogoColors(e.target.value)}
                      placeholder="Ej: Azul Marino y Dorado"
                      className="w-full p-4 pl-12 border border-gray-200 rounded-[18px] text-sm font-medium bg-white text-navy-950 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleLogo} 
                  disabled={loading.logo} 
                  className="w-full bg-navy-900 hover:bg-navy-800 text-white py-4 rounded-[20px] font-bold shadow-lg transition-all text-sm uppercase tracking-wide"
                >
                  {loading.logo ? <Loader2 className="animate-spin mx-auto" /> : (hasKey === false ? 'Conectar API Key para Logo' : 'Diseñar Logo')}
                </button>
              </>
            ) : (
                <div className="border-2 border-dashed border-gray-200 bg-white rounded-[24px] p-6 text-center hover:border-brand-400 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="cursor-pointer block">
                    <Upload className="mx-auto text-brand-500 mb-3" size={32} />
                    <span className="text-sm font-bold text-navy-950 block">Cambiar Logo</span>
                  </label>
               </div>
            )}

            <div className="bg-white rounded-[24px] border border-gray-100 p-2 shadow-inner aspect-square flex items-center justify-center relative overflow-hidden group">
               {data.logoUrl ? (
                  <>
                    <img src={data.logoUrl} className="w-full h-full object-contain p-6" alt="Logo" />
                    <button 
                      onClick={handleDownload}
                      className="absolute bottom-4 right-4 bg-brand-500 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-600"
                      title="Descargar Logo"
                    >
                      <Download size={20} />
                    </button>
                  </>
               ) : (
                  <div className="text-center text-gray-300">
                    <Brush className="mx-auto mb-2 opacity-30" size={40} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Vista Previa</span>
                  </div>
               )}
            </div>

            {data.logoUrl && (
              <div className="mt-6 p-6 bg-navy-900/5 rounded-[24px] border border-brand-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="text-brand-500" size={20} />
                  <h4 className="text-sm font-bold text-navy-950 uppercase tracking-wide">¿Lo quieres en otros formatos?</h4>
                </div>
                <p className="text-xs text-text-secondary mb-4">Ingresa tu correo y te mandamos el logo vectorizado y con demás formatos profesionales.</p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="flex-1 p-3 bg-white border border-gray-200 rounded-[14px] text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button 
                    onClick={handleRequestLogo}
                    disabled={loading.email || !userEmail}
                    className="bg-brand-500 hover:bg-brand-600 text-white p-3 rounded-[14px] transition-all disabled:opacity-50"
                  >
                    {loading.email ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
                {emailStatus === 'success' && <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1"><Check size={12} /> ¡Solicitud enviada! Te contactaremos pronto.</p>}
                {emailStatus === 'error' && <p className="text-[10px] text-red-500 font-bold mt-2">Error al enviar. Intenta de nuevo.</p>}
              </div>
            )}
          </div>
          <div className="w-12 h-1.5 bg-brand-500 rounded-full mx-auto mt-6 opacity-30"></div>
        </div>

        {/* 2. Mockups */}
        <div className="bg-card rounded-[28px] p-8 shadow-soft flex flex-col h-full border border-white/50">
          <h3 className="text-lg font-bold flex items-center gap-3 mb-6 text-navy-950 uppercase tracking-wide">
            <div className="bg-brand-500/10 p-2 rounded-xl text-brand-600"><Package size={20} /></div>
            2. Mockup Producto
          </h3>
          <div className="space-y-5 flex-1">
            <div className="relative">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2 ml-1">Aplicar sobre</label>
              <input 
                className="w-full p-4 border border-gray-200 rounded-[18px] text-sm font-medium bg-white text-navy-950 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" 
                placeholder="Ej: Camiseta, Taza, Tarjeta..." 
                value={mockupPrompt}
                onChange={e => setMockupPrompt(e.target.value)}
              />
            </div>
            <button 
              onClick={handleMockup} 
              disabled={loading.mockup || !data.logoUrl} 
              className="w-full bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-[20px] font-bold shadow-lg shadow-brand-500/20 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-sm uppercase tracking-wide"
            >
              {loading.mockup ? <Loader2 className="animate-spin mx-auto" /> : (hasKey === false ? 'Conectar API Key para Mockup' : 'Generar Mockup')}
            </button>
            <div className="bg-white rounded-[24px] border border-gray-100 p-2 shadow-inner aspect-square flex items-center justify-center relative overflow-hidden">
              {data.mockupUrl ? (
                <img src={data.mockupUrl} className="w-full h-full object-cover rounded-[18px]" alt="Mockup" />
              ) : (
                <div className="text-center text-gray-300 p-8">
                  <Package className="mx-auto mb-2 opacity-30" size={40} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    {data.hasLogo ? 'Listo para generar' : 'Requiere Logo'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="w-12 h-1.5 bg-brand-500 rounded-full mx-auto mt-6 opacity-30"></div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors">
          &larr; Atrás
        </button>
        <button 
          onClick={onNext} 
          className="bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-[20px] font-bold shadow-lg shadow-brand-500/20 transition-all text-sm uppercase tracking-wide hover:-translate-y-0.5"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};