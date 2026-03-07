// Pixiv API 类型定义

export interface User {
  id: number;
  name: string;
  account: string;
  profile_image_urls: {
    medium: string;
  };
  is_followed: boolean;
}

export interface Illust {
  id: number;
  title: string;
  type: 'illust' | 'manga' | 'ugoira';
  image_urls: {
    square_medium: string;
    medium: string;
    large: string;
    original?: string;
  };
  caption: string;
  restrict: number;
  user: User;
  tags: {
    name: string;
    translated_name?: string;
  }[];
  tools: string[];
  create_date: string;
  page_count: number;
  width: number;
  height: number;
  sanity_level: string;
  series?: {
    id: number;
    title: string;
  };
  meta_single_page: {
    original_image_url?: string;
  };
  meta_pages: {
    image_urls: {
      square_medium: string;
      medium: string;
      large: string;
      original?: string;
    };
  }[];
  total_view: number;
  total_bookmarks: number;
  is_bookmarked: boolean;
  is_muted: boolean;
}

export interface IllustDetail extends Illust {
  bookmark_count: number;
  like_count: number;
  comment_count: number;
  response_count: number;
}

export interface SearchIllustResponse {
  illusts: Illust[];
  next_url?: string;
  search_span_limit?: number;
  related_tag?: object;
}

export interface SearchSuggestionResponse {
  candidates: {
    tag_name: string;
    tag_type?: string;
    transition?: string;
  }[];
}

export interface RankingIllustResponse {
  illusts: Illust[];
  next_url?: string;
}

export interface UserDetailResponse {
  user: User;
  profile: {
    webpage: string;
    gender: string;
    birth: {
      year: number | null;
      month: number | null;
      day: number | null;
    };
    country: string;
    job: string;
    total_follow_users: number;
    total_mypixiv_users: number;
    total_illusts: number;
    total_manga: number;
    total_novels: number;
   illust_series_count: number;
    novel_series_count: number;
    follow_user: number;
    mypixiv_user: number;
  };
  profile_publicity: {
    gender: string;
    birth_day: string;
    birth_year: string;
    region: string;
    job: string;
  };
  workspace: object;
}

export interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  user: User;
}

export interface AuthCodeResponse {
  code: string;
  code_verifier: string;
}
