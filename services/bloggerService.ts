import { BLOGGER_API } from '@/constants/api';
import { googleFetch, readError } from './http';
import type { BlogInfo } from '@/types';
import { IS_MOCK } from '@/constants/config';
import { MOCK_BLOG } from './mock/data';

export async function listBlogs(): Promise<BlogInfo[]> {
  if (IS_MOCK) return [MOCK_BLOG];
  // 글을 쓸 수 있는 블로그(관리자·작성자)만. 읽기 전용으로 초대된 블로그는 제외
  const res = await googleFetch(`${BLOGGER_API}/users/self/blogs?role=ADMIN&role=AUTHOR`);
  if (!res.ok) throw new Error(await readError(res));
  const j = await res.json();
  return (j.items ?? []).map((b: { id: string; name: string; url: string }) => ({
    id: b.id,
    name: b.name,
    url: b.url,
  }));
}

export async function createPost(
  blogId: string,
  params: { title: string; html: string; labels: string[]; isDraft: boolean }
): Promise<{ id: string; url: string }> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return { id: String(Date.now()), url: `${MOCK_BLOG.url}/mock-post` };
  }
  const res = await googleFetch(
    `${BLOGGER_API}/blogs/${blogId}/posts?isDraft=${params.isDraft}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'blogger#post',
        title: params.title,
        content: params.html,
        labels: params.labels,
      }),
    }
  );
  if (!res.ok) throw new Error(`발행 실패: ${await readError(res)}`);
  const j = await res.json();
  return { id: j.id, url: j.url };
}
