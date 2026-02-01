import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, Image as ImageIcon, AlertCircle, Upload } from 'lucide-react';
import { Item } from '../types';
import { CustomDropdown } from './CustomDropdown';

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

  useEffect(() => {
    if (form !== initialData) {
      setIsDirty(true);
    }
  }, [form, initialData]);

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image to ImgBB');
    }
    
    const data = await response.json();
    return data.data.url;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.title || form.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }
    
    if (!form.desc || form.desc.length < 10) {
      newErrors.desc = "Description must be at least 10 characters.";
    }
    
    if (!form.link) {
      newErrors.link = "Download link is required.";
    } else {
      try {
        new URL(form.link);
      } catch (_) {
        newErrors.link = "Please enter a valid URL (e.g., https://...)";
      }
    }

    if (form.youtube && form.youtube.trim() !== "") {
      try {
        new URL(form.youtube);
      } catch (_) {
        newErrors.youtube = "Invalid YouTube URL.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof Item, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
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
      console.error(error);
      alert('Failed to upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'img' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsDirty(true);

    if (field === 'img') {
      setUploadingImg(true);
      try {
        const url = await uploadToImgBB(files[0]);
        setForm(prev => ({ ...prev, img: url }));
      } catch (error) {
        console.error(error);
        alert('Failed to upload image to ImgBB. Please try again.');
      } finally {
        setUploadingImg(false);
      }
    } else {
      setUploadingGallery(true);
      try {
        const uploadPromises = Array.from(files).slice(0, 30).map(file => uploadToImgBB(file));
        const urls = await Promise.all(uploadPromises);
        setForm(prev => ({ ...prev, gallery: urls }));
      } catch (error) {
        console.error(error);
        alert('Failed to upload gallery images to ImgBB. Please try again.');
      } finally {
        setUploadingGallery(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-white/10 bg-[#121214]">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"><X/></button>
        <h2 className="text-2xl font-bold mb-6 text-white">{form.id ? 'Edit Creation' : 'Upload Creation'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Basic Info</label>
            <input 
              required 
              placeholder="Title" 
              value={form.title || ''} 
              onChange={e => handleChange('title', e.target.value)} 
              className={`w-full bg-[#1a1a1e] border rounded-xl p-3 outline-none transition-colors mb-2 text-white placeholder:text-gray-600 focus:ring-1 ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'}`}
            />
            {errors.title && <p className="text-red-500 text-xs flex items-center gap-1 mb-2"><AlertCircle size={12}/> {errors.title}</p>}
            
            <textarea 
              required 
              placeholder="Description (Markdown supported)" 
              rows={5} 
              value={form.desc || ''} 
              onChange={e => handleChange('desc', e.target.value)} 
              className={`w-full bg-[#1a1a1e] border rounded-xl p-3 outline-none transition-colors text-white placeholder:text-gray-600 focus:ring-1 ${errors.desc ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'}`}
            />
            {errors.desc && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle size={12}/> {errors.desc}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
              <CustomDropdown 
                options={categories.map(c => ({ label: c, value: c }))}
                value={form.cat || categories[0]}
                onChange={(val) => handleChange('cat', val)}
                className="w-full"
                icon={LayoutGrid}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cover Image</label>
              <div className="relative">
                <label className={`flex items-center justify-center w-full h-[46px] bg-[#1a1a1e] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors text-sm text-gray-400 ${uploadingImg ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploadingImg ? (
                    <>
                      <Upload size={16} className="mr-2 animate-pulse"/>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon size={16} className="mr-2"/>
                      {form.img ? "Image Uploaded" : "Choose Image"}
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleFile(e, 'img')} 
                    className="hidden"
                    disabled={uploadingImg}
                  />
                </label>
              </div>
              {form.img && (
                <div className="mt-2">
                  <img src={form.img} alt="Cover preview" className="w-full h-24 object-cover rounded-lg border border-white/10"/>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gallery (Max 30)</label>
            <div className="relative">
              <label className={`flex items-center justify-center w-full h-[46px] bg-[#1a1a1e] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors text-sm text-gray-400 ${uploadingGallery ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadingGallery ? (
                  <>
                    <Upload size={16} className="mr-2 animate-pulse"/>
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon size={16} className="mr-2"/>
                    Add Screenshots
                  </>
                )}
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={e => handleFile(e, 'gallery')} 
                  className="hidden"
                  disabled={uploadingGallery}
                />
              </label>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {(form.gallery || []).map((src, i) => (
                <img key={i} src={src} className="w-16 h-16 rounded-lg object-cover border border-white/10"/>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Links</label>
            <input 
              required 
              placeholder="Download Link (MediaFire, Drive, etc.)" 
              value={form.link || ''} 
              onChange={e => handleChange('link', e.target.value)} 
              className={`w-full bg-[#1a1a1e] border rounded-xl p-3 outline-none mb-2 text-white placeholder:text-gray-600 focus:ring-1 ${errors.link ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'}`}
            />
            {errors.link && <p className="text-red-500 text-xs flex items-center gap-1 mb-2"><AlertCircle size={12}/> {errors.link}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input 
                  placeholder="YouTube Trailer URL" 
                  value={form.youtube || ''} 
                  onChange={e => handleChange('youtube', e.target.value)} 
                  className={`w-full bg-[#1a1a1e] border rounded-xl p-3 outline-none text-white placeholder:text-gray-600 focus:ring-1 ${errors.youtube ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/5 focus:border-primary/50 focus:ring-primary/50'}`}
                />
                {errors.youtube && <p className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle size={12}/> {errors.youtube}</p>}
              </div>
              <input 
                placeholder="Original Creator Name" 
                value={form.originalCreator || ''} 
                onChange={e => handleChange('originalCreator', e.target.value)} 
                className="w-full bg-[#1a1a1e] border border-white/5 rounded-xl p-3 outline-none focus:border-primary/50 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <button 
            disabled={loading || uploadingImg || uploadingGallery} 
            className="w-full bg-primary hover:bg-primary-light py-4 rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all hover:-translate-y-1 mt-4 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : uploadingImg || uploadingGallery ? 'Uploading Images...' : (form.id ? 'Save Changes' : 'Post Creation')}
          </button>
        </form>
      </div>
    </div>
  );
};
