import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  authApi, channelsApi, articlesApi, commentsApi,
  type User, type Channel, type Article, type Comment,
} from "@/lib/api";

type Section = "home" | "news" | "channels" | "publications" | "about" | "moderation";

const VERIFICATION_TYPES = [
  { value: "government", label: "Государственный", icon: "Landmark", color: "text-blue-700" },
  { value: "political",  label: "Политический",    icon: "Vote",     color: "text-indigo-700" },
  { value: "medical",    label: "Медицинский",      icon: "Cross",    color: "text-emerald-700" },
  { value: "news",       label: "Новостной",        icon: "Newspaper",color: "text-amber-700" },
];

const CHANNEL_ICONS = ["Newspaper","Radio","Tv","Globe","Landmark","TrendingUp","Theater","Trophy","Heart","Shield","Zap","Star"];
const CHANNEL_COLORS = [
  { value: "bg-blue-700", label: "Синий" },
  { value: "bg-indigo-700", label: "Индиго" },
  { value: "bg-emerald-700", label: "Зелёный" },
  { value: "bg-violet-700", label: "Фиолетовый" },
  { value: "bg-amber-700", label: "Янтарный" },
  { value: "bg-rose-700", label: "Красный" },
  { value: "bg-sky-700", label: "Голубой" },
  { value: "bg-teal-700", label: "Бирюзовый" },
];

