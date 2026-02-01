import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, Image as ImageIcon, AlertCircle, Upload, Trash2, Loader2 } from 'lucide-react';
import { Item } from '../types';
import { CustomDropdown } from './CustomDropdown';
import { showToast } from '../app';

interface UploadFormProps {
  initialData: Partial<Item>;
  categories: string[];
  onClose: () => void;
  onSubmit: (data: Partial<Item>) => Promise<void>;
}

const IMGBB_API_KEY = '062b241650d75b270a8032e4fcd6e52b';

export const UploadForm: React.FC<UploadFormProps> = ({ initialData, categories, onClose, onSubmit }) => {
  const [form, setForm] = useState<Partial<Item>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.data.url;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title || form.title.length < 3) newErrors.title = "Minimal 3 karakter.";
    if (!form.desc || form.desc.length < 10) newErrors.desc = "Minimal 10 karakter.";
    if (!form.link) {
      newErrors.link = "Link download wajib diisi.";
    } else {
      try { new URL(form.link); } catch { newErrors.link = "URL tidak valid."; }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof Item, value: any) => {
    setIsDirty(true);
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'img' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsDirty(true);

    if (field === 'img') {
      const file = files[0];
      const localPreview = URL.createObjectURL(file); // Preview Instan
      setForm(prev => ({ ...prev, img: localPreview }));
      
      setUploadingImg(true);
      try {
        const remoteUrl = await uploadToImgBB(file);
        setForm(prev => ({ ...prev, img: remoteUrl }));
      } catch (error) {
        showToast('Failed to upload cover.');
        setForm(prev => ({ ...prev, img: initialData.img }));
      } finally {
        setUploadingImg(false);
      }
    } else {
      setUploadingGallery(true);
      const fileArray = Array.from(files).slice(0, 30);
      const localPreviews = fileArray.map(f => URL.createObjectURL(f));
      
      // Tambahkan preview lokal ke list galeri
      setForm(prev => ({ 
        ...prev, 
        gallery: [...(prev.gallery || []), ...localPreviews] 
      }));

      try {
        const uploadPromises = fileArray.map(f => uploadToImgBB(f));
        const remoteUrls = await Promise.all(uploadPromises);
        
        // Ganti preview blob dengan URL asli
        setForm(prev => ({
          ...prev,
          gallery: [...(prev.gallery || []).filter(url => !url.startsWith('blob:')), ...remoteUrls]
        }));
      } catch (error) {
        showToast('Some gallery images failed to upload.');
      } finally {
        setUploadingGallery(false);
      }
    }
  };

  const removeGalleryImg = (index: number) => {
    setForm(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      setIsDirty(false);
      onClose();
    } catch (error) {
      showToast('Failed to save data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-white/10 bg-[#121214]">
        <button onClick={() => isDirty ? window.confirm("Batal?") && onClose() : onClose()} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X size={20}/>
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-white">{form.id ? 'Edit Creation' : 'Upload Creation'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Info Utama */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Basic Info</label>
            <input 
              required placeholder="Title" value={form.title || ''} 
              onChange={e => handleChange('title', e.target.value)} 
              className={`w-full bg-[#1a1a1e] border rounded-xl p-3 outline-none transition-colors mb-2 text-white ${errors.title ? 'border-red-500' : 'border-white/5 focus:border-primary/50'}`}
            />
            <textarea 
              required placeholder="Description (Markdown)" rows={4} 
              value={form.desc || ''} onChange={e => handleChange('desc', e.target.value)} 
              className={`w-full bg-[#1a1a1e] border rounded-xl p-3 outline-none text-white ${errors.desc ? 'border-red-500' : 'border-white/5 focus:border-primary/50'}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
              <CustomDropdown 
                options={categories.map(c => ({ label: c, value: c }))}
                value={form.cat || categories[0]}
                onChange={(val) => handleChange('cat', val)}
                icon={LayoutGrid}
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cover Image</label>
              <label className="flex items-center justify-center w-full h-[46px] bg-[#1a1a1e] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 text-sm text-gray-400">
                <ImageIcon size={16} className="mr-2"/>
                {uploadingImg ? "Uploading..." : "Choose Image"}
                <input type="file" accept="image/*" onChange={e => handleFile(e, 'img')} className="hidden" disabled={uploadingImg} />
              </label>
              {form.img && (
                <div className="mt-2 relative w-full h-24 group">
                  <img src={form.img} className={`w-full h-full object-cover rounded-lg border border-white/10 ${uploadingImg ? 'opacity-40' : ''}`} alt="Preview"/>
                  {uploadingImg && <Loader2 className="absolute inset-0 m-auto animate-spin text-primary" />}
                </div>
              )}
            </div>
          </div>

          {/* Galeri */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gallery (Max 30)</label>
            <label className="flex items-center justify-center w-full h-[46px] bg-[#1a1a1e] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 text-sm text-gray-400">
              <Upload size={16} className="mr-2"/>
              {uploadingGallery ? "Uploading Gallery..." : "Add Screenshots"}
              <input type="file" multiple accept="image/*" onChange={e => handleFile(e, 'gallery')} className="hidden" disabled={uploadingGallery} />
            </label>
            
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {(form.gallery || []).map((src, i) => (
                <div key={i} className="relative flex-shrink-0 group">
                  <img src={src} className={`w-16 h-16 rounded-lg object-cover border border-white/10 ${src.startsWith('blob:') ? 'opacity-40' : ''}`} />
                  {src.startsWith('blob:') ? (
                    <Loader2 size={14} className="absolute inset-0 m-auto animate-spin text-white" />
                  ) : (
                    <button 
                      type="button" onClick={() => removeGalleryImg(i)}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} className="text-white"/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase">Links & Credits</label>
            <input 
              required placeholder="Download Link" value={form.link || ''} 
              onChange={e => handleChange('link', e.target.value)} 
              className={`w-full bg-[#1a1a1e] border rounded-xl p-3 outline-none text-white ${errors.link ? 'border-red-500' : 'border-white/5'}`}
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                placeholder="YouTube URL" value={form.youtube || ''} 
                onChange={e => handleChange('youtube', e.target.value)} 
                className="bg-[#1a1a1e] border border-white/5 rounded-xl p-3 text-white outline-none"
              />
              <input 
                placeholder="Creator Name" value={form.originalCreator || ''} 
                onChange={e => handleChange('originalCreator', e.target.value)} 
                className="bg-[#1a1a1e] border border-white/5 rounded-xl p-3 text-white outline-none"
              />
            </div>
          </div>

          <button 
            disabled={loading || uploadingImg || uploadingGallery} 
            className="w-full bg-primary hover:bg-primary-light py-4 rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all hover:-translate-y-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (form.id ? 'Save Changes' : 'Post Creation')}
          </button>
        </form>
      </div>
    </div>
  );
};
