import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDiscoveryUsers, toggleFollow, uploadAvatar } from "@/api/users";
import { fetchProfile, updateProfile } from "@/api/profile";
import { resolveUrl } from "../config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  X,
  Heart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Plus,
  ArrowRight,
  Users,
  Star,
  Globe,
  Flag,
  Calendar,
  Ruler,
  Sparkles,
  Briefcase,
  Languages,
  BookOpen,
  Leaf,
  HeartHandshake,
  Search,
  MapPin,
  Edit2,
  ChevronDown,
  UserCheck,
  Loader2,
  RefreshCw,
  Camera,
  Save,
  Check,
  User,
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const ALL_INTERESTS = [
  "Anime","Moon Watching","Bike Riding","Eating","Travel",
  "Music","Photography","Gaming","Reading","Coffee",
  "Hiking","Dogs","Art","Fitness","Movies","Yoga",
  "Cooking","Dancing","Swimming","Basketball","Football",
  "Tennis","Gardening","Meditation","Fashion","Nature","Vibe",
];

const INTEREST_ICONS: Record<string, string> = {
  Anime:"🎌","Moon Watching":"🌙","Bike Riding":"🚲",Eating:"🍔",
  Travel:"✈️",Music:"🎵",Photography:"📸",Gaming:"🎮",Reading:"📚",
  Coffee:"☕",Hiking:"⛰️",Dogs:"🐶",Art:"🎨",Fitness:"💪",
  Movies:"🎬",Yoga:"🧘",Cooking:"🍳",Dancing:"💃",Swimming:"🏊",
  Basketball:"🏀",Football:"⚽",Tennis:"🎾",Gardening:"🌱",
  Meditation:"🕯️",Fashion:"👗",Nature:"🌿",Vibe:"✨",
};

const ZODIAC_SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const GENDER_OPTIONS = ["Male","Female","Non-binary","Prefer not to say"];
const LIFESTYLE_OPTIONS = ["Active","Homebody","Social","Adventurous","Balanced","Creative","Spiritual"];
const LOOKING_FOR_OPTIONS = ["Friendship","Dating","Networking","Activity Partner","Long-term","Casual"];
const RELATIONSHIP_OPTIONS = ["Single","In a Relationship","Married","Divorced","Widowed","Prefer not to say"];
const EDUCATION_OPTIONS = ["High School","Diploma","Bachelor's","Master's","PhD","Other"];
const GENDER_FILTERS = ["All","Male","Female","Non-binary"];

function getZodiac(age: number): string {
  return ZODIAC_SIGNS[age % 12];
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
interface AttrCardProps { icon: React.ReactNode; label: string; value: string | number; }
function AttrCard({ icon, label, value }: AttrCardProps) {
  const isDark = localStorage.getItem("vibe_theme") === "dark";
  return (
    <div className={cn(
      "border rounded-xl px-2.5 py-2 flex flex-col gap-0.5 min-w-0 transition-colors duration-300",
      isDark ? "bg-[#1E1510]/50 border-[#251711]" : "bg-[#FBF8F4] border-[#EDE6DB]"
    )}>
      <div className="flex items-center gap-1">
        <span className="opacity-50 flex-shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest truncate", isDark ? "text-[#D2C5B4]" : "text-[#A07850]")}>{label}</span>
      </div>
      <span className={cn("text-xs font-semibold truncate leading-tight", isDark ? "text-[#F5F0E8]" : "text-[#3D2A1A]")}>{value || "—"}</span>
    </div>
  );
}

function InterestSticker({ interest, selected, onClick }: { interest: string; selected?: boolean; onClick?: () => void }) {
  const isDark = localStorage.getItem("vibe_theme") === "dark";
  const emoji = INTEREST_ICONS[interest] || "✨";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 border rounded-2xl px-2.5 py-2 shadow-sm transition-all duration-200 cursor-pointer select-none",
        selected
          ? (isDark ? "bg-[#8B5E3C] border-[#8B5E3C] shadow-md scale-95" : "bg-[#7A4F2A] border-[#7A4F2A] shadow-md scale-95")
          : (isDark ? "bg-[#1E1510]/50 border-[#251711] hover:bg-[#251711]/50" : "bg-[#FBF8F4] border-[#EDE6DB] hover:shadow-md hover:-translate-y-0.5")
      )}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-wider text-center leading-tight max-w-[54px] truncate",
        selected ? "text-white" : (isDark ? "text-[#D2C5B4]" : "text-[#7A5535]")
      )}>
        {interest}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   EDIT MY INFO MODAL
