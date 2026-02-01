import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { auth, db } from './services/firebase';
import { User, Item, BORDERS, Rating } from './types';
import { hasPermission, PERMISSIONS, canEditItem, ROLES } from './services/permissions';
import DownloadButton from './components/DownloadButton';
import { SkeletonCard } from './components/SkeletonCard';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { CustomDropdown } from './components/CustomDropdown';
import { UploadForm } from './components/UploadForm';
import { LazyImage } from './components/LazyImage';
import { 
  Search, Menu, X, Upload, LogOut, 
  Trash2, Edit, Play, 
  ChevronLeft, ChevronRight, Settings, Hash, UserPlus, LogIn, Star,
  Shield, Users, Ban, MicOff, Award,
  Filter, SortAsc, Image as ImageIcon,
  History, ChevronDown, ChevronUp, Loader2,
  LayoutDashboard, FileText, CheckCircle2, AlertCircle, BarChart3,
  Globe, MoreHorizontal, User as UserIcon, Plus, Minus
} from 'lucide-react';

const ASSETS = {
  TITLE: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/images/title.png',
  NO_PFP: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/images/nopfp.png',
  ICON_DC: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/images/dc.png',
  ICON_YT: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/images/yt.png',
  ICON_WA: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/images/wa.png',
  IMGBB_API_KEY: '062b241650d75b270a8032e4fcd6e52b',
};

const calculateAvgRating = (ratings?: Record<string, Rating>) => {
  if (!ratings) return 0;
  const list = Object.values(ratings);
  if (list.length === 0) return 0;
  return list.reduce((acc, r) => acc + (r.rating || 0), 0) / list.length;
};

const uploadToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${ASSETS.IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ImgBB API Error:', errorData);
      throw new Error(errorData?.error?.message || 'Failed to upload image to ImgBB');
    }
    
    const data = await response.json();
    console.log('ImgBB Response:', data);
    
    // Prioritas URL: image.url > url > display_url
    const imageUrl = data.data.image?.url || data.data.url || data.data.display_url;
    
    if (!imageUrl) {
      console.error('No URL in ImgBB response:', data);
      throw new Error('No image URL returned from ImgBB');
    }
    
    // Pastikan HTTPS
    const secureUrl = imageUrl.replace(/^http:/, "https:");
    console.log('Final image URL:', secureUrl);
    
    return secureUrl;
  } catch (error) {
    console.error('Upload to ImgBB failed:', error);
    throw error;
  }
};

export function showToast(message: string, duration: number = 3000): void {
    const toast: HTMLElement | null = document.getElementById('toast');
    
    if (!toast) {
        console.error('Element toast not found');
        return;
    }
    
    toast.textContent = message;
    toast.className = 'toast show';
    
    setTimeout((): void => {
        toast.className = toast.className.replace('show', '');
    }, duration);
}

const userCache: Record<string, User> = {};

