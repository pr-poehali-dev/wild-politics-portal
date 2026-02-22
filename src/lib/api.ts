const URLS = {
  auth: "https://functions.poehali.dev/acf12fae-23be-4bb1-bcf5-0dac699f1c7d",
  channels: "https://functions.poehali.dev/2fa73de9-b1e0-4a4b-a148-1628763fe2b0",
  articles: "https://functions.poehali.dev/e21ca522-93d1-496b-825b-403e85f2af94",
  comments: "https://functions.poehali.dev/a983d0e1-4729-46b6-b965-78b1be8e970e",
};

export interface User {
  user_id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  is_admin: boolean;
}

export interface Channel {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_verified: boolean;
  verification_type: string | null;
  verification_label: string | null;
  posts: number;
  subscribers: number;
  created_by: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  channel_id: number;
  channel_name: string;
  channel_color: string;
  channel_icon: string;
  channel_verified: boolean;
  channel_verification_type: string | null;
  author_id: number;
  author_name: string;
  status: string;
  views: number;
  is_breaking: boolean;
  created_at: string;
  comment_count: number;
}

export interface Comment {
  id: number;
  article_id: number;
  text: string;
  status: string;
  created_at: string;
  author_name: string;
  author_id: number;
}

function headers(userId?: number) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) h["X-User-Id"] = String(userId);
  return h;
}

// AUTH
export const authApi = {
  telegram: (data: Record<string, string | number>) =>
    fetch(`${URLS.auth}/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => r.json() as Promise<User>),

  requestAdminCode: (telegramId: number) =>
    fetch(`${URLS.auth}/request-admin-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId }),
    }).then(r => r.json()),

  verifyAdminCode: (telegramId: number, code: string, userId: number) =>
    fetch(`${URLS.auth}/verify-admin-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: telegramId, code, user_id: userId }),
    }).then(r => r.json()),
};

// CHANNELS
export const channelsApi = {
  list: (): Promise<Channel[]> =>
    fetch(URLS.channels).then(r => r.json()),

  create: (userId: number, data: { name: string; description: string; icon: string; color: string }) =>
    fetch(`${URLS.channels}/create`, {
      method: "POST",
      headers: headers(userId),
      body: JSON.stringify(data),
    }).then(r => r.json()),

  verify: (userId: number, channelId: number, verificationType: string | null, isVerified: boolean) =>
    fetch(`${URLS.channels}/verify`, {
      method: "PUT",
      headers: headers(userId),
      body: JSON.stringify({ channel_id: channelId, verification_type: verificationType, is_verified: isVerified }),
    }).then(r => r.json()),
};

// ARTICLES
export const articlesApi = {
  list: (status = "published", channelId?: number): Promise<Article[]> => {
    let url = `${URLS.articles}/articles?status=${status}`;
    if (channelId) url += `&channel_id=${channelId}`;
    return fetch(url).then(r => r.json());
  },

  get: (id: number): Promise<Article> =>
    fetch(`${URLS.articles}/${id}`).then(r => r.json()),

  create: (userId: number, data: { title: string; content: string; channel_id: number }) =>
    fetch(`${URLS.articles}/articles`, {
      method: "POST",
      headers: headers(userId),
      body: JSON.stringify(data),
    }).then(r => r.json()),

  moderate: (userId: number, articleId: number, action: "approve" | "reject", isBreaking = false) =>
    fetch(`${URLS.articles}/${articleId}/moderate`, {
      method: "PUT",
      headers: headers(userId),
      body: JSON.stringify({ action, is_breaking: isBreaking }),
    }).then(r => r.json()),
};

// COMMENTS
export const commentsApi = {
  list: (articleId: number): Promise<Comment[]> =>
    fetch(`${URLS.comments}?article_id=${articleId}`).then(r => r.json()),

  listPending: (): Promise<Comment[]> =>
    fetch(`${URLS.comments}?status=pending`).then(r => r.json()),

  add: (userId: number, articleId: number, text: string) =>
    fetch(URLS.comments, {
      method: "POST",
      headers: headers(userId),
      body: JSON.stringify({ article_id: articleId, text }),
    }).then(r => r.json()),

  moderate: (userId: number, commentId: number, action: "approve" | "reject") =>
    fetch(`${URLS.comments}/moderate`, {
      method: "PUT",
      headers: headers(userId),
      body: JSON.stringify({ comment_id: commentId, action }),
    }).then(r => r.json()),
};
