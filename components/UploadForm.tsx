import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, Image as ImageIcon, AlertCircle, Upload, Trash2, Loader2 } from 'lucide-react';
import { Item } from '../types';
import { CustomDropdown } from './CustomDropdown';
import { CustomToast } from './CustomToast';

interface UploadFormProps {
  initialData: Partial<Item>;
  categories: string[];
  onClose: () => void;
  onSubmit: (data: Partial<Item>) => Promise<void>;
}

const IMGBB_API_KEY = '062b241650d75b270a8032e4fcd6e52b';

// Hook untuk optimize image dengan wsrv.nl
const useOptimizedImageSrc = (src: string | undefined) => {
  if (!src) return '';
  
  // If it's already a base64 string, we can't optimize it via CDN proxy
  if (src.startsWith('data:')) return src;
  
  // If it's a blob url (local preview), return as is
  if (src.startsWith('blob:')) return src;

  // Use wsrv.nl proxy untuk optimize
  try {
    const encodedUrl = encodeURIComponent(src);
    return `https://wsrv.nl/?url=${encodedUrl}&w=800&q=80&output=webp&il`;
  } catch (e) {
    return src;
  }
};

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
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('ImgBB Error:', errorData);
        throw new Error(errorData?.error?.message || 'Upload failed');
      }
      
      const resData = await response.json();
      console.log('ImgBB Response:', resData);
      
      // Prioritas: image.url (direct link) > url > display_url
      const imageUrl = resData.data.image?.url || resData.data.url || resData.data.display_url;
      
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }
      
      // Pastikan HTTPS
      const secureUrl = imageUrl.replace(/^http:/, "https:");
      console.log('Final Image URL:', secureUrl);
      
      return secureUrl;
    } catch (error) {
      console.error('Upload to ImgBB failed:', error);
      throw error;
    }
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
      
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        CustomToast('Image too large. Max 5MB.');
        return;
      }
      
      const localPreview = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, img: localPreview }));
      
      setUploadingImg(true);
      try {
        const remoteUrl = await uploadToImgBB(file);
        URL.revokeObjectURL(localPreview);
        setForm(prev => ({ ...prev, img: remoteUrl }));
        CustomToast('Cover uploaded!');
      } catch (error: any) {
        console.error('Cover upload error:', error);
        CustomToast(error?.message || 'Failed to upload cover.');
        setForm(prev => ({ ...prev, img: initialData.img || '' }));
        URL.revokeObjectURL(localPreview);
      } finally {
        setUploadingImg(false);
      }
    } else {
      const fileArray = Array.from(files).slice(0, 30);
      
      // Validasi ukuran tiap file
      const validFiles = fileArray.filter(f => {
        if (f.size > 5 * 1024 * 1024) {
          CustomToast(`${f.name} too large. Skipped.`);
          return false;
        }
        return true;
      });
      
      if (validFiles.length === 0) return;
      
      setUploadingGallery(true);
      const localPreviews = validFiles.map(f => URL.createObjectURL(f));
      
      setForm(prev => ({ 
        ...prev, 
        gallery: [...(prev.gallery || []), ...localPreviews] 
      }));

      try {
        const uploadPromises = validFiles.map(f => uploadToImgBB(f));
        const results = await Promise.allSettled(uploadPromises);
        
        const remoteUrls: string[] = [];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            remoteUrls.push(result.value);
          } else {
            console.error(`Failed to upload image ${index}:`, result.reason);
          }
        });
        
        const currentGallery = form.gallery || [];
        const nonBlobUrls = currentGallery.filter(url => !url.startsWith('blob:'));
        
        localPreviews.forEach(url => URL.revokeObjectURL(url));
        
        setForm(prev => ({
          ...prev,
          gallery: [...nonBlobUrls, ...remoteUrls]
        }));
        
        if (remoteUrls.length > 0) {
          CustomToast(`${remoteUrls.length}/${validFiles.length} images uploaded!`);
        } else {
          CustomToast('All uploads failed. Please try again.');
        }
      } catch (error) {
        console.error('Gallery upload error:', error);
        CustomToast('Upload failed. Please try again.');
        setForm(prev => ({
          ...prev,
          gallery: (prev.gallery || []).filter(url => !url.startsWith('blob:'))
        }));
        localPreviews.forEach(url => URL.revokeObjectURL(url));
      } finally {
        setUploadingGallery(false);
      }
    }
  };

  const removeGalleryImg = (index: number) => {
    const urlToRemove = (form.gallery || [])[index];
    if (urlToRemove?.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
    }
    
    setForm(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (uploadingImg || uploadingGallery) {
      CustomToast('Please wait for uploads to complete');
      return;
    }
    
    const hasBlobUrls = form.img?.startsWith('blob:') || 
                        (form.gallery || []).some(url => url.startsWith('blob:'));
    
    if (hasBlobUrls) {
      CustomToast('Please wait for all images to finish uploading');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(form);
      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      CustomToast('Failed to save data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (form.img?.startsWith('blob:')) {
        URL.revokeObjectURL(form.img);
      }
      (form.gallery || []).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Optimize image URLs
  const optimizedCoverSrc = useOptimizedImageSrc(form.img);
  const optimizedGallery = (form.gallery || []).map(src => 
    src.startsWith('blob:') ? src : useOptimizedImageSrc(src)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-white/10 bg-[#121214]">
        <button onClick={() => isDirty ? window.confirm("Cancel?") && onClose() : onClose()} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X size={20}/>
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-white">{form.id ? 'Edit Creation' : 'Upload Creation'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
              <CustomDropdown 
                options={categories.map(c => ({ label: c, value: c }))}
                value={form.cat || categories[0]}
                onChange={(val) => handleChange('cat', val)}
                icon={LayoutGrid}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cover Image</label>
              <label className="flex items-center justify-center w-full h-[46px] bg-[#1a1a1e] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 text-sm text-gray-400">
                <ImageIcon size={16} className="mr-2"/>
                {uploadingImg ? "Uploading..." : "Choose Image"}
                <input type="file" accept="image/*" onChange={e => handleFile(e, 'img')} className="hidden" disabled={uploadingImg} />
              </label>
              {form.img && (
                <div className="mt-2 relative w-full h-24 bg-[#0a0a0c] rounded-lg overflow-hidden border border-white/10">
                  {uploadingImg ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : (
                    <img 
                      src={form.img.startsWith('blob:') ? form.img : optimizedCoverSrc} 
                      className="w-full h-full object-cover" 
                      alt="Cover Preview"
                      loading="lazy"
                      onLoad={() => console.log('Cover loaded:', form.img)}
                      onError={(e) => {
                        console.error('Cover failed to load:', form.img);
                        // Fallback ke URL asli jika wsrv gagal
                        if (e.currentTarget.src.includes('wsrv.nl')) {
                          e.currentTarget.src = form.img || '';
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gallery (Max 30)</label>
            <label className="flex items-center justify-center w-full h-[46px] bg-[#1a1a1e] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 text-sm text-gray-400">
              <Upload size={16} className="mr-2"/>
              {uploadingGallery ? "Uploading Gallery..." : "Add Screenshots"}
              <input type="file" multiple accept="image/*" onChange={e => handleFile(e, 'gallery')} className="hidden" disabled={uploadingGallery} />
            </label>
            
            {(form.gallery && form.gallery.length > 0) && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {form.gallery.map((src, i) => (
                  <div key={i} className="relative flex-shrink-0 group">
                    <div className="w-16 h-16 bg-[#0a0a0c] rounded-lg overflow-hidden border border-white/10">
                      {src.startsWith('blob:') ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 size={14} className="animate-spin text-white" />
                        </div>
                      ) : (
                        <img 
                          src={optimizedGallery[i]}
                          className="w-full h-full object-cover"
                          alt={`Gallery ${i + 1}`}
                          loading="lazy"
                          onError={(e) => {
                            console.error('Gallery image failed:', src);
                            // Fallback ke URL asli
                            if (e.currentTarget.src.includes('wsrv.nl')) {
                              e.currentTarget.src = src;
                            }
                          }}
                        />
                      )}
                    </div>
                    {!src.startsWith('blob:') && (
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
            )}
          </div>

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