const UserAvatar: React.FC<{ userId: string; className?: string; onClick?: () => void; editable?: boolean }> = ({ userId, className, onClick, editable = false }) => {
  const [user, setUser] = useState<User | null>(() => userCache[userId] || null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (!userId) return;
    if (userCache[userId]) {
      setUser(userCache[userId]);
    }
    const userRef = db.ref(`users/${userId}`);
    userRef.on('value', (snap: any) => {
      const val = snap.val();
      if (val && isMounted) {
        userCache[userId] = val;
        setUser(val);
      }
    });

    return () => {
      isMounted = false;
      userRef.off(); 
    };
  }, [userId]); 

  const uploadToImgDB = async (file: File): Promise<string> => {
    const IMGBB_API_KEY = '062b241650d75b270a8032e4fcd6e52b';
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
      
      const imageUrl = resData.data.image?.url || resData.data.url || resData.data.display_url;
      
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }
      
      const secureUrl = imageUrl.replace(/^http:/, "https:");
      console.log('Avatar URL:', secureUrl);
      
      return secureUrl;
    } catch (error) {
      console.error('Upload to ImgBB failed:', error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image too large. Max 2MB.', 5000);
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 5000);
      return;
    }

    const localBlob = URL.createObjectURL(file);
    setPreviewUrl(localBlob);
    setUploading(true);

    try {
      const imageUrl = await uploadToImgDB(file);
      
      await db.ref(`users/${userId}/profilePic`).set(imageUrl);
      
      if (userCache[userId]) {
        userCache[userId] = { ...userCache[userId], profilePic: imageUrl };
        setUser({ ...userCache[userId] });
      }
      
      showToast('Profile picture updated successfully! ✓', 8000);
      
      setTimeout(() => {
        setPreviewUrl(null);
      }, 1000);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      showToast(error?.message || 'Failed to upload image. Please try again.', 8000);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localBlob);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editable && !uploading) {
      fileInputRef.current?.click();
    } else if (onClick) {
      onClick();
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const border = BORDERS[user?.profileBorder || 'default'];
  
  const displayImage = uploading && previewUrl 
    ? previewUrl 
    : (user?.profilePic || ASSETS.NO_PFP);

  return (
    <div 
      className={`relative rounded-full p-[2px] ${border?.class || ''} ${className || 'w-10 h-10'} ${editable || onClick ? 'cursor-pointer' : ''} flex-shrink-0 transition-transform hover:scale-105 overflow-hidden`}
      onClick={handleAvatarClick}
      style={user?.profileBorder === 'custom' && user.customColor ? { 
        boxShadow: `0 0 10px ${user.customColor}`, 
        borderColor: user.customColor, 
        borderStyle: 'solid', 
        borderWidth: '2px' 
      } : {}}
      title={editable && !uploading ? 'Click to change avatar' : ''}
    >
      <div className="relative w-full h-full rounded-full overflow-hidden bg-bg-card">
        <img 
          src={displayImage} 
          className={`w-full h-full object-cover transition-all duration-300 ${uploading ? 'opacity-30 scale-110 blur-sm' : 'opacity-100 scale-100'}`}
          alt="Avatar"
          loading="lazy"
          onError={(e) => { 
            const target = e.target as HTMLImageElement;
            if (!uploading && !previewUrl && target.src !== ASSETS.NO_PFP) {
              console.error('Avatar failed to load:', displayImage);
              target.src = ASSETS.NO_PFP;
            }
          }}
        />
        
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full backdrop-blur-sm">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mb-1"></div>
            <span className="text-[8px] text-white font-bold tracking-wide">Uploading...</span>
          </div>
        )}
        
        {editable && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 transition-all rounded-full opacity-0 hover:opacity-100">
            <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </div>
      
      {editable && (
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" 
          onChange={handleFileChange} 
          className="hidden"
          disabled={uploading}
        />
      )}
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>({}); 
  const [categories, setCategories] = useState<string[]>(['[Bedrock] Add-On', '[Bedrock] Map', '[Bedrock] Texture-Pack', '[Bedrock] Skins', '[Bedrock] Shaders', '[Java] Mods', '[Java] Texture-Pack', '[Java] MCModels', '[Java] Map', '[Java] Plugins', '[Java] Shaders']);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [showChangelog, setShowChangelog] = useState(false);
  
  // Admin UI State
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'content'>('overview');

  // Modal State
  const [activeModal, setActiveModal] = useState<'upload' | 'detail' | 'profile' | 'editProfile' | 'category' | 'admin' | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [viewProfileUser, setViewProfileUser] = useState<User | null>(null);
  
  // Forms
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [uploadFormInit, setUploadFormInit] = useState<Partial<Item>>({});
  const [editProfileForm, setEditProfileForm] = useState<Partial<User>>({});
  const [ratingInput, setRatingInput] = useState(0);
  const [reviewInput, setReviewInput] = useState('');
  
  // Gallery
  const [slideIndex, setSlideIndex] = useState(0);
  const autoScrollRef = useRef<any>(null);

  // --- EFFECTS ---

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u: any) => {
      setCurrentUser(u);
      if (u) {
        db.ref(`users/${u.uid}`).on('value', (snapshot: any) => {
          const val = snapshot.val();
          if (val?.banned) {
            showToast("You have been banned.");
            auth.signOut();
            return;
          }
          if (val) {
            val.uid = u.uid;
            setUserData(val);
            userCache[u.uid] = val; 
          }
        });
      } else {
        setUserData(null);
      }
    });

    // Optimization: limit to last 100 items for faster initial load
    const itemsRef = db.ref('items').limitToLast(100);
    const handleItems = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const itemsArr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setItems(itemsArr.reverse());
      } else {
        setItems([]);
      }
      setLoading(false);
    };
    
    itemsRef.on('value', handleItems);

    // Categories
    db.ref('categories').on('value', (snapshot: any) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        // Ensure categories is always an array
        setCategories(Array.isArray(val) ? val : Object.values(val));
      }
    });

    return () => {
      unsubAuth();
      itemsRef.off('value', handleItems);
    };
  }, []);

  useEffect(() => {
    if (selectedItem && currentUser) {
       const existing = selectedItem.ratings?.[currentUser.uid];
       if (existing) {
         setRatingInput(existing.rating);
         setReviewInput(existing.review || '');
       } else {
         setRatingInput(0);
         setReviewInput('');
       }
    } else {
       setRatingInput(0);
       setReviewInput('');
    }
    setShowChangelog(false);
  }, [selectedItem, currentUser]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    // Optimization: Only fetch all users when admin dashboard is open
    // Added limit to prevent crashing with thousands of users, though ideal is pagination
    if (activeModal === 'admin' && hasPermission(userData, PERMISSIONS.VIEW_ADMIN_DASHBOARD)) {
       const ref = db.ref('users').limitToLast(100); 
       const listener = ref.on('value', (snapshot: any) => {
         setUsers(snapshot.val() || {});
       });
       return () => ref.off('value', listener);
    }
  }, [activeModal, userData]);

  useEffect(() => {
    if (activeModal === 'profile' && selectedProfileId) {
       if (userCache[selectedProfileId]) {
         setViewProfileUser(userCache[selectedProfileId]);
       } else {
         db.ref(`users/${selectedProfileId}`).once('value').then((snap: any) => {
           const val = snap.val();
           if (val) {
             userCache[selectedProfileId] = val;
             setViewProfileUser(val);
           }
         });
       }
    } else {
      setViewProfileUser(null);
    }
  }, [activeModal, selectedProfileId]);

  useEffect(() => {
    if (activeModal === 'detail' && selectedItem) {
      const totalSlides = (selectedItem.gallery?.length || 0) > 0 ? selectedItem.gallery!.length : 1;
      if (totalSlides > 1) {
        autoScrollRef.current = setInterval(() => {
          setSlideIndex((prev) => (prev + 1) % totalSlides);
        }, 4000);
      }
    }
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [activeModal, selectedItem]);

  // --- HANDLERS ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;

    const trimmedInput = authEmail.trim();
    if (!trimmedInput) {
      showToast("Please enter a username or email.");
      return;
    }
    setAuthLoading(true);

    let email = trimmedInput;
    if (!email.includes('@')) {
      email = `${trimmedInput}@vcm.com`;
    }
    
    try {
      if (authMode === 'register') {
        const cred = await auth.createUserWithEmailAndPassword(email, authPass);
        if (cred.user) {
          const username = trimmedInput.includes('@') ? trimmedInput.split('@')[0] : trimmedInput;
          await db.ref(`users/${cred.user.uid}`).set({
            username: username,
            role: 'user',
            banned: false,
            muted: false,
            profilePic: ASSETS.NO_PFP,
            profileBorder: 'default'
          });
        }
        showToast('Registered! You are now logged in.');
      } else {
        await auth.signInWithEmailAndPassword(email, authPass);
      }
      setSidebarOpen(false);
      setAuthEmail('');
      setAuthPass('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') showToast('Invalid Password.');
      else if (err.code === 'auth/user-not-found') showToast('User not found.');
      else if (err.code === 'auth/invalid-email') showToast('Invalid email or username format.');
      else showToast(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUploadSubmit = async (formData: Partial<Item>) => {
    if (!currentUser) return;
    if (userData?.muted) return showToast("You are muted and cannot upload.");

    const isEdit = !!formData.id;
    const timestamp = Date.now();
    
    const payload: Partial<Item> = {
      title: formData.title,
      desc: formData.desc,
      cat: formData.cat || categories[0],
      link: formData.link,
      youtube: formData.youtube || '',
      originalCreator: formData.originalCreator || '',
      img: formData.img,
      gallery: formData.gallery || [],
    };

    if (isEdit) {
      const originalItem = items.find(i => i.id === formData.id);
      if (!originalItem) return;
      if (!canEditItem(userData, originalItem.authorId)) return showToast("Permission denied.");

      const newChangelog = [...(originalItem.changelog || [])];
      newChangelog.push({ version: 'Update', text: 'Updated details', timestamp });

      await db.ref(`items/${formData.id}`).update({ ...payload, changelog: newChangelog });
      showToast('Updated!');
    } else {
      await db.ref('items').push({
        ...payload,
        authorId: currentUser.uid,
        author: userData?.username || 'User',
        changelog: [{ version: 'v1.0', text: 'Initial Release', timestamp }],
        featured: false,
      });
      showToast('Posted!');
    }
  };

  const handleDeleteItem = async (id: string, authorId: string) => {
    if (!canEditItem(userData, authorId)) return showToast("Permission denied.");
    if (window.confirm('Delete this item permanently?')) {
      await db.ref(`items/${id}`).set(null);
      if (activeModal === 'detail') setActiveModal(null);
    }
  };

  const handleToggleFeature = async (item: Item) => {
    if (!hasPermission(userData, PERMISSIONS.FEATURE_POSTS)) return;
    await db.ref(`items/${item.id}`).update({ featured: !item.featured });
  };

  const handleAdminUpdateUser = async (uid: string, data: Partial<User>) => {
     if (!currentUser) return;
     await db.ref(`users/${uid}`).update(data);
  };

  const handleRating = async (itemId: string, ratingVal: number, review: string) => {
    if (!currentUser) return showToast("Please login to rate.");
    if (userData?.muted) return showToast("You are muted.", 5000);
    
    const item = items.find(i => i.id === itemId);
    if (item && item.authorId === currentUser.uid) {
        return showToast("You cannot rate your own creation.");
    }

    try {
      await db.ref(`items/${itemId}/ratings/${currentUser.uid}`).set({
        userId: currentUser.uid,
        username: userData?.username || 'User',
        rating: ratingVal,
        review,
        timestamp: Date.now()
      });
      showToast("Review submitted!");
    } catch (e) {
      console.error(e);
      showToast("Error submitting review.");
    }
  };

  // --- FILTERING ---
  const featuredItems = useMemo(() => items.filter(i => i.featured), [items]);

  const filteredItems = useMemo(() => {
    let res = items.filter(i => 
      i.title.toLowerCase().includes(debouncedSearch.toLowerCase()) && 
      (!catFilter || i.cat === catFilter)
    );
    res.sort((a, b) => {
      if (sortBy === 'highest_rating') return calculateAvgRating(b.ratings) - calculateAvgRating(a.ratings);
      if (sortBy === 'oldest') return (a.changelog?.[0]?.timestamp || 0) - (b.changelog?.[0]?.timestamp || 0);
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      // newest default
      const timeA = a.changelog?.[a.changelog.length - 1]?.timestamp || 0;
      const timeB = b.changelog?.[b.changelog.length - 1]?.timestamp || 0;
      return timeB - timeA;
    });
    return res;
  }, [items, debouncedSearch, catFilter, sortBy]);

  const itemsPerPage = 30;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const renderProfilePic = (u: User, size = 'w-10 h-10', onClick?: () => void) => {
    const border = BORDERS[u.profileBorder || 'default'];
    return (
      <div 
        className={`relative rounded-full p-[2px] ${border?.class} ${size} cursor-pointer flex-shrink-0 transition-all hover:scale-105`}
        onClick={onClick}
        style={u.profileBorder === 'custom' && u.customColor ? { boxShadow: `0 0 10px ${u.customColor}`, borderColor: u.customColor, borderStyle: 'solid', borderWidth: '2px' } : {}}
      >
        <img 
          src={u.profilePic || ASSETS.NO_PFP} 
          className="w-full h-full rounded-full object-cover bg-bg-card" 
          alt={u.username} 
          onError={(e) => { (e.target as HTMLImageElement).src = ASSETS.NO_PFP; }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex font-sans text-gray-200 bg-bg-body selection:bg-primary/30 selection:text-white">
      
      {/* Sidebar Toggle (Mobile) */}
      <button 
        className="fixed top-4 right-4 z-50 p-2 glass-panel rounded-lg md:hidden shadow-xl"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 h-full bg-bg-sidebar backdrop-blur-xl border-r border-border-color transform transition-transform duration-300 ease-in-out p-6 flex flex-col shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-8 w-full flex justify-center py-4 border-b border-white/5">
          <img 
            src={ASSETS.TITLE} 
            alt="Visual Craft" 
            className="w-full h-auto object-contain max-h-20 filter drop-shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:scale-105 transition-transform duration-500"
          />
        </div>

        {!currentUser ? (
          <div className="space-y-4 animate-fade-in flex-1">
            <h3 className="font-semibold text-lg text-center tracking-tight text-white">Access Portal</h3>
            <form onSubmit={handleAuth} className="space-y-3">
              <input 
                className="w-full bg-bg-input border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none transition-all placeholder:text-gray-500 focus:ring-1 focus:ring-primary/50"
                placeholder="Username or Email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
              />
              <input 
                type="password"
                className="w-full bg-bg-input border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none transition-all placeholder:text-gray-500 focus:ring-1 focus:ring-primary/50"
                placeholder="Password (min 6)"
                value={authPass}
                onChange={e => setAuthPass(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full bg-primary hover:bg-primary-light py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 text-white mt-2 disabled:opacity-50 disabled:cursor-wait"
              >
                 {authLoading ? <Loader2 className="animate-spin" size={16}/> : (authMode === 'login' ? <LogIn size={16}/> : <UserPlus size={16}/>)}
                 {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register')}
              </button>
            </form>
            <button 
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-xs text-text-muted hover:text-white w-full text-center mt-2 transition-colors"
            >
              {authMode === 'login' ? 'Create an account' : 'Back to Login'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-6 cursor-pointer hover:bg-white/10 transition-all border border-white/5 group" onClick={() => { setEditProfileForm(userData || {}); setActiveModal('editProfile'); }}>
              {userData && renderProfilePic(userData, 'w-10 h-10')}
              <div className="overflow-hidden">
                <h3 className="font-bold truncate text-sm group-hover:text-primary-light transition-colors text-white">{userData?.username}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> Online</p>
                   <span className="text-[10px] uppercase bg-black/20 px-1.5 py-0.5 rounded border border-white/5 text-text-muted font-bold">{userData?.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => { setUploadFormInit({}); setActiveModal('upload'); }} className="w-full py-3 px-4 bg-primary hover:bg-primary-light rounded-xl flex items-center gap-3 font-semibold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 text-white text-sm">
                <Upload size={18} /> Upload Creation
              </button>
              
              {/* Admin Menu */}
              {hasPermission(userData, PERMISSIONS.VIEW_ADMIN_DASHBOARD) && (
                <div className="mt-6 pt-4 border-t border-white/5">
                   <p className="text-[10px] text-text-muted font-bold mb-3 px-1 uppercase tracking-widest">Management</p>
                   
                   <button onClick={() => setActiveModal('admin')} className="w-full py-2.5 px-4 bg-white/5 text-gray-300 hover:text-white border border-transparent hover:border-white/5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all mb-2 text-sm group">
                     <Shield size={16} className="text-gray-500 group-hover:text-red-400 transition-colors"/> Dashboard
                   </button>
                   
                   {hasPermission(userData, PERMISSIONS.MANAGE_CATEGORIES) && (
                     <button onClick={() => setActiveModal('category')} className="w-full py-2.5 px-4 bg-white/5 text-gray-300 hover:text-white border border-transparent hover:border-white/5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all text-sm group">
                       <Hash size={16} className="text-gray-500 group-hover:text-yellow-400 transition-colors"/> Categories
                     </button>
                   )}
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/5">
                <button onClick={() => auth.signOut()} className="text-xs text-text-muted hover:text-red-400 flex items-center gap-2 w-full px-4 py-3 rounded-xl hover:bg-white/5 transition-all font-medium">
                  <LogOut size={14}/> Sign Out
                </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-6 md:p-8 max-w-[1600px] mx-auto w-full min-h-screen">
        
        {/* Featured Items Carousel */}
        {featuredItems.length > 0 && (
           <FeaturedCarousel items={featuredItems} onItemClick={(item) => { setSelectedItem(item); setActiveModal('detail'); }} />
        )}

        {/* Search & Filter Toolbar */}
        <div className="relative z-30 flex flex-col md:flex-row gap-4 mb-8 glass-panel p-2 md:p-3 rounded-2xl shadow-lg items-center bg-bg-card border border-white/5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search marketplace..." 
              className="w-full bg-transparent border-none rounded-xl pl-12 pr-4 py-3 focus:ring-0 text-white placeholder:text-gray-600 font-medium font-sans"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); }}
            />
          </div>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block mx-2"></div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto px-2">
            <CustomDropdown 
              options={[
                { label: 'All Categories', value: '' }, 
                ...categories.map(c => ({ label: c, value: c }))
              ]} 
              value={catFilter} 
              onChange={(val) => { setCatFilter(val); setPage(1); }}
              icon={Filter}
              className="w-full md:w-48"
            />
            
            <CustomDropdown 
              options={[
                { label: 'Newest First', value: 'newest' },
                { label: 'Top Rated', value: 'highest_rating' },
                { label: 'Oldest First', value: 'oldest' },
              ]} 
              value={sortBy} 
              onChange={setSortBy}
              icon={SortAsc}
              className="w-full md:w-48"
            />
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {loading ? (
             [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            currentItems.map(item => {
              const avg = calculateAvgRating(item.ratings);
              const canEdit = canEditItem(userData, item.authorId);

              return (
                <div key={item.id} className="group bg-bg-card border border-border-color rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-200 shadow-md hover:shadow-xl hover:-translate-y-1 transform transition-transform flex flex-col relative h-full">
                  
                  {item.featured && (
                    <div className="absolute top-0 right-0 z-20 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-lg">
                      FEATURED
                    </div>
                  )}

                  <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={() => { setSelectedItem(item); setSlideIndex(0); setActiveModal('detail'); }}>
                    {/* Old Card Style - Stable Image */}
                    <LazyImage 
                      src={item.img} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider text-white border border-white/10">{item.cat}</span>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-1 truncate text-white leading-tight font-sans">{item.title}</h3>
                    <div className="flex items-center gap-2 mb-4 text-text-muted text-xs">
                        <UserAvatar userId={item.authorId} className="w-4 h-4" />
                        <span className="truncate hover:text-white transition-colors">{item.author}</span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-yellow-400">
                        <Star size={14} fill={avg > 0 ? "currentColor" : "none"} className={avg === 0 ? "text-gray-600" : ""} />
                        <span className="text-sm font-bold text-gray-200">{avg > 0 ? avg.toFixed(1) : "-"}</span>
                        <span className="text-xs text-gray-600">({Object.keys(item.ratings || {}).length})</span>
                      </div>
                      
                      <div className="flex gap-2">
                         {canEdit && (
                            <button onClick={() => { setUploadFormInit(item); setActiveModal('upload'); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit size={14} /></button>
                         )}
                         <button onClick={() => { setSelectedItem(item); setActiveModal('detail'); }} className="bg-white/5 hover:bg-white/10 text-primary-light text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-white/5">
                           Details
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {!loading && filteredItems.length === 0 && (
           <div className="text-center py-32 text-gray-600">
             <div className="text-7xl mb-6 opacity-20 animate-pulse">📦</div>
             <p className="text-xl font-medium text-text-muted">No items found</p>
             <p className="text-sm mt-2 text-gray-600">Try adjusting your search filters</p>
           </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
           <div className="flex justify-center items-center gap-6 mt-16 mb-8">
             <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-3 rounded-full bg-bg-card border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors shadow-lg"><ChevronLeft size={20}/></button>
             <span className="text-sm font-bold tracking-widest text-text-muted">PAGE {page} / {totalPages}</span>
             <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-3 rounded-full bg-bg-card border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors shadow-lg"><ChevronRight size={20}/></button>
           </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* Admin Dashboard - COMPLETE RESPONSIVE OVERHAUL */}
      {activeModal === 'admin' && hasPermission(userData, PERMISSIONS.VIEW_ADMIN_DASHBOARD) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel w-full h-full md:max-w-7xl md:h-[90vh] md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl bg-[#09090b] border-none md:border md:border-white/10">
             
             {/* Admin Sidebar / Topbar for Mobile */}
             <div className="w-full md:w-64 bg-bg-sidebar border-b md:border-b-0 md:border-r border-border-color flex flex-row md:flex-col p-4 gap-4 md:gap-0 shrink-0 overflow-x-auto md:overflow-visible items-center md:items-stretch">
               <div className="flex items-center gap-2 mb-0 md:mb-8 px-2 text-white shrink-0">
                 <Shield className="text-primary" />
                 <span className="font-bold text-lg tracking-tight hidden md:inline">Admin Center</span>
               </div>
               
               <nav className="flex flex-row md:flex-col gap-2 flex-1 md:space-y-1">
                 <button 
                  onClick={() => setAdminTab('overview')}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${adminTab === 'overview' ? 'bg-primary/10 text-primary-light' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                 >
                   <LayoutDashboard size={18} /> <span className="hidden sm:inline">Overview</span>
                 </button>
                 <button 
                  onClick={() => setAdminTab('users')}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${adminTab === 'users' ? 'bg-primary/10 text-primary-light' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                 >
                   <Users size={18} /> <span className="hidden sm:inline">Users</span>
                 </button>
                 <button 
                  onClick={() => setAdminTab('content')}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${adminTab === 'content' ? 'bg-primary/10 text-primary-light' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                 >
                   <FileText size={18} /> <span className="hidden sm:inline">Content</span>
                 </button>
               </nav>

               <div className="mt-auto px-2 hidden md:block">
                 <button onClick={() => setActiveModal(null)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                   <LogOut size={14}/> Exit Dashboard
                 </button>
               </div>
               
               {/* Mobile Exit Button */}
               <button onClick={() => setActiveModal(null)} className="md:hidden p-2 text-gray-400 hover:text-white">
                 <X size={20}/>
               </button>
             </div>

             {/* Admin Main Content */}
             <div className="flex-1 flex flex-col overflow-hidden bg-bg-body">
               {/* Header */}
               <header className="h-16 border-b border-border-color flex items-center justify-between px-4 md:px-8 bg-bg-sidebar/50 shrink-0">
                 <h2 className="text-xl font-bold text-white capitalize">{adminTab}</h2>
                 <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 hidden sm:inline">Administrator: <span className="text-white font-medium">{userData?.username}</span></span>
                    <UserIcon size={20} className="sm:hidden text-gray-400"/>
                 </div>
               </header>

               {/* Tab Content */}
               <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                 
                 {/* OVERVIEW TAB */}
                 {adminTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        {/* Stat Card 1 */}
                        <div className="bg-bg-card p-6 rounded-2xl border border-border-color">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
                              <h3 className="text-3xl font-bold text-white mt-1">{Object.keys(users).length}</h3>
                            </div>
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20}/></div>
                          </div>
                          <div className="flex items-center text-xs text-green-400 gap-1"><BarChart3 size={12}/> <span>+12% from last month</span></div>
                        </div>
                        {/* Stat Card 2 */}
                        <div className="bg-bg-card p-6 rounded-2xl border border-border-color">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</p>
                              <h3 className="text-3xl font-bold text-white mt-1">{items.length}</h3>
                            </div>
                            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><FileText size={20}/></div>
                          </div>
                          <div className="flex items-center text-xs text-green-400 gap-1"><CheckCircle2 size={12}/> <span>Active Listings</span></div>
                        </div>
                         {/* Stat Card 3 */}
                         <div className="bg-bg-card p-6 rounded-2xl border border-border-color">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Used</p>
                              <h3 className="text-3xl font-bold text-white mt-1">4.2 GB</h3>
                            </div>
                            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><AlertCircle size={20}/></div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 gap-1"><span>Simulated Metric</span></div>
                        </div>
                      </div>

                      <div className="bg-bg-card rounded-2xl border border-border-color overflow-hidden">
                        <div className="p-6 border-b border-border-color">
                          <h4 className="font-bold text-white">Recent Activity</h4>
                        </div>
                        <div className="p-6 text-sm text-gray-500 text-center italic">
                           Activity logs coming soon...
                        </div>
                      </div>
                    </div>
                 )}

                 {/* USERS TAB */}
                 {adminTab === 'users' && (
                   <div className="animate-fade-in flex flex-col h-full">
                     <div className="flex justify-between items-center mb-6">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14}/>
                          <input placeholder="Search users..." className="w-full bg-bg-input border border-border-color rounded-lg pl-9 pr-3 py-2 text-sm focus:border-primary/50 outline-none text-white"/>
                        </div>
                     </div>
                     <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden flex-1">
                        <div className="overflow-x-auto h-full">
                          <table className="w-full admin-table text-left border-collapse min-w-[600px]">
                            <thead className="sticky top-0 z-10 bg-[#121214] shadow-sm">
                              <tr>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">User</th>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Role</th>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Status</th>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {Object.entries(users).map(([uid, rawUser]) => {
                                const u = rawUser as User;
                                return (
                                <tr key={uid} className="group hover:bg-white/5 transition-colors even:bg-white/5">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                    <img 
                                      src={u.profilePic || ASSETS.NO_PFP} 
                                      className="w-8 h-8 rounded-full object-cover bg-gray-800"
                                      alt={u.username || 'User'}
                                      loading="lazy"
                                      onError={(e) => { 
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== ASSETS.NO_PFP) {
                                          console.error('Profile pic failed to load:', u.profilePic);
                                          target.src = ASSETS.NO_PFP;
                                        }
                                      }}
                                    />
                                      <div>
                                        <p className="text-white font-medium text-sm">{u.username}</p>
                                        <p className="text-xs text-gray-500">{uid.substring(0,8)}...</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                      ${u.role === 'owner' ? 'bg-red-500/10 text-red-500' : 
                                        u.role === 'admin' ? 'bg-orange-500/10 text-orange-500' :
                                        u.role === 'staff' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-400'
                                      }`}>
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      {u.banned && <span className="text-[10px] bg-red-500 text-black px-1.5 py-0.5 rounded font-bold">BANNED</span>}
                                      {u.muted && <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold">MUTED</span>}
                                      {!u.banned && !u.muted && <span className="text-[10px] text-green-500 font-medium">Active</span>}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2 opacity-100 md:opacity-50 group-hover:opacity-100 transition-opacity">
                                      {/* Simplified Actions for visual cleanliness */}
                                      {hasPermission(userData, PERMISSIONS.MANAGE_ROLES) && u.role !== 'owner' && (
                                         <CustomDropdown 
                                            options={[{label:'User',value:'user'},{label:'Staff',value:'staff'},{label:'Admin',value:'admin'}]}
                                            value={u.role}
                                            onChange={(val) => handleAdminUpdateUser(uid, {role: val as any})}
                                            className="w-24"
                                            buttonClassName="bg-black/40 text-xs py-1 px-2 h-7 border border-white/10 rounded"
                                         />
                                      )}
                                      {hasPermission(userData, PERMISSIONS.MODERATE_USERS) && (
                                        <>
                                          <button onClick={() => handleAdminUpdateUser(uid, {muted: !u.muted})} className={`p-1.5 rounded hover:bg-white/10 ${u.muted ? 'text-yellow-500' : 'text-gray-400'}`} title="Mute/Unmute"><MicOff size={14}/></button>
                                          <button onClick={() => handleAdminUpdateUser(uid, {banned: !u.banned})} className={`p-1.5 rounded hover:bg-white/10 ${u.banned ? 'text-red-500' : 'text-gray-400'}`} title="Ban/Unban"><Ban size={14}/></button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                              })}
                            </tbody>
                          </table>
                        </div>
                     </div>
                   </div>
                 )}
                 
                 {/* CONTENT TAB */}
                 {adminTab === 'content' && (
                    <div className="animate-fade-in">
                      <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full admin-table text-left border-collapse min-w-[600px]">
                            <thead className="sticky top-0 z-10 bg-[#121214] shadow-sm">
                              <tr>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Item</th>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Category</th>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Author</th>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Status</th>
                                <th className="py-4 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider bg-[#121214]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {items.map(item => (
                                <tr key={item.id} className="group hover:bg-white/5 transition-colors even:bg-white/5">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <LazyImage src={item.img} className="w-10 h-10 rounded object-cover" containerClassName="w-10 h-10 rounded"/>
                                      <div>
                                        <p className="text-white font-medium text-sm truncate max-w-[150px] md:max-w-[200px]">{item.title}</p>
                                        <p className="text-xs text-gray-500">{new Date(item.changelog?.[0]?.timestamp || 0).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4"><span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{item.cat}</span></td>
                                  <td className="py-3 px-4"><span className="text-sm text-gray-300">{item.author}</span></td>
                                  <td className="py-3 px-4">
                                    {item.featured ? <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">Featured</span> : <span className="text-xs text-gray-600">Standard</span>}
                                  </td>
                                  <td className="py-3 px-4">
                                     <div className="flex gap-2">
                                       <button onClick={() => handleDeleteItem(item.id, item.authorId)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/5 rounded"><Trash2 size={14}/></button>
                                       <button onClick={() => handleToggleFeature(item)} className={`p-1.5 rounded hover:bg-white/5 ${item.featured ? 'text-yellow-500' : 'text-gray-400'}`}><Award size={14}/></button>
                                     </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                 )}

               </div>
             </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {activeModal === 'detail' && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#121214] w-full h-full md:max-w-6xl md:max-h-[95vh] overflow-y-auto md:rounded-3xl shadow-2xl relative border-none md:border md:border-white/10 flex flex-col lg:flex-row overflow-x-hidden">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 z-30 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors border border-white/10 text-white"><X size={20}/></button>
            
            {/* Left: Gallery */}
            <div className="lg:w-2/3 bg-black relative min-h-[300px] lg:min-h-[400px] flex flex-col shrink-0">
                <div className="flex-1 relative flex items-center justify-center bg-[#050505]">
                    <div className="absolute inset-0 opacity-20 blur-3xl" style={{backgroundImage: `url(${selectedItem.gallery?.[slideIndex] || selectedItem.img})`, backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
                    <LazyImage 
                        src={(selectedItem.gallery && selectedItem.gallery.length > 0) ? selectedItem.gallery[slideIndex] : selectedItem.img} 
                        className="max-w-full max-h-[50vh] lg:max-h-[60vh] object-contain relative z-10 shadow-2xl"
                        containerClassName="w-full h-full flex items-center justify-center p-4"
                    />
                      {/* Navigation Arrows */}
                    {selectedItem.gallery && selectedItem.gallery.length > 1 && (
                        <>
                        <button onClick={() => setSlideIndex(prev => prev === 0 ? (selectedItem.gallery?.length||1)-1 : prev-1)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full hover:bg-primary transition-colors border border-white/10 text-white"><ChevronLeft/></button>
                        <button onClick={() => setSlideIndex(prev => prev === (selectedItem.gallery?.length||1)-1 ? 0 : prev+1)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full hover:bg-primary transition-colors border border-white/10 text-white"><ChevronRight/></button>
                        </>
                    )}
                </div>
                {/* Thumbnails */}
                {selectedItem.gallery && selectedItem.gallery.length > 1 && (
                    <div className="bg-[#0a0a0c] p-4 flex justify-center gap-3 overflow-x-auto border-t border-white/5">
                        {selectedItem.gallery.map((img, idx) => (
                            <button 
                            key={idx} 
                            onClick={() => setSlideIndex(idx)}
                            className={`w-14 h-10 md:w-16 md:h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${idx === slideIndex ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            >
                              <LazyImage src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Info */}
            <div className="lg:w-1/3 p-6 lg:p-10 flex flex-col bg-[#121214] h-full overflow-y-auto custom-scrollbar border-l border-white/5 pb-20 lg:pb-6">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                          <span className="bg-primary/10 text-primary-light px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-primary/20">{selectedItem.cat}</span>
                          {selectedItem.featured && <span className="bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-yellow-500/20">Featured</span>}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4 text-white font-sans">{selectedItem.title}</h2>
                    
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {setActiveModal('profile'); setSelectedProfileId(selectedItem.authorId);}}>
                            <UserAvatar userId={selectedItem.authorId} className="w-10 h-10 group-hover:ring-2 ring-primary transition-all" />
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Created By</p>
                                <p className="font-bold group-hover:text-primary transition-colors text-white">{selectedItem.author}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 font-bold uppercase">Updated</p>
                            <p className="font-mono text-sm text-gray-300">{new Date(selectedItem.changelog?.[selectedItem.changelog.length-1]?.timestamp || 0).toLocaleDateString()}</p>
                          </div>
                    </div>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-gray-300 mb-8">
                      <ReactMarkdown>{selectedItem.desc}</ReactMarkdown>
                </div>

                {/* Changelog Section (Expandable/Collapsible) */}
                {selectedItem.changelog && selectedItem.changelog.length > 0 && (
                  <div className="mb-8 border border-white/10 rounded-xl overflow-hidden bg-white/5">
                    <button 
                      onClick={() => setShowChangelog(!showChangelog)}
                      className="flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold text-gray-300"
                    >
                      <div className="flex items-center gap-2"><History size={16}/> Version History</div>
                      {showChangelog ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                    {showChangelog && (
                      <div className="p-2 space-y-1 animate-fade-in bg-[#0e0e10]">
                        {selectedItem.changelog.slice().reverse().map((log, i) => (
                          <div key={i} className="p-3 rounded-lg hover:bg-white/5">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-primary-light font-mono bg-primary/10 px-1.5 py-0.5 rounded">{log.version}</span>
                                <span className="text-[10px] text-gray-600">{new Date(log.timestamp).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-gray-400">{log.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                    <DownloadButton href={selectedItem.link} sizeStr="Download Now" />
                    
                    {selectedItem.youtube && (
                        <a href={selectedItem.youtube} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#FF0000]/10 hover:bg-[#FF0000] text-[#FF0000] hover:text-white border border-[#FF0000]/30 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all">
                            <Play size={18} fill="currentColor" /> Watch Trailer
                        </a>
                    )}

                    <div className="flex gap-2 pt-2">
                          {canEditItem(userData, selectedItem.authorId) && (
                              <button onClick={() => { setUploadFormInit(selectedItem); setActiveModal('upload'); }} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold text-sm transition-colors border border-white/5 text-gray-300 hover:text-white">
                                Edit
                              </button>
                          )}
                          {(canEditItem(userData, selectedItem.authorId) || hasPermission(userData, PERMISSIONS.MANAGE_CONTENT)) && (
                              <button onClick={() => handleDeleteItem(selectedItem.id, selectedItem.authorId)} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors border border-red-500/20">
                                <Trash2 size={18} />
                              </button>
                          )}
                    </div>
                </div>

                 {/* --- RATING & REVIEWS SECTION --- */}
                 <div className="mt-8 border-t border-white/5 pt-6">
                    <h3 className="font-bold text-lg text-white mb-4">Reviews</h3>
                    
                    {/* Rating Input Logic */}
                    {currentUser ? (
                       currentUser.uid === selectedItem.authorId ? (
                           <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/5 text-center">
                               <p className="text-gray-400 text-sm font-medium">You cannot rate your own creation.</p>
                           </div>
                       ) : (
                        <div className="bg-bg-input p-4 rounded-xl mb-6 border border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                key={star}
                                onClick={() => setRatingInput(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star 
                                  size={20} 
                                  className={star <= ratingInput ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} 
                                />
                              </button>
                            ))}
                          </div>
                          <textarea 
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none placeholder:text-gray-600"
                            placeholder="Write a review..."
                            rows={2}
                            value={reviewInput}
                            onChange={(e) => setReviewInput(e.target.value)}
                          />
                          <button 
                            onClick={() => handleRating(selectedItem.id, ratingInput, reviewInput)}
                            disabled={ratingInput === 0}
                            className="mt-3 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full"
                          >
                            Submit
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="text-gray-500 text-sm mb-6 bg-white/5 p-3 rounded-lg border border-white/5 text-center">Login to review.</p>
                    )}

                    <div className="space-y-4">
                      {selectedItem.ratings && Object.values(selectedItem.ratings).length > 0 ? (
                          (Object.values(selectedItem.ratings) as Rating[])
                          .sort((a,b) => b.timestamp - a.timestamp)
                          .map((r) => (
                            <div key={r.userId} className="border-b border-white/5 pb-4 last:border-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{r.username}</span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={10} className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-800"} />
                                    ))}
                                  </div>
                                </div>
                                <span className="text-[10px] text-gray-600">{new Date(r.timestamp).toLocaleDateString()}</span>
                              </div>
                              {r.review && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{r.review}</p>}
                            </div>
                          ))
                      ) : (
                          <p className="text-gray-700 text-sm italic text-center py-4">No reviews yet.</p>
                      )}
                    </div>
                  </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Edit Modal (Local Component) */}
      {activeModal === 'upload' && (
        <UploadForm 
          initialData={uploadFormInit}
          categories={categories}
          onClose={() => setActiveModal(null)}
          onSubmit={handleUploadSubmit}
        />
      )}

      {/* Edit Profile Modal */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-white/10 bg-[#121214]">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X/></button>
            <h2 className="text-xl font-bold mb-6 text-white">Edit Profile</h2>
            
            <div className="flex justify-center mb-6">
              {renderProfilePic({ ...userData!, ...editProfileForm } as User, 'w-24 h-24')}
            </div>
            
            {/* Same Edit Profile Form as before */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
               {/* Form fields omitted for brevity, keeping existing structure */}
               <div>
                 <label className="text-xs text-gray-500 mb-1 block uppercase font-bold">Profile Picture</label>
                 <label className="flex items-center justify-center w-full h-[46px] bg-[#1a1a1e] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors text-sm text-gray-400">
                    <ImageIcon size={16} className="mr-2"/> Change PFP
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
    
                          if (f.size > 5 * 1024 * 1024) {
                            showToast("Image too large. Max 5MB.", 5000);
                            return;
                          }
                          if (!f.type.startsWith('image/')) {
                            showToast("Please select a valid image file.", 5000);
                            return;
                          }
    
                          try {
                            showToast("Uploading profile picture...", 3000);
                            const url = await uploadToImgBB(f);
                            setEditProfileForm({...editProfileForm, profilePic: url});
                            showToast("Profile picture uploaded successfully! ✓", 5000);
      
                            e.target.value = '';
                          } catch (err) {
                            console.error('Upload error:', err);
                            showToast(err instanceof Error ? err.message : "Failed to upload profile picture. Please try again.", 6000);
                          }
                      }} 
                    className="hidden"/>
                 </label>
               </div>
               <textarea placeholder="Write a short bio..." rows={3} value={editProfileForm.bio || ''} onChange={e => setEditProfileForm({...editProfileForm, bio: e.target.value})} className="w-full bg-[#1a1a1e] border border-white/5 rounded-lg p-3 text-sm outline-none focus:border-primary/50 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-primary/50"/>
               
               <div>
                  <label className="text-xs text-gray-500 mb-2 block uppercase font-bold">Profile Border</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(BORDERS).map(([key, val]) => (
                      <div key={key} onClick={() => setEditProfileForm({...editProfileForm, profileBorder: key})} className={`cursor-pointer p-2 rounded-lg border transition-all ${editProfileForm.profileBorder === key ? 'border-primary bg-primary/10' : 'border-white/5 hover:bg-white/5'}`}>
                        <div className={`w-6 h-6 rounded-full mx-auto bg-gray-700 ${val.class}`}></div>
                        <p className="text-[10px] text-center mt-2 truncate text-gray-400">{val.name}</p>
                      </div>
                    ))}
                  </div>
               </div>
               
               {editProfileForm.profileBorder === 'custom' && (
                  <input type="color" value={editProfileForm.customColor || '#ffffff'} onChange={e => setEditProfileForm({...editProfileForm, customColor: e.target.value})} className="w-full h-8 rounded cursor-pointer"/>
               )}

               <div className="space-y-3 pt-2">
                  <label className="text-xs text-gray-500 uppercase font-bold">Social Links</label>
                   {/* Inputs for socials */}
                  <div className="flex items-center gap-3">
                    <img src={ASSETS.ICON_DC} className="w-6 h-6 grayscale opacity-50" alt="Discord" />
                    <input placeholder="Discord Invite/User" value={editProfileForm.socials?.discord || ''} onChange={e => setEditProfileForm({...editProfileForm, socials: {...editProfileForm.socials, discord: e.target.value}})} className="flex-1 bg-[#1a1a1e] border border-white/5 rounded-lg p-2 text-sm outline-none focus:border-primary/50 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-primary/50"/>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={ASSETS.ICON_YT} className="w-6 h-6 grayscale opacity-50" alt="YouTube" />
                    <input placeholder="YouTube Channel" value={editProfileForm.socials?.youtube || ''} onChange={e => setEditProfileForm({...editProfileForm, socials: {...editProfileForm.socials, youtube: e.target.value}})} className="flex-1 bg-[#1a1a1e] border border-white/5 rounded-lg p-2 text-sm outline-none focus:border-primary/50 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-primary/50"/>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={ASSETS.ICON_WA} className="w-6 h-6 grayscale opacity-50" alt="WhatsApp" />
                    <input placeholder="WhatsApp" value={editProfileForm.socials?.whatsapp || ''} onChange={e => setEditProfileForm({...editProfileForm, socials: {...editProfileForm.socials, whatsapp: e.target.value}})} className="flex-1 bg-[#1a1a1e] border border-white/5 rounded-lg p-2 text-sm outline-none focus:border-primary/50 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-primary/50"/>
                  </div>
               </div>
            </div>

            <button onClick={async () => {
              if(!currentUser) return;
              await db.ref(`users/${currentUser.uid}`).update(editProfileForm);
              setActiveModal(null);
            }} className="w-full bg-primary hover:bg-primary-light mt-6 py-3 rounded-xl font-bold transition-colors text-white">Save Profile</button>
          </div>
        </div>
      )}

      {/* Category Manager (Admin) */}
      {activeModal === 'category' && hasPermission(userData, PERMISSIONS.MANAGE_CATEGORIES) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-sm rounded-2xl p-6 relative border border-white/10 bg-[#121214]">
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X/></button>
              <h3 className="text-xl font-bold mb-4 text-white">Manage Categories</h3>
              
              <div className="flex gap-2 mb-4">
                <input id="newCat" className="flex-1 bg-[#1a1a1e] border border-white/5 rounded-lg p-2 text-sm outline-none text-white focus:ring-1 focus:ring-primary/50" placeholder="New Category"/>
                <button onClick={() => {
                  const el = document.getElementById('newCat') as HTMLInputElement;
                  const val = el.value.trim();
                  if(val && !categories.includes(val)) {
                    // Create new array to safely update firebase
                    const newCats = [...categories, val];
                    db.ref('categories').set(newCats);
                    el.value = '';
                  }
                }} className="bg-primary px-4 rounded-lg text-sm font-bold hover:bg-primary-light text-white">Add</button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map(c => (
                  <div key={c} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-sm font-medium text-gray-300">{c}</span>
                    <button onClick={() => {
                      if(window.confirm(`Delete category "${c}"? This cannot be undone.`)) {
                         const newCats = categories.filter(x => x !== c);
                         db.ref('categories').set(newCats);
                      }
                    }} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
           </div>
         </div>
      )}

    </div>
  );
}