function VerificationBadge({ type, label }: { type: string | null; label: string | null }) {
  if (!type || !label) return null;
  const vt = VERIFICATION_TYPES.find(v => v.value === type);
  return (
    <Badge className={`gap-1 text-xs font-bold bg-white border ${vt ? "border-blue-200 text-blue-800" : "border-gray-200 text-gray-700"}`}>
      <Icon name="BadgeCheck" size={11} className="text-blue-600" />
      {label}
    </Badge>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleComments, setArticleComments] = useState<Comment[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth modal
  const [authModal, setAuthModal] = useState(false);
  const [adminCodeStep, setAdminCodeStep] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminCodeSent, setAdminCodeSent] = useState(false);
  const [adminCodeError, setAdminCodeError] = useState("");

  // Publish modal
  const [publishModal, setPublishModal] = useState(false);
  const [pubTitle, setPubTitle] = useState("");
  const [pubContent, setPubContent] = useState("");
  const [pubChannelId, setPubChannelId] = useState("");
  const [pubSent, setPubSent] = useState(false);

  // Create channel modal
  const [createChannelModal, setCreateChannelModal] = useState(false);
  const [chName, setChName] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chIcon, setChIcon] = useState("Newspaper");
  const [chColor, setChColor] = useState("bg-blue-700");

  // Comment
  const [commentText, setCommentText] = useState("");

  // Verify channel modal (admin)
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyChannel, setVerifyChannel] = useState<Channel | null>(null);
  const [verifyType, setVerifyType] = useState("government");

  const loadChannels = useCallback(async () => {
    const data = await channelsApi.list();
    setChannels(Array.isArray(data) ? data : []);
  }, []);

  const loadArticles = useCallback(async () => {
    const data = await articlesApi.list("published");
    setArticles(Array.isArray(data) ? data : []);
  }, []);

  const loadModeration = useCallback(async () => {
    const [pArt, pCom] = await Promise.all([
      articlesApi.list("pending"),
      commentsApi.listPending(),
    ]);
    setPendingArticles(Array.isArray(pArt) ? pArt : []);
    setPendingComments(Array.isArray(pCom) ? pCom : []);
  }, []);

  useEffect(() => {
    Promise.all([loadChannels(), loadArticles()]).finally(() => setLoading(false));
    const stored = localStorage.getItem("ogf_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [loadChannels, loadArticles]);

  useEffect(() => {
    if (section === "moderation" && user?.is_admin) loadModeration();
  }, [section, user, loadModeration]);

  useEffect(() => {
    if (selectedArticle) {
      commentsApi.list(selectedArticle.id).then(data => {
        setArticleComments(Array.isArray(data) ? data : []);
      });
    }
  }, [selectedArticle]);

  const saveUser = (u: User) => {
    setUser(u);
    localStorage.setItem("ogf_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ogf_user");
  };

  const navigate = (s: Section) => {
    setSection(s);
    setSelectedArticle(null);
    setSelectedChannel(null);
    setMobileMenuOpen(false);
  };

  // Telegram login widget callback
  const handleTelegramAuth = async (data: Record<string, string | number>) => {
    const result = await authApi.telegram(data);
    if (result.user_id) {
      saveUser(result as User);
      setAuthModal(false);
    }
  };

  // Expose to window for Telegram widget
  useEffect(() => {
    (window as Record<string, unknown>).onTelegramAuth = handleTelegramAuth;
  });

  const handleRequestAdminCode = async () => {
    if (!user) return;
    setAdminCodeError("");
    const res = await authApi.requestAdminCode(user.telegram_id);
    if (res.sent) {
      setAdminCodeSent(true);
    } else {
      setAdminCodeError(res.error || "Ошибка. Убедитесь, что вы в списке администраторов.");
    }
  };

  const handleVerifyAdminCode = async () => {
    if (!user) return;
    setAdminCodeError("");
    const res = await authApi.verifyAdminCode(user.telegram_id, adminCode, user.user_id);
    if (res.is_admin) {
      const updatedUser = { ...user, is_admin: true };
      saveUser(updatedUser);
      setAdminCodeStep(false);
      setAdminCodeSent(false);
      setAdminCode("");
    } else {
      setAdminCodeError(res.error || "Неверный или истёкший код.");
    }
  };

  const handlePublish = async () => {
    if (!user || !pubTitle || !pubContent || !pubChannelId) return;
    await articlesApi.create(user.user_id, {
      title: pubTitle,
      content: pubContent,
      channel_id: Number(pubChannelId),
    });
    setPubSent(true);
    setPubTitle(""); setPubContent(""); setPubChannelId("");
  };

  const handleCreateChannel = async () => {
    if (!user || !chName) return;
    await channelsApi.create(user.user_id, { name: chName, description: chDesc, icon: chIcon, color: chColor });
    setCreateChannelModal(false);
    setChName(""); setChDesc("");
    loadChannels();
  };

  const handleModerateArticle = async (id: number, action: "approve" | "reject") => {
    if (!user) return;
    await articlesApi.moderate(user.user_id, id, action);
    loadModeration();
    loadArticles();
  };

  const handleModerateComment = async (id: number, action: "approve" | "reject") => {
    if (!user) return;
    await commentsApi.moderate(user.user_id, id, action);
    loadModeration();
    if (selectedArticle) {
      commentsApi.list(selectedArticle.id).then(data => setArticleComments(Array.isArray(data) ? data : []));
    }
  };

  const handleAddComment = async () => {
    if (!user || !commentText || !selectedArticle) return;
    await commentsApi.add(user.user_id, selectedArticle.id, commentText);
    setCommentText("");
    commentsApi.list(selectedArticle.id).then(data => setArticleComments(Array.isArray(data) ? data : []));
  };

  const handleVerifyChannel = async () => {
    if (!user || !verifyChannel) return;
    await channelsApi.verify(user.user_id, verifyChannel.id, verifyType, true);
    setVerifyModal(false);
    loadChannels();
  };

  const handleUnverifyChannel = async (ch: Channel) => {
    if (!user) return;
    await channelsApi.verify(user.user_id, ch.id, null, false);
    loadChannels();
  };

  const navItems: { key: Section; label: string; icon: string }[] = [
    { key: "home", label: "Главная", icon: "Home" },
    { key: "news", label: "Новости", icon: "Newspaper" },
    { key: "channels", label: "Каналы", icon: "Radio" },
    { key: "publications", label: "Публикации", icon: "FileText" },
    { key: "about", label: "О федерации", icon: "Shield" },
    ...(user?.is_admin ? [{ key: "moderation" as Section, label: "Модерация", icon: "ShieldCheck" }] : []),
  ];

  const modCount = pendingArticles.length + pendingComments.length;
  const publishedArticles = articles;

  return (
    <div className="min-h-screen bg-background font-montserrat">

      {/* HEADER */}
      <header className="gov-gradient text-white shadow-lg sticky top-0 z-50">
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between text-xs text-white/50">
            <span>Официальный портал государственного вещания · Wild Politics</span>
            <span>{new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => navigate("home")} className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gov-gold flex items-center justify-center shadow-md">
              <span className="text-gov-navy font-black text-xs">ОГФ</span>
            </div>
            <div className="text-left hidden sm:block">
              <h1 className="font-black text-lg leading-tight tracking-wide">ГТРК ОГФ</h1>
              <p className="text-xs text-white/50 leading-none">Государственное Телерадиовещание</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-all duration-200 ${
                  section === item.key ? "bg-gov-gold text-gov-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon name={item.icon} size={14} />
                {item.label}
                {item.key === "moderation" && modCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-black leading-none">
                    {modCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-8 h-8 rounded-full border-2 border-gov-gold" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gov-gold flex items-center justify-center">
                    <span className="text-gov-navy font-black text-xs">{(user.first_name || "U")[0]}</span>
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold leading-tight">{user.first_name} {user.last_name}</p>
                  {user.is_admin ? (
                    <p className="text-xs text-gov-gold leading-tight">Администратор</p>
                  ) : (
                    <button onClick={() => setAdminCodeStep(true)} className="text-xs text-white/50 hover:text-gov-gold transition-colors leading-tight">
                      Войти как админ
                    </button>
                  )}
                </div>
                <button onClick={logout} className="text-white/50 hover:text-white transition-colors">
                  <Icon name="LogOut" size={16} />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setAuthModal(true)}
                className="bg-gov-gold text-gov-navy font-bold hover:bg-gov-gold/90 text-xs"
              >
                <Icon name="LogIn" size={14} className="mr-1" />
                Войти
              </Button>
            )}
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 animate-fade-in">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`flex items-center gap-2 w-full px-3 py-2.5 rounded text-sm font-semibold mb-1 transition-all ${
                  section === item.key ? "bg-gov-gold text-gov-navy" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon name={item.icon} size={14} />
                {item.label}
              </button>
            ))}
          </div>
        )}
        <div className="h-0.5 bg-gov-gold" />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Icon name="Loader2" size={40} className="animate-spin text-gov-navy mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Загрузка портала...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ===== HOME ===== */}
            {section === "home" && !selectedArticle && (
              <div className="animate-fade-in">
                <div className="gov-gradient rounded-xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gov-gold/10 rounded-full translate-y-1/2 -translate-x-1/4" />
                  <div className="relative">
                    <Badge className="bg-gov-gold text-gov-navy font-bold mb-3 text-xs px-3">ОФИЦИАЛЬНЫЙ ПОРТАЛ</Badge>
                    <h2 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
                      Государственное Телерадиовещание<br />
                      <span className="text-gov-gold">Объединённой Гражданской Федерации</span>
                    </h2>
                    <p className="text-white/70 text-sm max-w-xl leading-relaxed">
                      Главный информационный ресурс ОГФ. Официальные новости, аналитика и трансляции государственных каналов.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-5">
                      <Button onClick={() => navigate("news")} className="bg-gov-gold text-gov-navy font-bold hover:bg-gov-gold/90">
                        <Icon name="Newspaper" size={14} className="mr-2" />Лента новостей
                      </Button>
                      <Button onClick={() => navigate("channels")} variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                        <Icon name="Radio" size={14} className="mr-2" />Каналы
                      </Button>
                      {!user && (
                        <Button onClick={() => setAuthModal(true)} variant="outline" className="border-gov-gold/50 text-gov-gold bg-transparent hover:bg-gov-gold/10">
                          <Icon name="LogIn" size={14} className="mr-2" />Войти через Telegram
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {publishedArticles.filter(a => a.is_breaking).map(a => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                    <Badge className="bg-gov-red text-white font-black text-xs shrink-0">СРОЧНО</Badge>
                    <button onClick={() => setSelectedArticle(a)} className="text-sm font-semibold text-foreground hover:text-gov-navy transition-colors text-left flex-1">
                      {a.title}
                    </button>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.created_at)}</span>
                  </div>
                ))}

                {publishedArticles.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Icon name="Newspaper" size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Публикаций пока нет</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {publishedArticles.map((article, i) => (
                      <article
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        <div className={`h-1.5 ${article.channel_color}`} />
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline" className="text-xs font-medium">{article.channel_name}</Badge>
                            {article.channel_verified && article.channel_verification_type && (
                              <VerificationBadge type={article.channel_verification_type} label={VERIFICATION_TYPES.find(v => v.value === article.channel_verification_type)?.label || null} />
                            )}
                            {article.is_breaking && <Badge className="bg-gov-red text-white text-xs font-bold">СРОЧНО</Badge>}
                          </div>
                          <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-3">{article.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{article.excerpt}</p>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">{formatDate(article.created_at)}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{article.views}</span>
                              <span className="flex items-center gap-1"><Icon name="MessageSquare" size={11} />{article.comment_count}</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== NEWS ===== */}
            {section === "news" && !selectedArticle && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gov-gold rounded-full" />
                  <h2 className="text-2xl font-black">Лента новостей</h2>
                  <Badge className="bg-gov-navy text-gov-gold ml-2">{publishedArticles.length}</Badge>
                </div>
                {publishedArticles.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Icon name="Newspaper" size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Публикаций пока нет</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {publishedArticles.map((article, i) => (
                      <article
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-gov-gold/40 transition-all duration-200 animate-fade-in flex gap-4"
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        <div className={`w-1 rounded-full flex-shrink-0 ${article.channel_color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">{article.channel_name}</Badge>
                            {article.channel_verified && article.channel_verification_type && (
                              <VerificationBadge type={article.channel_verification_type} label={VERIFICATION_TYPES.find(v => v.value === article.channel_verification_type)?.label || null} />
                            )}
                            {article.is_breaking && <Badge className="bg-gov-red text-white text-xs font-bold">СРОЧНО</Badge>}
                            <span className="text-xs text-muted-foreground ml-auto">{formatDate(article.created_at)}</span>
                          </div>
                          <h3 className="font-bold text-base mb-1 leading-snug">{article.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>{article.author_name}</span>
                            <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{article.views}</span>
                            <span className="flex items-center gap-1"><Icon name="MessageSquare" size={11} />{article.comment_count}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== ARTICLE DETAIL ===== */}
            {selectedArticle && (
              <div className="animate-fade-in max-w-3xl">
                <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium">
                  <Icon name="ArrowLeft" size={16} /> Назад
                </button>
                <div className={`h-1.5 rounded-t-xl ${selectedArticle.channel_color}`} />
                <div className="bg-card border border-border border-t-0 rounded-b-xl p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="outline">{selectedArticle.channel_name}</Badge>
                    {selectedArticle.channel_verified && selectedArticle.channel_verification_type && (
                      <VerificationBadge type={selectedArticle.channel_verification_type} label={VERIFICATION_TYPES.find(v => v.value === selectedArticle.channel_verification_type)?.label || null} />
                    )}
                    {selectedArticle.is_breaking && <Badge className="bg-gov-red text-white font-bold">СРОЧНО</Badge>}
                  </div>
                  <h1 className="font-black text-2xl leading-tight mb-4 font-merriweather">{selectedArticle.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
                    <span className="flex items-center gap-1.5"><Icon name="User" size={14} />{selectedArticle.author_name}</span>
                    <span className="flex items-center gap-1.5"><Icon name="Calendar" size={14} />{formatDate(selectedArticle.created_at)}</span>
                    <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} />{selectedArticle.views} просмотров</span>
                  </div>
                  <div className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{selectedArticle.content}</div>

                  {/* Comments */}
                  <div className="mt-10">
                    <h3 className="font-bold text-lg mb-5 flex items-center gap-2">
                      <Icon name="MessageSquare" size={18} />
                      Обсуждение
                      <span className="text-sm text-muted-foreground font-normal">({articleComments.length})</span>
                    </h3>
                    {articleComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic mb-6">Комментариев пока нет. Будьте первым!</p>
                    ) : (
                      <div className="space-y-3 mb-6">
                        {articleComments.map(c => (
                          <div key={c.id} className="bg-muted/40 rounded-lg p-4 animate-fade-in">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-sm">{c.author_name}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-foreground/80">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {user ? (
                      <div className="bg-muted/30 rounded-xl p-5 border border-border">
                        <p className="text-sm font-semibold mb-1">Оставить комментарий</p>
                        <p className="text-xs text-muted-foreground mb-4">Комментарий появится после проверки модератором.</p>
                        <Textarea
                          placeholder="Ваш комментарий..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          className="mb-3 text-sm resize-none"
                          rows={3}
                        />
                        <Button onClick={handleAddComment} disabled={!commentText} className="bg-gov-navy text-gov-gold hover:bg-gov-navy/90 font-bold">
                          <Icon name="Send" size={14} className="mr-2" />Отправить
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-xl p-5 border border-border text-center">
                        <Icon name="MessageSquare" size={28} className="mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mb-3">Войдите через Telegram, чтобы оставить комментарий</p>
                        <Button onClick={() => setAuthModal(true)} className="bg-gov-navy text-gov-gold font-bold">
                          <Icon name="LogIn" size={14} className="mr-2" />Войти
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== CHANNELS ===== */}
            {section === "channels" && !selectedChannel && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gov-gold rounded-full" />
                    <h2 className="text-2xl font-black">Телеканалы ГТРК</h2>
                  </div>
                  {user && (
                    <Button onClick={() => setCreateChannelModal(true)} className="bg-gov-navy text-gov-gold font-bold hover:bg-gov-navy/90">
                      <Icon name="Plus" size={14} className="mr-2" />Создать канал
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {channels.map((ch, i) => (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch)}
                      className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className={`${ch.color} p-6 text-white relative`}>
                        {ch.is_verified && (
                          <div className="absolute top-3 right-3">
                            <Icon name="BadgeCheck" size={20} className="text-white/90" />
                          </div>
                        )}
                        <Icon name={ch.icon} size={32} className="mb-2 opacity-90" />
                        <h3 className="font-black text-lg leading-tight">{ch.name}</h3>
                        {ch.is_verified && ch.verification_label && (
                          <p className="text-white/70 text-xs mt-1">{ch.verification_label}</p>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">{ch.description}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
                          <span className="flex items-center gap-1"><Icon name="FileText" size={11} />{ch.posts} публикаций</span>
                          {user?.is_admin && (
                            <button
                              onClick={e => { e.stopPropagation(); if (ch.is_verified) handleUnverifyChannel(ch); else { setVerifyChannel(ch); setVerifyModal(true); } }}
                              className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${ch.is_verified ? "text-red-500 hover:bg-red-50" : "text-blue-600 hover:bg-blue-50"}`}
                            >
                              {ch.is_verified ? "Снять верификацию" : "Верифицировать"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "channels" && selectedChannel && (
              <div className="animate-fade-in">
                <button onClick={() => setSelectedChannel(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium">
                  <Icon name="ArrowLeft" size={16} /> Все каналы
                </button>
                <div className={`${selectedChannel.color} rounded-xl p-8 text-white mb-6 shadow-xl relative`}>
                  {selectedChannel.is_verified && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                      <Icon name="BadgeCheck" size={14} className="text-white" />
                      <span className="text-xs text-white font-bold">{selectedChannel.verification_label}</span>
                    </div>
                  )}
                  <Icon name={selectedChannel.icon} size={40} className="mb-3 opacity-90" />
                  <h2 className="text-3xl font-black mb-1">{selectedChannel.name}</h2>
                  <p className="text-white/70 mb-4">{selectedChannel.description}</p>
                  <div className="flex gap-6 text-sm">
                    <span className="flex items-center gap-2"><Icon name="FileText" size={14} />{selectedChannel.posts} публикаций</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-4">Публикации канала</h3>
                {publishedArticles.filter(a => a.channel_id === selectedChannel.id).length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">Публикаций пока нет.</p>
                ) : (
                  <div className="space-y-3">
                    {publishedArticles.filter(a => a.channel_id === selectedChannel.id).map(article => (
                      <article key={article.id} onClick={() => setSelectedArticle(article)} className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-gov-gold/40 transition-all duration-200">
                        <h4 className="font-bold mb-1.5">{article.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{formatDate(article.created_at)}</span>
                          <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{article.views}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== PUBLICATIONS ===== */}
            {section === "publications" && (
              <div className="animate-fade-in max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gov-gold rounded-full" />
                  <h2 className="text-2xl font-black">Предложить публикацию</h2>
                </div>
                {!user ? (
                  <div className="bg-card border border-border rounded-xl p-10 text-center">
                    <Icon name="Lock" size={40} className="mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="font-bold text-lg mb-2">Требуется авторизация</h3>
                    <p className="text-sm text-muted-foreground mb-5">Войдите через Telegram, чтобы предлагать публикации.</p>
                    <Button onClick={() => setAuthModal(true)} className="bg-gov-navy text-gov-gold font-bold">
                      <Icon name="LogIn" size={14} className="mr-2" />Войти через Telegram
                    </Button>
                  </div>
                ) : pubSent ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center animate-scale-in">
                    <Icon name="CheckCircle2" size={52} className="text-emerald-500 mx-auto mb-4" />
                    <h3 className="font-black text-xl mb-2">Отправлено на рассмотрение</h3>
                    <p className="text-sm text-muted-foreground mb-6">Редакция ГТРК ОГФ рассмотрит материал и примет решение о публикации.</p>
                    <Button onClick={() => setPubSent(false)} variant="outline"><Icon name="Plus" size={14} className="mr-2" />Предложить ещё</Button>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="bg-gov-navy/5 border border-gov-navy/20 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
                      <Icon name="Info" size={16} className="text-gov-navy mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground/70 leading-relaxed">Граждане ОГФ могут предлагать материалы. После проверки редакцией одобренные материалы появятся в ленте.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Заголовок *</label>
                        <Input placeholder="Краткий и ёмкий заголовок" value={pubTitle} onChange={e => setPubTitle(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Канал *</label>
                        <select value={pubChannelId} onChange={e => setPubChannelId(e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="">Выберите канал...</option>
                          {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1.5 block">Текст публикации *</label>
                        <Textarea placeholder="Подробное описание события, факты, источники..." value={pubContent} onChange={e => setPubContent(e.target.value)} rows={6} className="resize-none" />
                      </div>
                      <Button onClick={handlePublish} disabled={!pubTitle || !pubContent || !pubChannelId} className="w-full bg-gov-navy text-gov-gold hover:bg-gov-navy/90 font-bold h-11">
                        <Icon name="Send" size={16} className="mr-2" />Отправить на рассмотрение
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== ABOUT ===== */}
            {section === "about" && (
              <div className="animate-fade-in max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gov-gold rounded-full" />
                  <h2 className="text-2xl font-black">Об Объединённой Гражданской Федерации</h2>
                </div>
                <div className="gov-gradient rounded-xl p-8 text-white mb-6 shadow-xl">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-full bg-gov-gold flex items-center justify-center shadow-lg">
                      <span className="font-black text-gov-navy text-xl">ОГФ</span>
                    </div>
                    <div>
                      <h3 className="font-black text-xl">Объединённая Гражданская Федерация</h3>
                      <p className="text-white/60 text-sm">Wild Politics · Игровое государство</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Объединённая Гражданская Федерация — демократическое государство в мире Wild Politics, основанное на принципах гражданского единства, верховенства закона и прозрачного управления.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { icon: "Radio", title: "ГТРК ОГФ", desc: "Государственное телерадиовещание обеспечивает граждан достоверной информацией." },
                    { icon: "Shield", title: "Миссия", desc: "Информирование, просвещение и объединение граждан через качественный контент." },
                    { icon: "Globe", title: "Охват", desc: "Портал охватывает все регионы ОГФ и поддерживает связь между гражданами." },
                    { icon: "Scale", title: "Принципы", desc: "Достоверность, беспристрастность, прозрачность и служение интересам граждан." },
                  ].map((item, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-gov-navy flex items-center justify-center">
                          <Icon name={item.icon} size={16} className="text-gov-gold" />
                        </div>
                        <h4 className="font-bold">{item.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Icon name="Radio" size={18} />Каналы вещания</h3>
                  <div className="space-y-2.5">
                    {channels.map(ch => (
                      <div key={ch.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ch.color}`} />
                        <span className="font-medium text-sm">{ch.name}</span>
                        {ch.is_verified && <Icon name="BadgeCheck" size={14} className="text-blue-600" />}
                        {ch.verification_label && <span className="text-xs text-muted-foreground">{ch.verification_label}</span>}
                        <span className="text-xs text-muted-foreground ml-auto">{ch.posts} материалов</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== MODERATION ===== */}
            {section === "moderation" && (
              <div className="animate-fade-in">
                {!user?.is_admin ? (
                  <div className="text-center py-20">
                    <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="font-bold text-xl mb-2">Доступ запрещён</h3>
                    <p className="text-muted-foreground text-sm">Этот раздел доступен только администраторам.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 bg-gov-gold rounded-full" />
                      <h2 className="text-2xl font-black">Панель модерации</h2>
                      <Badge className="bg-gov-navy text-gov-gold text-xs">Администратор</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {[
                        { label: "Опубликовано", value: publishedArticles.length, icon: "CheckCircle2", bg: "bg-emerald-50 border-emerald-100", color: "text-emerald-600" },
                        { label: "На рассмотрении", value: pendingArticles.length, icon: "Clock", bg: "bg-amber-50 border-amber-100", color: "text-amber-600" },
                        { label: "Каналов", value: channels.length, icon: "Radio", bg: "bg-blue-50 border-blue-100", color: "text-blue-600" },
                        { label: "Комментарии", value: pendingComments.length, icon: "MessageSquare", bg: "bg-purple-50 border-purple-100", color: "text-purple-600" },
                      ].map((s, i) => (
                        <div key={i} className={`${s.bg} border rounded-xl p-4 animate-fade-in`} style={{ animationDelay: `${i * 0.05}s` }}>
                          <Icon name={s.icon} size={20} className={`${s.color} mb-2`} />
                          <div className="text-2xl font-black">{s.value}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <Separator className="mb-8" />

                    {/* Pending Articles */}
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Icon name="Clock" size={18} className="text-amber-500" />Публикации на рассмотрении
                    </h3>
                    {pendingArticles.length === 0 ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center mb-8 flex flex-col items-center">
                        <Icon name="CheckCircle2" size={32} className="text-emerald-500 mb-2" />
                        <p className="text-sm font-semibold text-emerald-700">Нет публикаций на рассмотрении</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-8">
                        {pendingArticles.map(article => (
                          <div key={article.id} className="bg-card border border-amber-200 rounded-xl p-5 animate-fade-in">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">{article.channel_name}</Badge>
                                  <Badge className="bg-amber-100 text-amber-800 text-xs border border-amber-200">Ожидает</Badge>
                                </div>
                                <h4 className="font-bold text-sm mb-1">{article.title}</h4>
                                <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{article.excerpt}</p>
                                <p className="text-xs text-muted-foreground">Автор: <span className="font-medium">{article.author_name}</span></p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" onClick={() => handleModerateArticle(article.id, "approve")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                  <Icon name="Check" size={14} className="mr-1" />Одобрить
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleModerateArticle(article.id, "reject")} className="border-red-300 text-red-600 hover:bg-red-50">
                                  <Icon name="X" size={14} className="mr-1" />Отклонить
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator className="mb-8" />

                    {/* Pending Comments */}
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Icon name="MessageSquare" size={18} className="text-purple-500" />Комментарии на проверке
                    </h3>
                    {pendingComments.length === 0 ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center mb-8 flex flex-col items-center">
                        <Icon name="CheckCircle2" size={32} className="text-emerald-500 mb-2" />
                        <p className="text-sm font-semibold text-emerald-700">Нет комментариев на проверке</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-8">
                        {pendingComments.map(c => (
                          <div key={c.id} className="bg-card border border-purple-200 rounded-xl p-4 animate-fade-in">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">Комментарий к статье #{c.article_id}</p>
                                <p className="font-semibold text-sm">{c.author_name}</p>
                                <p className="text-sm text-foreground/80 mt-0.5">{c.text}</p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" onClick={() => handleModerateComment(c.id, "approve")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <Icon name="Check" size={14} />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleModerateComment(c.id, "reject")} className="border-red-300 text-red-600 hover:bg-red-50">
                                  <Icon name="X" size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator className="mb-8" />

                    {/* Channel verification */}
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Icon name="BadgeCheck" size={18} className="text-blue-600" />Верификация каналов
                    </h3>
                    <div className="space-y-3">
                      {channels.map(ch => (
                        <div key={ch.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                          <div className={`${ch.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon name={ch.icon} size={18} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm">{ch.name}</span>
                              {ch.is_verified && <VerificationBadge type={ch.verification_type} label={ch.verification_label} />}
                            </div>
                            <p className="text-xs text-muted-foreground">{ch.description || "Без описания"}</p>
                          </div>
                          {ch.is_verified ? (
                            <Button size="sm" variant="outline" onClick={() => handleUnverifyChannel(ch)} className="border-red-300 text-red-600 hover:bg-red-50 shrink-0">
                              Снять
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => { setVerifyChannel(ch); setVerifyModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                              <Icon name="BadgeCheck" size={13} className="mr-1" />Верифицировать
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="gov-gradient text-white mt-16">
        <div className="h-0.5 bg-gov-gold" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gov-gold flex items-center justify-center">
                  <span className="text-gov-navy font-black text-xs">ОГФ</span>
                </div>
                <span className="font-black">ГТРК ОГФ</span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">Государственное Телерадиовещание Объединённой Гражданской Федерации</p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-gov-gold">Разделы</h4>
              <div className="space-y-1.5">
                {navItems.slice(0, 4).map(item => (
                  <button key={item.key} onClick={() => navigate(item.key)} className="block text-xs text-white/50 hover:text-white transition-colors text-left">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-gov-gold">Каналы</h4>
              <div className="space-y-1.5">
                {channels.slice(0, 4).map(ch => (
                  <p key={ch.id} className="text-xs text-white/50">{ch.name}</p>
                ))}
              </div>
            </div>
          </div>
          <Separator className="bg-white/10 mb-4" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/30">
            <span>© 2026 ГТРК ОГФ · Wild Politics</span>
            <span>Объединённая Гражданская Федерация</span>
          </div>
        </div>
      </footer>

      {/* ===== AUTH MODAL ===== */}
      <Dialog open={authModal} onOpenChange={setAuthModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="LogIn" size={18} className="text-gov-navy" />
              Вход через Telegram
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="bg-gov-navy/5 rounded-xl p-6 mb-4">
              <Icon name="MessageCircle" size={48} className="text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Для входа используется официальный виджет Telegram. Нажмите кнопку ниже и авторизуйтесь.
              </p>
              <div className="flex justify-center">
                <div
                  dangerouslySetInnerHTML={{
                    __html: `<script async src="https://telegram.org/js/telegram-widget.js?22"
                      data-telegram-login="YOUR_BOT_USERNAME"
                      data-size="large"
                      data-onauth="onTelegramAuth(user)"
                      data-request-access="write"></script>`
                  }}
                />
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
                  onClick={() => {
                    // Для демонстрации — симулируем вход
                    const demo: User = {
                      user_id: 1,
                      telegram_id: 123456789,
                      first_name: "Гражданин",
                      username: "citizen_ogf",
                      is_admin: false,
                    };
                    saveUser(demo);
                    setAuthModal(false);
                  }}
                >
                  <Icon name="MessageCircle" size={16} className="mr-2" />
                  Войти через Telegram
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Для работы реальной авторизации необходимо добавить токен бота в настройках проекта.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== ADMIN CODE MODAL ===== */}
      <Dialog open={adminCodeStep} onOpenChange={v => { setAdminCodeStep(v); setAdminCodeSent(false); setAdminCode(""); setAdminCodeError(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="ShieldCheck" size={18} className="text-gov-navy" />
              Вход администратора
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {!adminCodeSent ? (
              <>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Нажмите «Получить код» — бот ГТРК ОГФ пришлёт одноразовый код в ваш Telegram.
                </p>
                {adminCodeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                    {adminCodeError}
                  </div>
                )}
                <Button onClick={handleRequestAdminCode} className="w-full bg-gov-navy text-gov-gold font-bold">
                  <Icon name="Send" size={14} className="mr-2" />Получить код в Telegram
                </Button>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-sm text-emerald-700 flex items-center gap-2">
                  <Icon name="CheckCircle2" size={16} />
                  Код отправлен в Telegram
                </div>
                <p className="text-sm text-muted-foreground mb-3">Введите 6-значный код из бота:</p>
                <Input
                  placeholder="123456"
                  value={adminCode}
                  onChange={e => setAdminCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mb-3 text-center text-2xl font-black tracking-[0.4em]"
                  maxLength={6}
                />
                {adminCodeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">
                    {adminCodeError}
                  </div>
                )}
                <Button onClick={handleVerifyAdminCode} disabled={adminCode.length < 6} className="w-full bg-gov-navy text-gov-gold font-bold">
                  <Icon name="ShieldCheck" size={14} className="mr-2" />Подтвердить
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== CREATE CHANNEL MODAL ===== */}
      <Dialog open={createChannelModal} onOpenChange={setCreateChannelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Radio" size={18} className="text-gov-navy" />
              Создать канал
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Название *</label>
              <Input placeholder="Название канала" value={chName} onChange={e => setChName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Описание</label>
              <Textarea placeholder="О чём этот канал?" value={chDesc} onChange={e => setChDesc(e.target.value)} rows={2} className="resize-none" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Иконка</label>
              <div className="grid grid-cols-6 gap-2">
                {CHANNEL_ICONS.map(ic => (
                  <button
                    key={ic}
                    onClick={() => setChIcon(ic)}
                    className={`p-2 rounded-lg border transition-all ${chIcon === ic ? "border-gov-navy bg-gov-navy text-white" : "border-border hover:border-gov-navy/40"}`}
                  >
                    <Icon name={ic} size={16} className={chIcon === ic ? "text-gov-gold" : ""} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Цвет</label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setChColor(c.value)}
                    title={c.label}
                    className={`w-8 h-8 rounded-lg ${c.value} transition-all ${chColor === c.value ? "ring-2 ring-offset-2 ring-gray-800" : ""}`}
                  />
                ))}
              </div>
            </div>
            <div className={`${chColor} rounded-lg p-3 text-white flex items-center gap-2`}>
              <Icon name={chIcon} size={18} />
              <span className="font-bold text-sm">{chName || "Предпросмотр"}</span>
            </div>
            <Button onClick={handleCreateChannel} disabled={!chName} className="w-full bg-gov-navy text-gov-gold font-bold">
              <Icon name="Plus" size={14} className="mr-2" />Создать канал
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== VERIFY CHANNEL MODAL ===== */}
      <Dialog open={verifyModal} onOpenChange={setVerifyModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="BadgeCheck" size={18} className="text-blue-600" />
              Верификация канала
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {verifyChannel && (
              <div className={`${verifyChannel.color} rounded-lg p-3 text-white flex items-center gap-2 mb-4`}>
                <Icon name={verifyChannel.icon} size={16} />
                <span className="font-bold text-sm">{verifyChannel.name}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">Выберите тип верификации для канала:</p>
            <div className="space-y-2 mb-4">
              {VERIFICATION_TYPES.map(vt => (
                <button
                  key={vt.value}
                  onClick={() => setVerifyType(vt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${verifyType === vt.value ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-300"}`}
                >
                  <Icon name={vt.icon} size={18} className={verifyType === vt.value ? "text-blue-600" : "text-muted-foreground"} />
                  <span className={`font-semibold text-sm ${verifyType === vt.value ? "text-blue-700" : ""}`}>{vt.label}</span>
                  {verifyType === vt.value && <Icon name="Check" size={16} className="text-blue-600 ml-auto" />}
                </button>
              ))}
            </div>
            <Button onClick={handleVerifyChannel} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
              <Icon name="BadgeCheck" size={14} className="mr-2" />Верифицировать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