───────────────────────────────────────────── */
interface EditModalProps {
  open: boolean;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditMyInfoModal({ open, token, onClose, onSaved }: EditModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"basic"|"lifestyle"|"interests"|"photos">("basic");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  /* form state */
  const [form, setForm] = useState({
    name: "",
    bio: "",
    gender: "Non-binary",
    age: 21,
    location: "",
    occupation: "",
    height: "",
    zodiacSign: "",
    languages: "",
    education: "Bachelor's",
    lifestyle: "Balanced",
    relationshipStatus: "Single",
    lookingFor: "Friendship",
    interests: [] as string[],
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Load current profile on open */
  useEffect(() => {
    if (!open || !token) return;
    (async () => {
      setLoadingProfile(true);
      try {
        const profile = await fetchProfile(token);
        setForm(prev => ({
          ...prev,
          name: profile.name ?? "",
          bio: profile.bio ?? "",
          gender: profile.gender ?? "Non-binary",
          age: profile.age ?? 21,
          location: profile.location ?? "",
          interests: profile.interests ?? [],
        }));
        if (profile.avatar) setAvatarPreview(resolveUrl(profile.avatar));
      } catch { /* ignore */ }
      finally { setLoadingProfile(false); }
    })();
  }, [open, token]);

  const setField = (key: keyof typeof form, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      /* Upload avatar first if changed */
      if (avatarFile) {
        await uploadAvatar(token, avatarFile);
      }
      /* Save profile fields */
      await updateProfile(token, {
        name: form.name,
        bio: form.bio,
        gender: form.gender,
        age: Number(form.age),
        location: form.location,
        interests: form.interests,
      });
      toast.success("Profile updated successfully! ✨");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const TABS = [
    { id: "basic", label: "Basic Info", icon: "👤" },
    { id: "lifestyle", label: "Lifestyle", icon: "🌿" },
    { id: "interests", label: "Keywords", icon: "✨" },
    { id: "photos", label: "Photo", icon: "📸" },
  ] as const;

  const inputClass = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-[#A07850]/30 focus:border-[#A07850]";
  const inputStyle = { background: "#F5EFE6", borderColor: "#D6CBB8", color: "#3D2A1A" } as React.CSSProperties;
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest mb-1.5";
  const labelStyle = { color: "#A07850" } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(61,42,26,0.55)", backdropFilter: "blur(6px)" }}>
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden"
        style={{ background: "#FFFCF8", borderColor: "#EDE6DB" }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#EDE6DB" }}>
          <div>
            <h2 className="text-base font-black" style={{ color: "#3D2A1A" }}>Edit My Info</h2>
            <p className="text-xs mt-0.5" style={{ color: "#A07850" }}>How others see you on Discover</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center transition hover:bg-[#F5EFE6]"
          >
            <X className="h-4 w-4" style={{ color: "#5C3E2A" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b px-6 gap-1 pt-2" style={{ borderColor: "#EDE6DB" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-[#7A4F2A] text-[#7A4F2A] bg-[#F5EFE6]"
                  : "border-transparent text-[#A07850] hover:text-[#5C3E2A] hover:bg-[#F5EFE6]/50"
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadingProfile ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#A07850" }} />
            </div>
          ) : (
            <>
              {/* ── BASIC INFO ── */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} style={labelStyle}>Display Name</label>
                    <input className={inputClass} style={inputStyle} value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Bio</label>
                    <textarea
                      rows={3}
                      className={cn(inputClass, "resize-none")}
                      style={inputStyle}
                      value={form.bio}
                      onChange={e => setField("bio", e.target.value)}
                      placeholder="Tell others about yourself..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} style={labelStyle}>Gender</label>
                      <select className={inputClass} style={inputStyle} value={form.gender} onChange={e => setField("gender", e.target.value)}>
                        {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Age</label>
                      <input type="number" min={18} max={100} className={inputClass} style={inputStyle} value={form.age} onChange={e => setField("age", parseInt(e.target.value) || 18)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Location</label>
                    <input className={inputClass} style={inputStyle} value={form.location} onChange={e => setField("location", e.target.value)} placeholder="e.g. Mumbai, India" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} style={labelStyle}>Height</label>
                      <input className={inputClass} style={inputStyle} value={form.height} onChange={e => setField("height", e.target.value)} placeholder={`5'9" (175 cm)`} />
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Zodiac Sign</label>
                      <select className={inputClass} style={inputStyle} value={form.zodiacSign} onChange={e => setField("zodiacSign", e.target.value)}>
                        <option value="">Select sign</option>
                        {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} style={labelStyle}>Languages</label>
                      <input className={inputClass} style={inputStyle} value={form.languages} onChange={e => setField("languages", e.target.value)} placeholder="English, Hindi..." />
                    </div>
                    <div>
                      <label className={labelClass} style={labelStyle}>Occupation</label>
                      <input className={inputClass} style={inputStyle} value={form.occupation} onChange={e => setField("occupation", e.target.value)} placeholder="e.g. Designer" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Education</label>
                    <select className={inputClass} style={inputStyle} value={form.education} onChange={e => setField("education", e.target.value)}>
                      {EDUCATION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* ── LIFESTYLE ── */}
              {activeTab === "lifestyle" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} style={labelStyle}>Lifestyle</label>
                    <div className="flex flex-wrap gap-2">
                      {LIFESTYLE_OPTIONS.map(opt => (
                        <button key={opt} type="button" onClick={() => setField("lifestyle", opt)}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                            form.lifestyle === opt
                              ? "bg-[#7A4F2A] text-white border-[#7A4F2A]"
                              : "bg-[#F5EFE6] text-[#5C3E2A] border-[#D6CBB8] hover:bg-[#EDE6DB]"
                          )}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Relationship Status</label>
                    <div className="flex flex-wrap gap-2">
                      {RELATIONSHIP_OPTIONS.map(opt => (
                        <button key={opt} type="button" onClick={() => setField("relationshipStatus", opt)}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                            form.relationshipStatus === opt
                              ? "bg-[#7A4F2A] text-white border-[#7A4F2A]"
                              : "bg-[#F5EFE6] text-[#5C3E2A] border-[#D6CBB8] hover:bg-[#EDE6DB]"
                          )}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>Looking For</label>
                    <div className="flex flex-wrap gap-2">
                      {LOOKING_FOR_OPTIONS.map(opt => (
                        <button key={opt} type="button" onClick={() => setField("lookingFor", opt)}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                            form.lookingFor === opt
                              ? "bg-[#7A4F2A] text-white border-[#7A4F2A]"
                              : "bg-[#F5EFE6] text-[#5C3E2A] border-[#D6CBB8] hover:bg-[#EDE6DB]"
                          )}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── INTERESTS ── */}
              {activeTab === "interests" && (
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: "#A07850" }}>
                    Select keywords that describe you. These appear as stickers on your profile.
                    <span className="font-bold ml-1">({form.interests.length} selected)</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_INTERESTS.map(interest => (
                      <InterestSticker
                        key={interest}
                        interest={interest}
                        selected={form.interests.includes(interest)}
                        onClick={() => toggleInterest(interest)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── PHOTOS ── */}
              {activeTab === "photos" && (
                <div className="space-y-4">
                  <p className="text-xs" style={{ color: "#A07850" }}>
                    Your profile photo is shown on the Discover page. Upload a clear, high-quality photo.
                  </p>
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="relative h-52 w-52 rounded-3xl border-2 overflow-hidden flex items-center justify-center"
                      style={{ borderColor: "#EDE6DB", background: "#F5EFE6" }}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-40">
                          <User className="h-16 w-16" style={{ color: "#A07850" }} />
                          <span className="text-xs font-semibold" style={{ color: "#A07850" }}>No photo yet</span>
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-3 right-3 h-9 w-9 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105"
                        style={{ background: "#7A4F2A" }}
                      >
                        <Camera className="h-4 w-4 text-white" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-semibold transition hover:bg-[#EDE6DB]"
                      style={{ borderColor: "#D6CBB8", color: "#5C3E2A", background: "#F5EFE6" }}
                    >
                      <Camera className="h-4 w-4" />
                      {avatarPreview ? "Change Photo" : "Upload Photo"}
                    </button>
                    {avatarFile && (
                      <p className="text-xs font-medium" style={{ color: "#7A4F2A" }}>
                        ✓ New photo ready: {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t" style={{ borderColor: "#EDE6DB" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border text-sm font-semibold transition hover:bg-[#F5EFE6]"
            style={{ borderColor: "#D6CBB8", color: "#5C3E2A" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: "#7A4F2A" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DISCOVER PAGE
───────────────────────────────────────────── */
export default function Discover() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Synchronized global dark mode state
  const [isDark, setIsDark] = useState(() => localStorage.getItem("vibe_theme") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem("vibe_theme") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const themeBg = isDark ? "#0A0604" : "#F5EFE6";
  const themeCardBg = isDark ? "#140C09" : "#FFFCF8";
  const themeBorderColor = isDark ? "#251711" : "#EDE6DB";
  const themeTextColor = isDark ? "#F5F0E8" : "#3D2A1A";
  const themeTextSec = isDark ? "#D2C5B4" : "#A07850";
  const themeButtonBorder = isDark ? "#251711" : "#D6CBB8";
  const themeButtonColor = isDark ? "#D2C5B4" : "#5C3E2A";
  const themeBrandAccent = isDark ? "#8B5E3C" : "#7A4F2A";

  /* ── State ── */
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [swiping, setSwiping] = useState<"left" | "right" | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const currentProfile = profiles[currentIndex] ?? null;

  /* ── Build attributes ── */
  function buildAttributes(p: any) {
    return [
      { icon: <Users className="h-3 w-3" />,         label: "Communities",    value: p.communitiesCount ?? (p.age % 15) + 2 },
      { icon: <Star className="h-3 w-3" />,           label: "Interests",      value: p.interests?.length ?? 0 },
      { icon: <Sparkles className="h-3 w-3" />,       label: "Gender",         value: p.gender ?? "Non-binary" },
      { icon: <Globe className="h-3 w-3" />,          label: "Country",        value: p.location?.split(",").pop()?.trim() ?? "India" },
      { icon: <Flag className="h-3 w-3" />,           label: "Nation",         value: "Indian" },
      { icon: <Calendar className="h-3 w-3" />,       label: "Age",            value: p.age ?? 21 },
      { icon: <Ruler className="h-3 w-3" />,          label: "Height",         value: p.height ?? `5'${6 + (p.age % 5)}"` },
      { icon: <Sparkles className="h-3 w-3" />,       label: "Zodiac",         value: p.zodiacSign ?? getZodiac(p.age ?? 21) },
      { icon: <Briefcase className="h-3 w-3" />,      label: "Occupation",     value: p.occupation ?? "Professional" },
      { icon: <Languages className="h-3 w-3" />,      label: "Languages",      value: p.languages ?? "English" },
      { icon: <BookOpen className="h-3 w-3" />,       label: "Education",      value: p.education ?? "Graduate" },
      { icon: <Leaf className="h-3 w-3" />,           label: "Lifestyle",      value: p.lifestyle ?? "Active" },
      { icon: <Heart className="h-3 w-3" />,          label: "Relationship",   value: p.relationshipStatus ?? "Single" },
      { icon: <HeartHandshake className="h-3 w-3" />, label: "Looking For",    value: p.lookingFor ?? "Friendship" },
      { icon: <MapPin className="h-3 w-3" />,         label: "Location",       value: p.location ?? "Nearby" },
    ];
  }

  /* ── Load profiles ── */
  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setCurrentIndex(0);
    setImageIndex(0);
    try {
      const data = await fetchDiscoveryUsers(
        genderFilter === "All" ? undefined : genderFilter,
        searchQuery || undefined
      );
      setProfiles(data ?? []);
    } catch { toast.error("Failed to load users"); }
    finally { setIsLoading(false); }
  }, [genderFilter, searchQuery]);

  useEffect(() => {
    const t = setTimeout(loadProfiles, 350);
    return () => clearTimeout(t);
  }, [loadProfiles]);

  useEffect(() => setImageIndex(0), [currentIndex]);

  /* ── Outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Swipe actions ── */
  const handleAction = async (type: "like" | "pass") => {
    if (!currentProfile || swiping) return;
    setSwiping(type === "like" ? "right" : "left");
    if (type === "like") {
      try {
        await toggleFollow(currentProfile.username);
        toast.success(`You liked @${currentProfile.username}! 💛`);
      } catch { toast.error("Action failed"); }
    } else {
      toast(`Passed on @${currentProfile.username}`);
    }
    setTimeout(() => { setCurrentIndex(i => i + 1); setSwiping(null); }, 320);
  };

  /* ── Image data ── */
  const images: string[] = currentProfile?.avatar ? [resolveUrl(currentProfile.avatar)] : [];
  const prevImg = () => setImageIndex(i => Math.max(0, i - 1));
  const nextImg = () => setImageIndex(i => Math.min(images.length - 1, i + 1));
  const interests: string[] = currentProfile?.interests?.length
    ? currentProfile.interests
    : ["Anime","Moon Watching","Bike Riding","Eating","Travel","Music","Photography","Gaming","Reading"];

  /* ────────────── RENDER ────────────── */
  return (
    <>
      {/* Edit Modal */}
      <EditMyInfoModal
        open={editModalOpen}
        token={token}
        onClose={() => setEditModalOpen(false)}
        onSaved={loadProfiles}
      />

      <div
        className="flex flex-col overflow-hidden h-full transition-colors duration-300"
        style={{ background: themeBg }}
      >
        {/* ══ TOP BAR ══ */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b transition-colors duration-300"
          style={{ background: themeBg, borderColor: themeBorderColor }}
        >
          <button
            onClick={() => navigate(-1)}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border transition active:scale-95",
              isDark ? "hover:bg-[#1E1510]/50" : "hover:bg-[#EDE6DB]"
            )}
            style={{ borderColor: themeButtonBorder, color: themeButtonColor }}
          >
            <X className="h-3.5 w-3.5" /> Close
          </button>

          <button
            onClick={() => setEditModalOpen(true)}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl border transition active:scale-95",
              isDark ? "hover:bg-[#1E1510]/50" : "hover:bg-[#EDE6DB]"
            )}
            style={{ borderColor: themeButtonBorder, color: themeButtonColor }}
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit My Info
          </button>

          {/* Filter button + dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border transition active:scale-95",
                isDark ? "hover:bg-[#1E1510]/50" : "hover:bg-[#EDE6DB]"
              )}
              style={{ borderColor: themeButtonBorder, color: themeButtonColor }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
              <ChevronDown className={cn("h-3 w-3 transition-transform", filterOpen && "rotate-180")} />
            </button>

            {filterOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-60 rounded-2xl border shadow-xl z-50 p-4 space-y-3 transition-colors duration-300"
                style={{ background: themeCardBg, borderColor: themeBorderColor }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: themeTextSec }}>Gender</p>
                <div className="flex flex-wrap gap-1.5">
                  {GENDER_FILTERS.map(f => (
                    <button key={f} onClick={() => { setGenderFilter(f); setFilterOpen(false); }}
                      className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition",
                        genderFilter === f
                          ? (isDark ? "bg-[#8B5E3C] text-white border-[#8B5E3C]" : "bg-[#7A4F2A] text-white border-[#7A4F2A]")
                          : (isDark ? "bg-[#1E1510]/60 text-[#D2C5B4] border-[#251711] hover:bg-[#251711]" : "bg-[#F5EFE6] text-[#5C3E2A] border-[#D6CBB8] hover:bg-[#EDE6DB]")
                      )}>
                      {f}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: themeTextSec }}>Search</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: themeTextSec }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Name or username..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border text-xs outline-none"
                    style={{ background: themeBg, borderColor: themeButtonBorder, color: themeTextColor }}
                  />
                </div>
                <button
                  onClick={() => { loadProfiles(); setFilterOpen(false); }}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95 transition-all"
                  style={{ background: themeBrandAccent }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ BODY ══ */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeTextSec }} />
            <p className="text-sm font-semibold" style={{ color: themeTextColor }}>Finding people...</p>
          </div>
        ) : !currentProfile ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-5xl">🌱</div>
            <h3 className="text-lg font-bold" style={{ color: themeTextColor }}>
              {searchQuery ? "No matching profiles" : "You've seen everyone!"}
            </h3>
            <p className="text-sm max-w-xs" style={{ color: themeTextSec }}>
              {searchQuery ? "Try a different filter." : "Check back later for new Vibers."}
            </p>
            <button
              onClick={() => { setSearchQuery(""); setGenderFilter("All"); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer active:scale-95 transition-all"
              style={{ background: themeBrandAccent }}
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        ) : (
          /* ════════ MAIN GRID: responsive vertical on mobile, 2 cols on lg ════════ */
          <div
            className="flex-1 overflow-y-auto lg:overflow-hidden p-2 sm:p-4 gap-4 w-full flex flex-col lg:grid lg:grid-cols-[1fr_300px]"
          >
            {/* ── LEFT: Photo + Buttons + Attributes ── */}
            <div className="flex flex-col gap-3 min-h-[500px] lg:min-h-0 overflow-hidden text-left">

              {/* Photo Carousel — flex-1 fills all remaining vertical space */}
              <div
                className={cn(
                  "relative rounded-3xl overflow-hidden border flex-1 min-h-0 transition-all duration-300",
                  swiping === "left" && "-rotate-1 opacity-60 scale-[0.98]",
                  swiping === "right" && "rotate-1 opacity-60 scale-[0.98]"
                )}
                style={{ borderColor: themeBorderColor, background: isDark ? "#140C09" : "#D6CBB8" }}
              >
                {/* Image */}
                {images.length > 0 ? (
                  <img
                    src={images[imageIndex]}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover"
                    key={imageIndex}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-8xl font-black select-none"
                    style={{
                      background: "linear-gradient(145deg, #C9A07A 0%, #8B5E3C 50%, #5C3E2A 100%)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {currentProfile.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}

                {/* Bottom gradient overlay */}
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: "50%",
                    background: "linear-gradient(to top, rgba(30,16,5,0.85) 0%, rgba(30,16,5,0.3) 60%, transparent 100%)",
                  }}
                />

                {/* Name / info at bottom */}
                <div className="absolute bottom-4 left-5 right-5">
                  <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                    {currentProfile.name}
                    <span className="text-xl font-semibold opacity-75 ml-2">{currentProfile.age ?? 21}</span>
                  </h2>
                  <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {currentProfile.location ?? "Nearby"} · @{currentProfile.username}
                  </p>
                </div>

                {/* Left/Right nav arrows */}
                {images.length > 1 && imageIndex > 0 && (
                  <button
                    onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.88)" }}
                  >
                    <ChevronLeft className="h-4 w-4" style={{ color: "#3D2A1A" }} />
                  </button>
                )}
                {images.length > 1 && imageIndex < images.length - 1 && (
                  <button
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.88)" }}
                  >
                    <ChevronRight className="h-4 w-4" style={{ color: "#3D2A1A" }} />
                  </button>
                )}

                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={cn(
                          "rounded-full transition-all duration-200",
                          i === imageIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Profile counter badge */}
                <div
                  className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.85)", color: "#5C3E2A" }}
                >
                  {currentIndex + 1} / {profiles.length}
                </div>
              </div>

              {/* ── ACTION BUTTONS: horizontal row ── */}
              <div className="flex-shrink-0 flex gap-3">
                <button
                  onClick={() => handleAction("pass")}
                  disabled={!!swiping}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50",
                    swiping === "left" && "scale-95 opacity-50"
                  )}
                  style={isDark ? { background: "rgba(214, 76, 58, 0.12)", borderColor: "rgba(214, 76, 58, 0.25)", color: "#F27A6D" } : { background: "#FFF5F5", borderColor: "#F5CCC8", color: "#D64C3A" }}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={isDark ? { background: "rgba(214, 76, 58, 0.2)" } : { background: "#FFEBE8" }}
                  >
                    <X className="h-4 w-4" style={{ color: isDark ? "#F27A6D" : "#D64C3A" }} />
                  </div>
                  Not My Type
                </button>

                <button
                  onClick={() => handleAction("like")}
                  disabled={!!swiping}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50",
                    swiping === "right" && "scale-95 opacity-50"
                  )}
                  style={isDark ? { background: "rgba(46, 158, 90, 0.12)", borderColor: "rgba(46, 158, 90, 0.25)", color: "#5ED68C" } : { background: "#F5FFF8", borderColor: "#C8ECD3", color: "#2E9E5A" }}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={isDark ? { background: "rgba(46, 158, 90, 0.2)" } : { background: "#E5F5EA" }}
                  >
                    <Heart className="h-4 w-4 fill-current" style={{ color: isDark ? "#5ED68C" : "#2E9E5A" }} />
                  </div>
                  My Type
                </button>
              </div>

              {/* ── ATTRIBUTES GRID: compact ── */}
              <div
                className="flex-shrink-0 rounded-2xl border p-3"
                style={{ background: themeCardBg, borderColor: themeBorderColor }}
              >
                <div className="grid grid-cols-5 gap-1.5">
                  {buildAttributes(currentProfile).map(attr => (
                    <AttrCard key={attr.label} icon={attr.icon} label={attr.label} value={attr.value} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="flex flex-col gap-3 overflow-hidden min-h-0">

              {/* Diamonds */}
              <div className="flex-shrink-0 rounded-3xl border p-4 space-y-3" style={{ background: themeCardBg, borderColor: themeBorderColor }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: themeTextSec }}>
                    User Diamonds
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Diamond className="h-3.5 w-3.5" style={{ color: "#5B8DE8" }} />
                    <span className="text-sm font-black" style={{ color: themeTextColor }}>{currentProfile.tipsReceived ?? 0}</span>
                    <button
                      className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ background: isDark ? "rgba(91,141,232,0.15)" : "#F0F5FF" }}
                    >
                      <Plus className="h-3 w-3" style={{ color: "#5B8DE8" }} />
                    </button>
                  </div>
                </div>
                <button
                  className="w-full flex items-center justify-between px-4 py-2 rounded-xl border text-xs font-bold transition hover:opacity-80"
                  style={{ borderColor: themeButtonBorder, color: themeButtonColor, background: isDark ? "rgba(37,23,17,0.4)" : "#F5EFE6" }}
                >
                  Get Diamonds <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* User ID + Bio */}
              <div className="flex-shrink-0 rounded-3xl border p-4 space-y-3" style={{ background: themeCardBg, borderColor: themeBorderColor }}>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={{ color: themeTextSec }}>User ID</span>
                  <button
                    onClick={() => navigate(`/profile/${currentProfile.username}`)}
                    className="text-sm font-black transition hover:opacity-60"
                    style={{ color: "#B85C38" }}
                  >
                    @{currentProfile.username}
                  </button>
                </div>
                <div className="border-t pt-3" style={{ borderColor: themeBorderColor }}>
                  <span className="text-[9px] font-bold uppercase tracking-widest block mb-1" style={{ color: themeTextSec }}>Bio</span>
                  <p className="text-xs leading-relaxed" style={{ color: themeButtonColor }}>
                    {currentProfile.bio?.trim() || "No bio yet. This person is a mystery. ✨"}
                  </p>
                </div>
                <div className="flex gap-4 border-t pt-2" style={{ borderColor: themeBorderColor }}>
                  <div>
                    <p className="text-sm font-black" style={{ color: themeTextColor }}>{currentProfile.followers ?? 0}</p>
                    <p className="text-[9px]" style={{ color: themeTextSec }}>Followers</p>
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: themeTextColor }}>{currentProfile.following ?? 0}</p>
                    <p className="text-[9px]" style={{ color: themeTextSec }}>Following</p>
                  </div>
                  <button
                    onClick={() => handleAction("like")}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white cursor-pointer active:scale-95 transition-all"
                    style={{ background: themeBrandAccent }}
                  >
                    <UserCheck className="h-3 w-3" /> Follow
                  </button>
                </div>
              </div>

              {/* Keywords / Interests */}
              <div className="flex-1 rounded-3xl border p-4 min-h-0 overflow-hidden" style={{ background: themeCardBg, borderColor: themeBorderColor }}>
                <span className="text-[9px] font-bold uppercase tracking-widest block mb-2" style={{ color: themeTextSec }}>
                  Keywords / Interests
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {interests.slice(0, 9).map(interest => (
                    <InterestSticker key={interest} interest={interest} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}