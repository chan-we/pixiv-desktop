import httpClient from '../httpClient';
import type {
  SearchIllustResponse,
  IllustDetail,
  RankingIllustResponse,
  SearchSuggestionResponse,
  UserDetailResponse,
} from '@/types';

export const pixivApi = {
  // 搜索插画/漫画
  searchIllust: async (
    keyword: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'date' | 'popular';
      searchTarget?: 'partial_match_for_tags' | 'exact_match_for_tags' | 'title_and_caption';
    } = {}
  ) => {
    const params = new URLSearchParams({
      word: keyword,
      search_ai_type: '0',
      filter: 'for_ios',
      include_translated_tag_names: 'true',
    });

    if (options.page) params.append('offset', String((options.page - 1) * (options.limit || 30)));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.sort) params.append('sort', options.sort);
    if (options.searchTarget) params.append('search_target', options.searchTarget);

    const response = await httpClient.get<SearchIllustResponse>(
      `/v1/search/illust?${params.toString()}`
    );
    return response.data;
  },

  // 热门预览搜索
  popularPreviewIllust: async (keyword: string) => {
    const response = await httpClient.get<SearchIllustResponse>(
      `/v1/search/popular-preview/illust?word=${encodeURIComponent(
        keyword
      )}&search_ai_type=0&filter=for_ios&include_translated_tag_names=true`
    );
    return response.data;
  },

  // 获取插画详情
  getIllustDetail: async (illustId: number) => {
    const response = await httpClient.get<IllustDetail>(
      `/v1/illust/detail?illust_id=${illustId}`
    );
    return response.data;
  },

  // 获取排行榜
  getIllustRanking: async (
    mode: 'day' | 'week' | 'month' | 'day_male' | 'day_female' | 'week_original' | 'week_rookie' | 'day_r18' = 'day',
    date?: string,
    page = 1
  ) => {
    let url = `/v1/illust/ranking?mode=${mode}&filter=for_ios&include_translated_tag_names=true`;
    if (date) url += `&date=${date}`;
    if (page > 1) url += `&offset=${(page - 1) * 30}`;

    const response = await httpClient.get<RankingIllustResponse>(url);
    return response.data;
  },

  // 获取搜索建议
  getSearchSuggestions: async (keyword: string) => {
    const response = await httpClient.get<SearchSuggestionResponse>(
      `/v2/search/autocomplete?word=${encodeURIComponent(keyword)}`
    );
    return response.data;
  },

  // 获取用户详情
  getUserDetail: async (userId: number) => {
    const response = await httpClient.get<UserDetailResponse>(
      `/v1/user/detail?user_id=${userId}`
    );
    return response.data;
  },

  // 获取用户作品
  getUserIllusts: async (userId: number, type: 'illust' | 'manga' = 'illust', page = 1) => {
    const response = await httpClient.get<SearchIllustResponse>(
      `/v1/user/illusts?user_id=${userId}&type=${type}&filter=for_ios&offset=${
        (page - 1) * 30
      }`
    );
    return response.data;
  },

  // 获取关注用户的作品
  getFollowingIllusts: async (page = 1) => {
    const response = await httpClient.get<SearchIllustResponse>(
      `/v1/illust/follow?restrict=public&offset=${(page - 1) * 30}`
    );
    return response.data;
  },

  // 获取推荐作品
  getRecommendedIllusts: async (page = 1) => {
    const response = await httpClient.get<SearchIllustResponse>(
      `/v1/illust/recommended?filter=for_ios&include_translated_tag_names=true&offset=${
        (page - 1) * 30
      }`
    );
    return response.data;
  },

  // 收藏作品
  addBookmark: async (illustId: number, tags: string[] = []) => {
    const response = await httpClient.post('/v2/illust/bookmark/add', {
      illust_id: illustId,
      restrict: 'public',
      tags,
    });
    return response.data;
  },

  // 取消收藏
  deleteBookmark: async (illustId: number) => {
    const response = await httpClient.delete(`/v1/illust/bookmark/delete`, {
      data: { illust_id: illustId },
    });
    return response.data;
  },
};
