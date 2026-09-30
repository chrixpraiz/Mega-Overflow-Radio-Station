import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, 
  ListMusic, Search, Moon, Sun, Menu, X, Radio, Clock, 
  CalendarDays, HandHeart, Handshake, BookHeadphones, 
  Facebook, Globe, MessageCircle, Download, 
  Lock, CheckCircle2, AlertCircle, Wifi, WifiOff,
  Crown, Users, Filter, Info, Target, Zap, Mail,
  CreditCard, Check, Loader2, MessageSquare, Link as LinkIcon, Phone,
  Disc, ChevronUp, ChevronRight, Star, TrendingUp, Music2, ShieldCheck, Timer,
  BookOpen, HeartHandshake, Sparkles, ExternalLink, CalendarPlus,
  PlayCircle, RadioTower, Mic
} from 'lucide-react';
import { SAMPLE_STATIONS, SAMPLE_EVENTS } from './constants';
import { AppView, Track, AudiobookItem, RadioEvent } from './types';
import { MORLogo } from './components/MORLogo';
import { revenueCatService } from './services/revenueCatService';
import { RevenueCatModal } from './components/RevenueCatModal';
import { AudiobookPlayerModal } from './components/AudiobookPlayerModal';
import { AudioBibleView } from './components/AudioBibleView';
import { ChatCommunityView } from './components/ChatCommunityView';
import { PartnersView } from './components/PartnersView';
import { VolunteerView } from './components/VolunteerView';
import { SermonsAndEbooksView } from './components/SermonsAndEbooksView';
import { dispatchFormFeedback, FEEDBACK_RECIPIENT_EMAIL } from './firebase';
import { AUDIOBOOK_CATALOG } from './services/audiobookData';
import { presenceService, PresenceStats } from './services/presenceService';

// --- Constants ---
const STATION_ID = 'kks1y4wm7s8uv';

// Stream URLs with resilient fallback endpoints
const getStreamUrls = () => {
  const timestamp = Date.now();
  return [
    `https://stream.radiojar.com/${STATION_ID}?nocache=${timestamp}`,
    `https://stream.radiojar.com/${STATION_ID}`,
    `https://stream.radiojar.com/${STATION_ID}.mp3`,
    `http://stream.radiojar.com/${STATION_ID}?nocache=${timestamp}`,
    `http://stream.radiojar.com/${STATION_ID}`,
    `http://stream.radiojar.com/${STATION_ID}.mp3`,
    `https://www.radiojar.com/api/stations/${STATION_ID}/stream/`,
  ];
};

// Direct RadioJar API endpoints (CORS enabled by RadioJar natively)
const METADATA_URL = `https://www.radiojar.com/api/stations/${STATION_ID}/now_playing/`;
const HISTORY_URL = `https://www.radiojar.com/api/stations/${STATION_ID}/tracks/`;

// Active Global Listener Flags
const LISTENER_FLAGS = ["ðŸ‡§ðŸ‡·", "ðŸ‡¦ðŸ‡º", "ðŸ‡¯ðŸ‡²", "ðŸ‡¨ðŸ‡¦", "ðŸ‡ºðŸ‡¸", "ðŸ‡¬ðŸ‡§", "ðŸ‡³ðŸ‡¬", "ðŸ‡¿ðŸ‡¦", "ðŸ‡¬ðŸ‡­", "ðŸ‡°ðŸ‡ª"];

// Fallback seed history to ensure Recently Played is NEVER empty
const INITIAL_HISTORY: Track[] = [
  {
    id: 'seed-1',
    title: 'It All Belongs to You',
    artist: 'Damitha Hudson',
    album: 'Xclusive Dimension',
    coverUrl: '/mor_logo_square.jpg',
    audioUrl: '',
    isLive: false,
    date: 'Just now',
    duration: '3:18'
  },
  {
    id: 'seed-2',
    title: 'Be Still',
    artist: 'Hillsong Worship',
    album: 'There Is More',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    audioUrl: '',
    isLive: false,
    date: '8 mins ago',
    duration: '8:04'
  },
  {
    id: 'seed-3',
    title: 'What A Life',
    artist: 'Buchi',
    album: 'Gospel Reggae Praise',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    audioUrl: '',
    isLive: false,
    date: '16 mins ago',
    duration: '4:44'
  },
  {
    id: 'seed-4',
    title: 'Pray For Me',
    artist: 'Darey Art Alabi ft. Soweto Choir',
    album: 'Naked',
    coverUrl: 'https://images.unsplash.com/photo-1514525253440-b393452e233e?auto=format&fit=crop&w=400&q=80',
    audioUrl: '',
    isLive: false,
    date: '25 mins ago',
    duration: '3:58'
  },
  {
    id: 'seed-5',
    title: 'Revelation 16 (Audio Drama)',
    artist: 'Faith Comes By Hearing - FCBH',
    album: 'Audio Bible King James Version',
    coverUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    audioUrl: '',
    isLive: false,
    date: '38 mins ago',
    duration: '4:19'
  }
];

