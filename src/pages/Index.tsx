import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Section = "home" | "news" | "channels" | "publications" | "about" | "moderation";

interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
  status: "approved" | "pending" | "rejected";
}

interface Article {
  id: number;
  title: string;
  excerpt: string;
  channel: string;
  channelColor: string;
  date: string;
  status: "published" | "pending" | "rejected";
  author: string;
  comments: Comment[];
  views: number;
  isBreaking?: boolean;
}

interface Channel {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  posts: number;
  subscribers: number;
}

const CHANNELS: Channel[] = [
  { id: 1, name: "ОГФ Новости", description: "Официальные новости Объединённой Гражданской Федерации", icon: "Newspaper", color: "bg-blue-700", posts: 142, subscribers: 4820 },
  { id: 2, name: "Политика и власть", description: "Законодательство, решения правительства, политические события", icon: "Landmark", color: "bg-indigo-700", posts: 87, subscribers: 3210 },
  { id: 3, name: "Экономика ОГФ", description: "Финансы, торговля, экономические отчёты федерации", icon: "TrendingUp", color: "bg-emerald-700", posts: 64, subscribers: 2780 },
  { id: 4, name: "Культура и общество", description: "Культурная жизнь, события и общественные инициативы", icon: "Theater", color: "bg-violet-700", posts: 53, subscribers: 1940 },
  { id: 5, name: "Международные отношения", description: "Дипломатия, союзники и международные события", icon: "Globe", color: "bg-amber-700", posts: 39, subscribers: 2100 },
  { id: 6, name: "Спорт и достижения", description: "Спортивные события, рекорды и достижения граждан", icon: "Trophy", color: "bg-rose-700", posts: 28, subscribers: 1350 },
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    title: "Правительство ОГФ утвердило новый государственный бюджет на следующий квартал",
    excerpt: "На заседании высшего совета федерации единогласно принят бюджет с увеличением расходов на инфраструктуру и социальные программы на 18%.",
    channel: "Политика и власть",
    channelColor: "bg-indigo-700",
    date: "22 февраля 2026",
    status: "published",
    author: "Пресс-служба ОГФ",
    views: 3241,
    isBreaking: true,
    comments: [
      { id: 1, author: "Гражданин Соколов", text: "Важное решение для развития инфраструктуры!", date: "22 февраля 2026", status: "approved" },
      { id: 2, author: "Аналитик ОГФ", text: "Рост на 18% — значительный показатель.", date: "22 февраля 2026", status: "pending" },
    ]
  },
  {
    id: 2,
    title: "ОГФ и Альянс Северных Территорий подписали соглашение о торговом сотрудничестве",
    excerpt: "Двустороннее соглашение открывает новые возможности для экспорта федерации и укрепляет дипломатические связи.",
    channel: "Международные отношения",
    channelColor: "bg-amber-700",
    date: "21 февраля 2026",
    status: "published",
    author: "МИД ОГФ",
    views: 2187,
    comments: [
      { id: 3, author: "Эксперт по внешним связям", text: "Исторический шаг для нашей федерации.", date: "21 февраля 2026", status: "approved" },
    ]
  },
  {
    id: 3,
    title: "Экономика ОГФ показала рост ВВП на 4.2% по итогам квартала",
    excerpt: "Министерство экономики опубликовало отчёт о стабильном росте ключевых показателей, превысившем прогнозы аналитиков.",
    channel: "Экономика ОГФ",
    channelColor: "bg-emerald-700",
    date: "20 февраля 2026",
    status: "published",
    author: "Министерство экономики",
    views: 1854,
    comments: []
  },
  {
    id: 4,
    title: "Открытие федерального культурного центра в столице",
    excerpt: "Новый центр станет площадкой для объединения граждан всех регионов федерации через искусство и творчество.",
    channel: "Культура и общество",
    channelColor: "bg-violet-700",
    date: "19 февраля 2026",
    status: "published",
    author: "Министерство культуры",
    views: 1203,
    comments: []
  },
  {
    id: 5,
    title: "Предложение о реформе налоговой системы ОГФ",
    excerpt: "Группа депутатов внесла законопроект о снижении налоговой нагрузки для малого бизнеса и упрощении отчётности.",
    channel: "Политика и власть",
    channelColor: "bg-indigo-700",
    date: "18 февраля 2026",
    status: "pending",
    author: "Фракция «Развитие»",
    views: 0,
    comments: []
  },
  {
    id: 6,
    title: "Спортивная сборная ОГФ заняла первое место в межфедеральном турнире",
    excerpt: "Наши спортсмены одержали победу в командном зачёте, набрав рекордное количество очков за всю историю соревнований.",
    channel: "Спорт и достижения",
    channelColor: "bg-rose-700",
    date: "17 февраля 2026",
    status: "published",
    author: "Спортивный комитет ОГФ",
    views: 2890,
    comments: []
  },
];

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalText, setProposalText] = useState("");
  const [proposalChannel, setProposalChannel] = useState("");
  const [proposalSent, setProposalSent] = useState(false);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publishedArticles = articles.filter(a => a.status === "published");
  const pendingArticles = articles.filter(a => a.status === "pending");
  const pendingComments = articles.reduce((acc, a) => acc + a.comments.filter(c => c.status === "pending").length, 0);

  const navItems: { key: Section; label: string; icon: string }[] = [
    { key: "home", label: "Главная", icon: "Home" },
    { key: "news", label: "Новости", icon: "Newspaper" },
    { key: "channels", label: "Каналы", icon: "Radio" },
    { key: "publications", label: "Публикации", icon: "FileText" },
    { key: "about", label: "О федерации", icon: "Shield" },
    { key: "moderation", label: "Модерация", icon: "ShieldCheck" },
  ];

  const navigate = (s: Section) => {
    setSection(s);
    setSelectedArticle(null);
    setSelectedChannel(null);
    setMobileMenuOpen(false);
  };

  const handleApprove = (id: number) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: "published" } : a));
  };

  const handleReject = (id: number) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" } : a));
  };

  const handleSendProposal = () => {
    if (!proposalTitle || !proposalText || !proposalChannel) return;
    const newArticle: Article = {
      id: Date.now(),
      title: proposalTitle,
      excerpt: proposalText.slice(0, 140) + (proposalText.length > 140 ? "..." : ""),
      channel: proposalChannel,
      channelColor: "bg-blue-700",
      date: "22 февраля 2026",
      status: "pending",
      author: "Гражданин ОГФ",
      views: 0,
      comments: [],
    };
    setArticles(prev => [...prev, newArticle]);
    setProposalSent(true);
    setProposalTitle("");
    setProposalText("");
    setProposalChannel("");
  };

  const handleAddComment = (articleId: number) => {
    if (!commentText || !commentAuthor) return;
    const newComment: Comment = {
      id: Date.now(),
      author: commentAuthor,
      text: commentText,
      date: "22 февраля 2026",
      status: "pending",
    };
    setArticles(prev => prev.map(a =>
      a.id === articleId ? { ...a, comments: [...a.comments, newComment] } : a
    ));
    setSelectedArticle(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
    setCommentText("");
    setCommentAuthor("");
  };

  const approveComment = (articleId: number, commentId: number) => {
    const update = (a: Article) =>
      a.id === articleId
        ? { ...a, comments: a.comments.map(c => c.id === commentId ? { ...c, status: "approved" as const } : c) }
        : a;
    setArticles(prev => prev.map(update));
    setSelectedArticle(prev => prev ? update(prev) : null);
  };

  const rejectComment = (articleId: number, commentId: number) => {
    const update = (a: Article) =>
      a.id === articleId
        ? { ...a, comments: a.comments.map(c => c.id === commentId ? { ...c, status: "rejected" as const } : c) }
        : a;
    setArticles(prev => prev.map(update));
  };

  return (
    <div className="min-h-screen bg-background font-montserrat">

      {/* HEADER */}
      <header className="gov-gradient text-white shadow-lg sticky top-0 z-50">
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between text-xs text-white/50">
            <span>Официальный портал государственного вещания · Wild Politics</span>
            <span>22 февраля 2026</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("home")} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gov-gold flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-gov-navy font-black text-xs">ОГФ</span>
            </div>
            <div className="text-left">
              <h1 className="font-black text-lg leading-tight tracking-wide">ГТРК ОГФ</h1>
              <p className="text-xs text-white/50 leading-none">Государственное Телерадиовещание</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-all duration-200 ${
                  section === item.key
                    ? "bg-gov-gold text-gov-navy"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon name={item.icon} size={14} />
                {item.label}
                {item.key === "moderation" && (pendingArticles.length + pendingComments) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                    {pendingArticles.length + pendingComments}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
          </button>
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
                <div className="flex gap-3 mt-5">
                  <Button onClick={() => navigate("news")} className="bg-gov-gold text-gov-navy font-bold hover:bg-gov-gold/90">
                    <Icon name="Newspaper" size={14} className="mr-2" />
                    Лента новостей
                  </Button>
                  <Button onClick={() => navigate("channels")} variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                    <Icon name="Radio" size={14} className="mr-2" />
                    Каналы
                  </Button>
                </div>
              </div>
            </div>

            {publishedArticles.filter(a => a.isBreaking).map(a => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                <Badge className="bg-gov-red text-white font-black text-xs shrink-0">СРОЧНО</Badge>
                <button
                  onClick={() => setSelectedArticle(a)}
                  className="text-sm font-semibold text-foreground hover:text-gov-navy transition-colors text-left flex-1"
                >
                  {a.title}
                </button>
                <span className="text-xs text-muted-foreground shrink-0">{a.date}</span>
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {publishedArticles.map((article, i) => (
                <article
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className={`h-1.5 ${article.channelColor}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="outline" className="text-xs font-medium">{article.channel}</Badge>
                      {article.isBreaking && <Badge className="bg-gov-red text-white text-xs font-bold">СРОЧНО</Badge>}
                    </div>
                    <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-3">{article.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">{article.date}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{article.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Icon name="MessageSquare" size={11} />{article.comments.filter(c => c.status === "approved").length}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ===== NEWS ===== */}
        {section === "news" && !selectedArticle && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gov-gold rounded-full" />
              <h2 className="text-2xl font-black">Лента новостей</h2>
              <Badge className="bg-gov-navy text-gov-gold ml-2">{publishedArticles.length} материалов</Badge>
            </div>
            <div className="space-y-3">
              {publishedArticles.map((article, i) => (
                <article
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-gov-gold/40 transition-all duration-200 animate-fade-in flex gap-4"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className={`w-1 rounded-full flex-shrink-0 ${article.channelColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{article.channel}</Badge>
                      {article.isBreaking && <Badge className="bg-gov-red text-white text-xs font-bold">СРОЧНО</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">{article.date}</span>
                    </div>
                    <h3 className="font-bold text-base mb-1 leading-snug">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{article.author}</span>
                      <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{article.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Icon name="MessageSquare" size={11} />{article.comments.filter(c => c.status === "approved").length}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ===== ARTICLE DETAIL ===== */}
        {selectedArticle && (
          <div className="animate-fade-in max-w-3xl">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium"
            >
              <Icon name="ArrowLeft" size={16} /> Назад
            </button>
            <div className={`h-1.5 rounded-t-xl ${selectedArticle.channelColor}`} />
            <div className="bg-card border border-border border-t-0 rounded-b-xl p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline">{selectedArticle.channel}</Badge>
                {selectedArticle.isBreaking && <Badge className="bg-gov-red text-white font-bold">СРОЧНО</Badge>}
              </div>
              <h1 className="font-black text-2xl leading-tight mb-4 font-merriweather">{selectedArticle.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
                <span className="flex items-center gap-1.5"><Icon name="User" size={14} />{selectedArticle.author}</span>
                <span className="flex items-center gap-1.5"><Icon name="Calendar" size={14} />{selectedArticle.date}</span>
                <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} />{selectedArticle.views.toLocaleString()} просмотров</span>
              </div>
              <p className="text-base leading-relaxed text-foreground/90 mb-4">{selectedArticle.excerpt}</p>
              <p className="text-base leading-relaxed text-foreground/75">
                Данная публикация является официальным сообщением ГТРК Объединённой Гражданской Федерации. Все материалы проходят редакционную проверку перед публикацией и соответствуют стандартам государственного вещания.
              </p>

              <div className="mt-10">
                <h3 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <Icon name="MessageSquare" size={18} />
                  Обсуждение
                  <span className="text-sm text-muted-foreground font-normal">
                    ({selectedArticle.comments.filter(c => c.status === "approved").length} комментариев)
                  </span>
                </h3>
                {selectedArticle.comments.filter(c => c.status === "approved").length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Комментариев пока нет. Будьте первым!</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {selectedArticle.comments.filter(c => c.status === "approved").map(comment => (
                      <div key={comment.id} className="bg-muted/40 rounded-lg p-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="text-sm text-foreground/80">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-muted/30 rounded-xl p-5 border border-border">
                  <p className="text-sm font-semibold mb-1">Оставить комментарий</p>
                  <p className="text-xs text-muted-foreground mb-4">Комментарий появится после проверки модератором.</p>
                  <Input
                    placeholder="Ваше имя или позывной"
                    value={commentAuthor}
                    onChange={e => setCommentAuthor(e.target.value)}
                    className="mb-2 text-sm"
                  />
                  <Textarea
                    placeholder="Ваш комментарий..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="mb-3 text-sm resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={() => handleAddComment(selectedArticle.id)}
                    disabled={!commentText || !commentAuthor}
                    className="bg-gov-navy text-gov-gold hover:bg-gov-navy/90 font-bold"
                  >
                    <Icon name="Send" size={14} className="mr-2" />
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== CHANNELS ===== */}
        {section === "channels" && !selectedChannel && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gov-gold rounded-full" />
              <h2 className="text-2xl font-black">Телеканалы ГТРК</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CHANNELS.map((ch, i) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
                  className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={`${ch.color} p-6 text-white`}>
                    <Icon name={ch.icon} size={32} className="mb-2 opacity-90" />
                    <h3 className="font-black text-lg leading-tight">{ch.name}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{ch.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <span className="flex items-center gap-1"><Icon name="FileText" size={11} />{ch.posts} публикаций</span>
                      <span className="flex items-center gap-1"><Icon name="Users" size={11} />{ch.subscribers.toLocaleString()} подп.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "channels" && selectedChannel && (
          <div className="animate-fade-in">
            <button
              onClick={() => setSelectedChannel(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium"
            >
              <Icon name="ArrowLeft" size={16} /> Все каналы
            </button>
            <div className={`${selectedChannel.color} rounded-xl p-8 text-white mb-6 shadow-xl`}>
              <Icon name={selectedChannel.icon} size={40} className="mb-3 opacity-90" />
              <h2 className="text-3xl font-black mb-1">{selectedChannel.name}</h2>
              <p className="text-white/70 mb-4">{selectedChannel.description}</p>
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-2"><Icon name="FileText" size={14} />{selectedChannel.posts} публикаций</span>
                <span className="flex items-center gap-2"><Icon name="Users" size={14} />{selectedChannel.subscribers.toLocaleString()} подписчиков</span>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-4">Публикации канала</h3>
            {publishedArticles.filter(a => a.channel === selectedChannel.name).length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Публикаций пока нет.</p>
            ) : (
              <div className="space-y-3">
                {publishedArticles.filter(a => a.channel === selectedChannel.name).map(article => (
                  <article
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-gov-gold/40 transition-all duration-200"
                  >
                    <h4 className="font-bold mb-1.5">{article.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{article.date}</span>
                      <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{article.views.toLocaleString()}</span>
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
            {proposalSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center animate-scale-in">
                <Icon name="CheckCircle2" size={52} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="font-black text-xl mb-2">Отправлено на рассмотрение</h3>
                <p className="text-sm text-muted-foreground mb-6">Редакция ГТРК ОГФ рассмотрит материал и примет решение о публикации.</p>
                <Button onClick={() => setProposalSent(false)} variant="outline">
                  <Icon name="Plus" size={14} className="mr-2" />
                  Предложить ещё
                </Button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="bg-gov-navy/5 border border-gov-navy/20 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
                  <Icon name="Info" size={16} className="text-gov-navy mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Граждане ОГФ могут предлагать материалы для публикации. После проверки редакцией одобренные материалы появятся в ленте.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Заголовок *</label>
                    <Input placeholder="Краткий и ёмкий заголовок" value={proposalTitle} onChange={e => setProposalTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Канал *</label>
                    <select
                      value={proposalChannel}
                      onChange={e => setProposalChannel(e.target.value)}
                      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Выберите канал...</option>
                      {CHANNELS.map(ch => (
                        <option key={ch.id} value={ch.name}>{ch.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Текст публикации *</label>
                    <Textarea
                      placeholder="Подробное описание события, факты, источники..."
                      value={proposalText}
                      onChange={e => setProposalText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleSendProposal}
                    disabled={!proposalTitle || !proposalText || !proposalChannel}
                    className="w-full bg-gov-navy text-gov-gold hover:bg-gov-navy/90 font-bold h-11"
                  >
                    <Icon name="Send" size={16} className="mr-2" />
                    Отправить на рассмотрение
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
                Объединённая Гражданская Федерация — демократическое государство в мире Wild Politics, основанное на принципах гражданского единства, верховенства закона и прозрачного управления. ГТРК является главным информационным органом федерации.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { icon: "Radio", title: "ГТРК ОГФ", desc: "Государственное телерадиовещание обеспечивает граждан достоверной информацией о жизни федерации." },
                { icon: "Shield", title: "Миссия", desc: "Информирование, просвещение и объединение граждан через качественный контент и открытый диалог." },
                { icon: "Globe", title: "Охват", desc: "Портал охватывает все регионы ОГФ и поддерживает связь между гражданами федерации." },
                { icon: "Scale", title: "Принципы", desc: "Достоверность, беспристрастность, прозрачность и служение интересам граждан федерации." },
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
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="Radio" size={18} />
                Каналы вещания
              </h3>
              <div className="space-y-2.5">
                {CHANNELS.map(ch => (
                  <div key={ch.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ch.color}`} />
                    <span className="font-medium text-sm">{ch.name}</span>
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
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 bg-gov-gold rounded-full" />
              <h2 className="text-2xl font-black">Панель модерации</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-4 flex items-center gap-1.5">
              <Icon name="Lock" size={13} />
              Только для администраторов ГТРК ОГФ
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Опубликовано", value: publishedArticles.length, icon: "CheckCircle2", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                { label: "На рассмотрении", value: pendingArticles.length, icon: "Clock", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                { label: "Всего каналов", value: CHANNELS.length, icon: "Radio", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                { label: "Комментарии ждут", value: pendingComments, icon: "MessageSquare", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} border rounded-xl p-4 animate-fade-in`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <Icon name={stat.icon} size={20} className={`${stat.color} mb-2`} />
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <Separator className="mb-8" />

            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Icon name="Clock" size={18} className="text-amber-500" />
              Публикации на рассмотрении
            </h3>
            {pendingArticles.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center mb-8 flex flex-col items-center">
                <Icon name="CheckCircle2" size={36} className="text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-emerald-700">Нет публикаций на рассмотрении</p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {pendingArticles.map(article => (
                  <div key={article.id} className="bg-card border border-amber-200 rounded-xl p-5 animate-fade-in">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{article.channel}</Badge>
                          <Badge className="bg-amber-100 text-amber-800 text-xs border border-amber-200">Ожидает</Badge>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{article.title}</h4>
                        <p className="text-xs text-muted-foreground mb-1">{article.excerpt}</p>
                        <p className="text-xs text-muted-foreground">Автор: <span className="font-medium">{article.author}</span></p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => handleApprove(article.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                          <Icon name="Check" size={14} className="mr-1" />Одобрить
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(article.id)} className="border-red-300 text-red-600 hover:bg-red-50">
                          <Icon name="X" size={14} className="mr-1" />Отклонить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator className="mb-8" />

            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Icon name="MessageSquare" size={18} className="text-purple-500" />
              Комментарии на проверке
            </h3>
            {pendingComments === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center flex flex-col items-center">
                <Icon name="CheckCircle2" size={36} className="text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-emerald-700">Нет комментариев на проверке</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.flatMap(a =>
                  a.comments
                    .filter(c => c.status === "pending")
                    .map(c => (
                      <div key={c.id} className="bg-card border border-purple-200 rounded-xl p-4 animate-fade-in">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">К материалу: <span className="font-medium">{a.title.slice(0, 55)}…</span></p>
                            <p className="font-semibold text-sm">{c.author}</p>
                            <p className="text-sm text-foreground/80 mt-0.5">{c.text}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" onClick={() => approveComment(a.id, c.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              <Icon name="Check" size={14} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => rejectComment(a.id, c.id)} className="border-red-300 text-red-600 hover:bg-red-50">
                              <Icon name="X" size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
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
                {CHANNELS.slice(0, 4).map(ch => (
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
    </div>
  );
}