// --- Partners Data ---
const PARTNERS = [
  { name: 'CARTDIC', logo: 'https://ui-avatars.com/api/?name=CARTDIC&background=4c1d95&color=86efac&size=128&font-size=0.3&length=7&bold=true' },
  { name: 'GION', logo: 'https://ui-avatars.com/api/?name=GION&background=270a02&color=fff&size=128&font-size=0.4&length=4&bold=true' },
  { name: 'Siloam Foundation', logo: 'https://ui-avatars.com/api/?name=Siloam&background=16a34a&color=bfdbfe&size=128&font-size=0.4&length=6&bold=true' },
  { name: 'Gilead Heart Foundation', logo: 'https://ui-avatars.com/api/?name=Gilead&background=dc2626&color=fff&size=128&font-size=0.4&length=6&bold=true' }
];

// --- Helper Components ---

const MarqueeTitle = ({ text, className, small }: { text: string, className?: string, small?: boolean }) => {
  const shouldMarquee = text.length > (small ? 25 : 20);
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className={`inline-block ${shouldMarquee ? 'animate-marquee' : ''}`}>
        {text}
        {shouldMarquee && <span className="mx-8">{text}</span>}
        {shouldMarquee && <span className="mx-8">{text}</span>}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

const VinylDisplay = ({ cover, isPlaying, theme }: { cover: string, isPlaying: boolean, theme: string }) => (
  <div className="relative group w-64 h-64 md:w-96 md:h-96 flex-shrink-0">
    {/* Vinyl Record */}
    <div className={`relative w-full h-full rounded-full bg-[#141414] shadow-2xl border-[8px] border-[#0f0f0f] flex items-center justify-center overflow-hidden ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'transition-transform duration-700 ease-out'}`} style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
       {/* Vinyl Texture (Grooves) */}
       <div className="absolute inset-0 rounded-full border-[2px] border-[#222222] scale-[0.95] opacity-50"></div>
       <div className="absolute inset-0 rounded-full border-[2px] border-[#222222] scale-[0.90] opacity-50"></div>
       <div className="absolute inset-0 rounded-full border-[2px] border-[#222222] scale-[0.85] opacity-50"></div>
       <div className="absolute inset-0 rounded-full border-[2px] border-[#222222] scale-[0.60] opacity-50"></div>
       
       {/* Reflection */}
       <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-full"></div>

       {/* Center Album Art Label */}
       <div className="w-1/2 h-1/2 rounded-full border-[4px] border-[#0f0f0f] overflow-hidden relative z-10 shadow-inner bg-black flex items-center justify-center">
         <img 
           src={cover || '/mor_logo_square.jpg'} 
           alt="Station Logo / Album Cover" 
           referrerPolicy="no-referrer"
           className="w-full h-full object-cover" 
           onError={(e) => {
             // Fallback to square logo
             (e.target as HTMLImageElement).src = '/mor_logo_square.jpg';
           }}
         />
       </div>
    </div>
    
    {/* Tonearm Graphic */}
    <div className={`absolute -top-6 -right-6 w-28 h-40 pointer-events-none origin-[20px_20px] transition-transform duration-700 ease-in-out z-20 drop-shadow-2xl ${isPlaying ? 'rotate-[25deg]' : 'rotate-0'}`}>
       <svg width="100%" height="100%" viewBox="0 0 100 150" style={{ overflow: 'visible' }}>
          <circle cx="20" cy="20" r="14" fill="#222" stroke="#111" strokeWidth="2" />
          <path d="M 20 20 L 35 100 L 15 120" fill="none" stroke="#e4e4e7" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="5" y="115" width="24" height="30" rx="3" fill="#18181b" transform="rotate(25, 15, 120)" />
       </svg>
    </div>
  </div>
);

// --- Check if scheduled event is live right now ---
const isEventLiveNow = (event: RadioEvent): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isSunday = dayOfWeek === 0;
  const isWedFri = dayOfWeek === 3 || dayOfWeek === 5;

  let dayMatches = false;
  if (event.day.includes('Mon - Fri') && isWeekday) dayMatches = true;
  if (event.day.includes('Wed & Fri') && isWedFri) dayMatches = true;
  if (event.day.includes('Sundays') && isSunday) dayMatches = true;

  if (!dayMatches) return false;

  try {
    const parseTime = (tStr: string) => {
      const parts = tStr.trim().split(' ');
      if (parts.length < 2) return 0;
      const [hStr, mStr] = parts[0].split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr || '0', 10);
      const mod = parts[1].toUpperCase();
      if (mod === 'PM' && h < 12) h += 12;
      if (mod === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const [startPart, endPart] = event.time.split('-');
    if (startPart && endPart) {
      const start = parseTime(startPart);
      const end = parseTime(endPart);
      return currentMinutes >= start && currentMinutes <= end;
    }
  } catch (e) {
    // fallback
  }

  return false;
};

// --- Main App Component ---

const App = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>(AppView.RADIO);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Audio Radio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  
  // Metadata & History State
  const [presence, setPresence] = useState<PresenceStats>({
    totalOnline: 1,
    streamingCount: 0,
    isLiveRealtime: true
  });
  const [metadata, setMetadata] = useState({
    title: 'Mega Overflow Radio',
    artist: '24/7 Word, Worship and Wealth',
    album: 'Kingdom Broadcast',
    cover: '/mor_logo_square.jpg',
    listenerCount: 1,
    activeNations: LISTENER_FLAGS.slice(0, 5)
  });
  const [history, setHistory] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('mor_history_cache');
      return saved ? JSON.parse(saved) : INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFetching, setIsFetching] = useState(false);

  // RevenueCat Subscription State
  const [isSubscribed, setIsSubscribed] = useState(() => revenueCatService.isEntitled());
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Audiobooks State
  const [audiobookSearch, setAudiobookSearch] = useState('');
  const [audiobookFilter, setAudiobookFilter] = useState('All');
  const [selectedBookForPlayer, setSelectedBookForPlayer] = useState<AudiobookItem | null>(null);

  // History & Schedule Search States
  const [historySearch, setHistorySearch] = useState('');
  const [eventsFilter, setEventsFilter] = useState('All');
  const [eventsSearch, setEventsSearch] = useState('');

  // Testimony Form State
  const [testimonyName, setTestimonyName] = useState('');
  const [testimonyContact, setTestimonyContact] = useState('');
  const [testimonyContent, setTestimonyContent] = useState('');
  const [testimonySubmitted, setTestimonySubmitted] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Subscribe to RevenueCat service updates ---
  useEffect(() => {
    const unsubscribe = revenueCatService.subscribe((info) => {
      setIsSubscribed(info.isSubscribed);
    });
    return () => unsubscribe();
  }, []);

  // Theme Persistence
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Real-Time Multi-User Presence & Active Believers ---
  useEffect(() => {
    presenceService.init();
    const unsubscribe = presenceService.subscribe((stats) => {
      setPresence(stats);
      setMetadata(prev => ({
        ...prev,
        listenerCount: stats.totalOnline
      }));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Sync Audio Playback State to Global Real-Time Presence
  useEffect(() => {
    presenceService.setStreamingStatus(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    presenceService.setCurrentView(currentView);
  }, [currentView]);

  // --- Real RadioJar Metadata & Tracks Polling ---
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!navigator.onLine) return;
      setIsFetching(true);
      
      try {
        const [metaRes, histRes] = await Promise.all([
          fetch(METADATA_URL, { cache: 'no-cache' }).catch(() => null),
          fetch(HISTORY_URL, { cache: 'no-cache' }).catch(() => null)
        ]);

        // Process Now Playing Metadata
        if (isMounted && metaRes && metaRes.ok) {
          const data = await metaRes.json();
          // Use actual RadioJar stream listeners if reported by server, combined with real-time app presence
          const actualListeners = data.listeners && typeof data.listeners === 'number' && data.listeners > 0
            ? Math.max(data.listeners, presence.totalOnline)
            : presence.totalOnline;

          setMetadata(prev => ({
            ...prev,
            title: data.track || data.title || 'Mega Overflow Radio',
            artist: data.artist && data.artist !== 'Unknown artist' ? data.artist : 'Word, Worship and Wealth',
            album: data.album || 'Broadcast Live',
            cover: data.thumb || '/mor_logo_square.jpg',
            listenerCount: actualListeners
          }));
        }

        // Process Recently Played History
        if (isMounted && histRes && histRes.ok) {
          const histData = await histRes.json();
          if (Array.isArray(histData) && histData.length > 0) {
            const mappedTracks: Track[] = histData.map((item: any, idx: number) => {
              // Parse date/time
              let timeStr = 'Recently';
              const rawDate = item.tm || item.date;
              if (rawDate) {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                  timeStr = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                  timeStr = String(rawDate);
                }
              }

              return {
                id: item.guid || `hist-${idx}`,
                title: item.track || item.title || 'Gospel Encounter',
                artist: item.artist && item.artist !== 'Unknown artist' ? item.artist : 'Mega Overflow Gospel',
                album: item.album || '',
                coverUrl: item.thumb || '/mor_logo_square.jpg',
                audioUrl: '',
                isLive: false,
                date: timeStr,
                duration: item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : undefined
              };
            });

            setHistory(mappedTracks);
            localStorage.setItem('mor_history_cache', JSON.stringify(mappedTracks));
          }
        }
      } catch (err) {
        console.warn('Live RadioJar sync notice:', err);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20000); // Poll every 20 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sleep Timer Handler
  useEffect(() => {
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    
    if (sleepMinutes !== null && isPlaying) {
      sleepTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
        setSleepMinutes(null);
      }, sleepMinutes * 60 * 1000);
    }
  }, [sleepMinutes, isPlaying]);

  // Volume & Mute Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Toggle Radio Stream
  const togglePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsFetching(true);
      setStreamError(null);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const urls = getStreamUrls();
      let connected = false;

      for (let i = currentStreamIndex; i < urls.length; i++) {
        try {
          audioRef.current.src = urls[i];
          audioRef.current.load();
          await audioRef.current.play();
          setIsPlaying(true);
          setCurrentStreamIndex(i);
          connected = true;
          break;
        } catch (err) {
          console.warn(`Stream attempt ${i + 1} failed:`, err);
        }
      }

      if (!connected) {
        setStreamError('Reconnecting to live radio stream...');
        setCurrentStreamIndex(0);
      }
      setIsFetching(false);
    }
  };

  // --- VIEW RENDERS ---

  // 1. Radio View
  const renderRadioView = () => (
    <div className="flex flex-col h-full overflow-y-auto pb-32 scrollbar-hide relative bg-black">
      {/* Station Title Header */}
      <div className="flex items-center justify-between p-6 md:p-8 pb-2">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-orange-300">
            MEGA OVERFLOW
          </h1>
          <span className="text-2xl md:text-3xl font-black tracking-[0.2em] text-orange-600 uppercase block">
            RADIO
          </span>
          <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mt-2">
            24/7 â€¢ Word, Worship and Wealth Gospel Encounters
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 bg-[#121212] border border-white/10 px-4 py-2 rounded-full shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[11px] font-bold text-white tracking-widest uppercase">Live On Air</span>
        </div>
      </div>

      {/* Main Broadcast Showcase Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-6xl min-h-[460px] rounded-[3rem] relative overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-2xl group flex items-center justify-center p-6 md:p-12">
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-black to-orange-950/20 pointer-events-none" />

          {/* Layout: Vinyl Record Left, Station Metadata Right */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16 w-full">
            {/* Spinning Vinyl Record with Official Station Badge */}
            <div className="flex-shrink-0">
              <VinylDisplay cover={metadata.cover} isPlaying={isPlaying} theme={theme} />
            </div>

            {/* Now Playing Card */}
            <div className="flex flex-col items-center md:items-start justify-center space-y-6 max-w-lg w-full text-center md:text-left">
              {/* Official Brand Logo */}
              <MORLogo className="h-16 md:h-20 w-auto drop-shadow-2xl" />

              <div className="bg-[#121212]/95 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 w-full shadow-2xl relative">
                {/* On Air Status */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                      {isFetching ? 'CONNECTING...' : isPlaying ? 'ON AIR NOW' : 'READY TO STREAM'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                    320 KBPS HD
                  </span>
                </div>

                {/* Track Information */}
                <div className="mb-6">
                  <MarqueeTitle text={metadata.title} className="text-2xl md:text-3xl font-black text-white mb-1.5" />
                  <p className="text-purple-400 font-bold text-base md:text-lg">{metadata.artist}</p>
                  {metadata.album && (
                    <p className="text-gray-400 text-xs mt-1 truncate">{metadata.album}</p>
                  )}
                </div>

                {/* Big Action Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    <span>{isPlaying ? 'Pause Radio' : 'Listen Live'}</span>
                  </button>

                  <button
                    onClick={() => setCurrentView(AppView.RECENTLY_PLAYED)}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-colors"
                    title="View Recently Played History"
                  >
                    <ListMusic className="w-5 h-5 text-orange-400" />
                  </button>
                </div>

                {/* Audience stats */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <strong>{metadata.listenerCount.toLocaleString()}</strong> Active Believers
                  </span>
                  <div className="flex gap-1">
                    {LISTENER_FLAGS.slice(0, 5).map((f, i) => <span key={i} className="text-sm">{f}</span>)}
                  </div>
                </div>

                {/* Voice Prayer Altar Quick Banner */}
                <div 
                  onClick={() => setCurrentView(AppView.CHAT)}
                  className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-purple-900/40 via-purple-950/20 to-orange-950/40 border border-purple-500/30 flex items-center justify-between gap-3 cursor-pointer hover:border-orange-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                      ðŸŽ™ï¸
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                          LIVE VOICE ALTAR
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                        Join Voice Intercession Altar (Speak & Pray)
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 2. Recently Played View (Fixed & Functional)
  const renderRecentlyPlayed = () => {
    const filteredHistory = history.filter(track => 
      track.title.toLowerCase().includes(historySearch.toLowerCase()) || 
      track.artist.toLowerCase().includes(historySearch.toLowerCase()) ||
      (track.album && track.album.toLowerCase().includes(historySearch.toLowerCase()))
    );

    return (
      <div className="p-4 md:p-8 pb-36 max-w-5xl mx-auto h-full overflow-y-auto animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Live Station Log
              </span>
              <span className="text-xs text-green-400 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Synced with Broadcast
              </span>
            </div>
            <h2 className={`text-3xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Recently Played Tracks
            </h2>
            <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Missed a worship hymn or sermon snippet? Discover everything broadcast on Mega Overflow Radio.
            </p>
          </div>

          <div className={`flex items-center px-4 py-2.5 rounded-2xl border ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <Search className="w-4 h-4 opacity-50 mr-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search played song or minister..." 
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full md:w-64"
            />
          </div>
        </div>

        {/* History Track List */}
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Clock className="w-12 h-12 mb-3 text-orange-400" />
              <p className="text-sm">No played tracks found matching your search.</p>
            </div>
          ) : (
            filteredHistory.map((track, i) => {
              const isFirst = i === 0;

              return (
                <div 
                  key={track.id || i}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] ${
                    isFirst 
                      ? 'bg-purple-600/15 border-purple-500/40 shadow-lg' 
                      : theme === 'dark' ? 'bg-[#141414] border-white/5 hover:border-white/20' : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                      <img 
                        src={track.coverUrl || '/mor_logo_square.jpg'} 
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/mor_logo_square.jpg';
                        }}
                      />
                      {isFirst && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-sm md:text-base truncate text-white">
                          {track.title}
                        </h4>
                        {isFirst && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-500 text-black rounded-full">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-purple-400 truncate flex items-center gap-1.5">
                        <Music2 className="w-3 h-3" />
                        {track.artist}
                        {track.album && <span className="opacity-50 text-[11px] font-normal">â€¢ {track.album}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono font-bold text-gray-300">{track.date}</div>
                    {track.duration && (
                      <div className="text-[10px] font-mono text-gray-500">{track.duration}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // 3. Schedule View (Enhanced with Live On-Air Detector & Calendar)
  const renderEventsView = () => {
    const daysList = ['All', 'Mon - Fri', 'Wed & Fri', 'Sundays'];
    const filteredEvents = SAMPLE_EVENTS.filter(event => {
      const matchesDay = eventsFilter === 'All' || event.day.toLowerCase().includes(eventsFilter.toLowerCase());
      const matchesSearch = event.title.toLowerCase().includes(eventsSearch.toLowerCase()) || 
                            event.host.toLowerCase().includes(eventsSearch.toLowerCase()) ||
                            event.description.toLowerCase().includes(eventsSearch.toLowerCase());
      return matchesDay && matchesSearch;
    });

    return (
      <div className="p-4 md:p-8 pb-36 max-w-6xl mx-auto h-full overflow-y-auto animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Official Broadcast Lineup
              </span>
              <span className="text-xs text-orange-400 font-mono">Live GMT/Local Time</span>
            </div>
            <h2 className={`text-3xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Broadcast Schedule
            </h2>
            <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Explore our daily prophetic programs, business sessions, and worship encounters.
            </p>
          </div>

          <div className={`flex items-center px-4 py-2.5 rounded-2xl border ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <Search className="w-4 h-4 opacity-50 mr-2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search schedule or host..." 
              value={eventsSearch}
              onChange={(e) => setEventsSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full md:w-64"
            />
          </div>
        </div>

        {/* Day Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {daysList.map((day) => (
            <button
              key={day}
              onClick={() => setEventsFilter(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                eventsFilter === day
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : theme === 'dark'
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const isLive = isEventLiveNow(event);

            return (
              <div
                key={event.id}
                className={`relative flex flex-col md:flex-row gap-5 p-5 rounded-3xl border transition-all ${
                  isLive
                    ? 'border-orange-500/80 bg-orange-500/10 shadow-2xl ring-2 ring-orange-500/50'
                    : theme === 'dark' ? 'bg-[#141414] border-white/5 hover:border-white/20' : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                }`}
              >
                {/* Image */}
                <div className="w-full md:w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 bg-neutral-900 relative shadow-md">
                  <img
                    src={event.image}
                    alt={event.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isLive && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Live On Air
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <CalendarDays className="w-3 h-3" />
                        {event.day}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white mb-1 leading-tight">
                      {event.title}
                    </h3>
                    <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Host: {event.host}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCurrentView(AppView.RADIO);
                        if (!isPlaying) togglePlay();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs shadow-md transition-transform active:scale-95"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      {isLive ? 'Tune In Live' : 'Listen Stream'}
                    </button>

                    <a
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title + ' - Mega Overflow Radio')}&details=${encodeURIComponent(event.description + ' Host: ' + event.host)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 font-semibold"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-purple-400" />
                      Remind Me
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 4. Audiobooks View (Connected to MP3 & Firebase Cloud Storage)
  const renderAudiobooks = () => {
    const categories = ['All', 'Scripture', 'Faith', 'Finance', 'Prophecy', 'Relationship', 'Leadership'];
    const filteredBooks = AUDIOBOOK_CATALOG.filter(book => 
      (audiobookFilter === 'All' || book.category === audiobookFilter) &&
      (book.title.toLowerCase().includes(audiobookSearch.toLowerCase()) || 
       book.author.toLowerCase().includes(audiobookSearch.toLowerCase()))
    );

    return (
      <div className="p-4 md:p-8 pb-36 max-w-7xl mx-auto h-full overflow-y-auto animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Firebase Cloud Storage â€¢ MP3 Audio
              </span>
              {isSubscribed ? (
                <span className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> VIP All Downloads Unlocked
                </span>
              ) : (
                <span className="text-xs text-purple-400 font-semibold">
                  Free 2-Min Sample Previews Available
                </span>
              )}
            </div>
            <h2 className={`text-3xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Gospel Audiobook Library
            </h2>
            <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Deepen your faith, master kingdom wealth, and walk in prophetic power with audiobooks by renowned ministers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center px-4 py-2.5 rounded-2xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <Search className="w-4 h-4 opacity-50 mr-2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search audiobooks..." 
                value={audiobookSearch} 
                onChange={(e) => setAudiobookSearch(e.target.value)} 
                className="bg-transparent border-none outline-none text-sm w-full md:w-56" 
              />
            </div>

            {!isSubscribed && (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-500/30 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-300" />
                Unlock Full Library
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setAudiobookFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                audiobookFilter === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : theme === 'dark'
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const isLocked = book.isPremiumOnly && !isSubscribed;

            return (
              <div 
                key={book.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-[#141414] border-white/5 hover:border-purple-500/40' : 'bg-white border-gray-200 hover:border-purple-300 shadow-md'
                }`}
              >
                <div>
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-neutral-900">
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-orange-400 border border-white/10">
                        {book.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                      <span>{book.duration}</span>
                      <span className="flex items-center gap-1 font-bold text-yellow-400">
                        <Star className="w-3 h-3 fill-current" /> {book.rating}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-black text-base text-white mb-1 line-clamp-1">{book.title}</h3>
                  <p className="text-xs font-bold text-purple-400 mb-2">{book.author}</p>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                    {book.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBookForPlayer(book)}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/25 transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isLocked ? 'Listen Preview' : 'Play Full Audio'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isLocked) {
                        setShowSubscriptionModal(true);
                      } else {
                        setSelectedBookForPlayer(book);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isLocked 
                        ? 'bg-white/5 border-white/10 text-orange-400 hover:bg-white/10' 
                        : 'bg-orange-500 text-black border-orange-500 hover:bg-orange-600 font-bold'
                    }`}
                    title={isLocked ? 'Unlock with RevenueCat' : 'Download MP3'}
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 5. Testimony View
  const renderTestimonyView = () => {
    if (testimonySubmitted) {
      return (
        <div className="p-4 md:p-12 pb-36 max-w-2xl mx-auto h-full overflow-y-auto animate-in zoom-in-95 duration-300">
          <div className={`p-8 md:p-12 rounded-3xl border text-center shadow-2xl ${
            theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
              Testimony Received
            </span>
            <h2 className="text-3xl font-black mt-2 mb-3">Glory to God Most High!</h2>
            <p className={`text-sm max-w-md mx-auto mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Thank you, <strong className="text-purple-400">{testimonyName}</strong>. Your praise report has been received and recorded in the station registry.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`mailto:gcmega1@gmail.com?subject=${encodeURIComponent(`Praise Report / Testimony - ${testimonyName}`)}&body=${encodeURIComponent(
                  `Hello Pastoral Desk,\n\nI wanted to share my testimony with Mega Overflow Radio:\n\nFrom: ${testimonyName}\nContact: ${testimonyContact}\n\nTestimony:\n${testimonyContent}\n\nPraise the Lord!`
                )}`}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Send Copy via Email to Pastoral Desk</span>
              </a>
              <button
                onClick={() => {
                  setTestimonySubmitted(false);
                  setTestimonyContent('');
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Submit Another Testimony
              </button>
              <button
                onClick={() => setCurrentView(AppView.CHAT)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              >
                Share in Fellowship Chat
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-8 pb-36 max-w-3xl mx-auto h-full overflow-y-auto animate-in fade-in duration-300">
        <div className={`p-8 md:p-12 rounded-3xl border shadow-2xl ${
          theme === 'dark' ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
            <HandHeart className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black mb-2">Share Your Praise Report</h2>
          <p className="text-xs md:text-sm text-gray-400 mb-8">
            Has God touched you through a broadcast on Mega Overflow Radio? Testimonies overcome the enemy and inspire faith across the globe.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await dispatchFormFeedback('TESTIMONY', {
                fullName: testimonyName,
                contact: testimonyContact,
                content: testimonyContent
              });
              setTestimonySubmitted(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Your Name *</label>
              <input 
                required 
                placeholder="e.g. Sister Mercy Adams" 
                value={testimonyName}
                onChange={(e) => setTestimonyName(e.target.value)}
                className={`w-full p-3.5 rounded-xl text-sm border outline-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Email / Phone *</label>
              <input 
                required 
                placeholder="e.g. mercy@example.com" 
                value={testimonyContact}
                onChange={(e) => setTestimonyContact(e.target.value)}
                className={`w-full p-3.5 rounded-xl text-sm border outline-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Your Testimony Description *</label>
              <textarea 
                required 
                rows={5} 
                placeholder="Detail the miraculous work of God, deliverance, financial breakthrough, or healing..." 
                value={testimonyContent}
                onChange={(e) => setTestimonyContent(e.target.value)}
                className={`w-full p-3.5 rounded-xl text-sm border outline-none resize-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`} 
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-500/25 transition-transform active:scale-95"
            >
              Submit Testimony
            </button>
          </form>
        </div>
      </div>
    );
  };

  // 6. About View
  const renderAbout = () => (
    <div className="p-6 md:p-12 pb-36 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5" /> Station Overview
        </span>
        <h2 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>About Mega Overflow Radio</h2>
      </div>

      <div className={`p-8 rounded-3xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} border space-y-4`}>
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-orange-500" />
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Our Divine Mandate</h3>
        </div>
        <p className={`leading-relaxed text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Mega Overflow Radio is a premier 24/7 internet radio station dedicated to delivering transformative gospel broadcasts: Word, Worship, and Wealth encounters. Our mission is to raise disciples, impart prophetic empowerment, and spread Kingdom excellence across all continents.
        </p>
      </div>

      <div className={`p-8 rounded-3xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border`}>
        <h3 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Our Kingdom Partners & Affiliates</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {PARTNERS.map((partner, i) => (
            <div key={i} className="flex flex-col items-center justify-center space-y-2 group">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-md bg-white p-1">
                <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain rounded-full" />
              </div>
              <span className={`text-xs font-bold text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <aside className={`fixed md:relative z-50 w-64 md:w-72 h-full flex flex-col ${
        theme === 'dark' ? 'bg-[#111111] border-r border-white/5' : 'bg-white border-r border-gray-200'
      } transition-transform duration-300 md:translate-x-0 shadow-2xl md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Brand Header */}
        <div className="p-6 flex items-center justify-center border-b border-white/5">
          <MORLogo className="h-14 hover:scale-105 transition-transform cursor-pointer" />
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {[
            { id: AppView.RADIO, icon: Radio, label: 'Radio' },
            { id: AppView.RECENTLY_PLAYED, icon: ListMusic, label: 'Recently Played' },
            { id: AppView.EVENTS, icon: CalendarDays, label: 'Schedule' },
            { id: AppView.SERMONS, icon: Mic, label: 'Sermons & Preaching', badge: 'FIREBASE' },
            { id: AppView.EBOOKS, icon: BookOpen, label: 'E-Books & Library', badge: 'FIREBASE' },
            { id: AppView.BIBLE, icon: BookHeadphones, label: 'Audio Bible', badge: '66 BOOKS' },
            { id: AppView.AUDIOBOOKS, icon: Disc, label: 'Audiobooks' },
            { id: AppView.CHAT, icon: MessageSquare, label: 'Chat & Voice Altar', badge: 'VOICE LIVE' },
            { id: AppView.PARTNERS, icon: Handshake, label: 'Partner With Us' },
            { id: AppView.VOLUNTEER, icon: Users, label: 'Volunteer' },
            { id: AppView.TESTIMONY, icon: HandHeart, label: 'Testimony' },
            { id: AppView.ABOUT, icon: Info, label: 'About Us' }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 group relative ${
                currentView === item.id 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 font-bold' 
                  : theme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-4 h-4 mr-3 ${currentView === item.id ? 'text-white' : 'text-orange-400'}`} />
              <span className="font-semibold text-xs tracking-wide">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[9px] font-black bg-orange-500 text-black px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer & RevenueCat Status */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className={`p-4 rounded-2xl transition-all ${
            theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-purple-50 border border-purple-100'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isSubscribed ? <Crown className="w-4 h-4 text-yellow-400" /> : <Lock className="w-4 h-4 text-gray-400" />}
              <span className="text-xs font-bold">
                {isSubscribed ? 'VIP Kingdom Member' : 'Free Listener'}
              </span>
            </div>
            {!isSubscribed && (
              <button 
                onClick={() => setShowSubscriptionModal(true)} 
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-black rounded-xl hover:opacity-95 transition-all shadow-sm"
              >
                Upgrade with RevenueCat
              </button>
            )}
          </div>

          <div className="flex justify-center space-x-5 text-gray-400">
            <Facebook className="w-4 h-4 hover:text-white cursor-pointer" />
            <Globe className="w-4 h-4 hover:text-white cursor-pointer" />
            <MessageCircle className="w-4 h-4 hover:text-white cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden z-0">
        {/* Mobile Header Bar */}
        <header className={`md:hidden flex items-center justify-between p-4 border-b z-20 relative ${
          theme === 'dark' ? 'bg-[#0f0f0f]/90 border-white/5' : 'bg-white/90 border-gray-200'
        } backdrop-blur-md`}>
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <MORLogo className="h-8" />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { const opts = [null, 15, 30, 45, 60]; setSleepMinutes(opts[(opts.indexOf(sleepMinutes) + 1) % opts.length]); }} 
              className={`p-2 rounded-xl text-gray-400 relative ${sleepMinutes ? 'text-orange-500' : ''}`}
            >
              <Timer className="w-5 h-5" />
              {sleepMinutes && <span className="absolute top-1 right-1 text-[8px] font-bold bg-orange-500 text-white px-1 rounded-full">{sleepMinutes}</span>}
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-gray-400">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-gray-900" />}
            </button>
          </div>
        </header>

        {/* View Routing */}
        <div className="flex-1 overflow-hidden">
          {currentView === AppView.RADIO && renderRadioView()}
          {currentView === AppView.RECENTLY_PLAYED && renderRecentlyPlayed()}
          {currentView === AppView.EVENTS && renderEventsView()}
          {currentView === AppView.SERMONS && (
            <SermonsAndEbooksView 
              initialTab="sermons" 
              theme={theme} 
              isSubscribed={isSubscribed} 
              onUpgradeClick={() => setShowSubscriptionModal(true)} 
              onNavigateToAudioBible={() => setCurrentView(AppView.BIBLE)}
            />
          )}
          {currentView === AppView.EBOOKS && (
            <SermonsAndEbooksView 
              initialTab="ebooks" 
              theme={theme} 
              isSubscribed={isSubscribed} 
              onUpgradeClick={() => setShowSubscriptionModal(true)} 
              onNavigateToAudioBible={() => setCurrentView(AppView.BIBLE)}
            />
          )}
          {currentView === AppView.BIBLE && (
            <AudioBibleView 
              theme={theme} 
              isSubscribed={isSubscribed} 
              onUpgradeClick={() => setShowSubscriptionModal(true)} 
            />
          )}
          {currentView === AppView.AUDIOBOOKS && renderAudiobooks()}
          {currentView === AppView.CHAT && (
            <ChatCommunityView 
              theme={theme} 
              isSubscribed={isSubscribed} 
              onUpgradeClick={() => setShowSubscriptionModal(true)} 
            />
          )}
          {currentView === AppView.PARTNERS && <PartnersView theme={theme} />}
          {currentView === AppView.VOLUNTEER && <VolunteerView theme={theme} />}
          {currentView === AppView.TESTIMONY && renderTestimonyView()}
          {currentView === AppView.ABOUT && renderAbout()}
        </div>
      </main>

      {/* Persistent Bottom Floating Audio Player Bar */}
      <div className="fixed bottom-4 left-4 right-4 md:left-[300px] md:right-8 h-20 bg-[#121212]/95 border border-white/10 rounded-3xl z-40 flex items-center justify-between px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <img 
            src={metadata.cover || '/mor_logo_square.jpg'} 
            className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10 flex-shrink-0" 
            alt="Cover" 
            onError={(e) => { (e.target as HTMLImageElement).src = '/mor_logo_square.jpg'; }}
          />
          <div className="flex flex-col justify-center min-w-0">
            <h4 className="text-white font-bold text-xs md:text-sm truncate max-w-[140px] md:max-w-[220px]">
              {metadata.title}
            </h4>
            <p className="text-purple-400 text-[11px] truncate max-w-[140px] md:max-w-[220px]">
              {metadata.artist}
            </p>
          </div>
        </div>

        {/* Center Stream Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePlay} 
            className="w-12 h-12 bg-gradient-to-r from-purple-600 to-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Right Volume & Sleep Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="text-gray-400 hover:text-white"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={isMuted ? 0 : volume} 
            onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }} 
            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500" 
          />

          <button 
            onClick={() => { const opts = [null, 15, 30, 45, 60]; setSleepMinutes(opts[(opts.indexOf(sleepMinutes) + 1) % opts.length]); }} 
            className={`p-2 rounded-xl text-gray-400 hover:text-white relative ${sleepMinutes ? 'text-orange-500' : ''}`}
            title="Set Sleep Timer"
          >
            <Timer className="w-4 h-4" />
            {sleepMinutes && <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-orange-500 text-white px-1 rounded-full">{sleepMinutes}</span>}
          </button>
        </div>
      </div>

      {/* RevenueCat Subscription Modal */}
      <RevenueCatModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        theme={theme}
        onSubscriptionSuccess={() => {
          setIsSubscribed(true);
        }}
      />

      {/* Audiobook MP3 Player & Google Drive Downloader Modal */}
      <AudiobookPlayerModal
        book={selectedBookForPlayer}
        onClose={() => setSelectedBookForPlayer(null)}
        isSubscribed={isSubscribed}
        onUpgradeClick={() => {
          setSelectedBookForPlayer(null);
          setShowSubscriptionModal(true);
        }}
        theme={theme}
      />
    </div>
  );
};

export default App;

