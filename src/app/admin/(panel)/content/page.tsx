import { ContentEditor } from '@/components/admin/ContentEditor';
import { getContentForAdmin } from '@/server/content';
import { storageKind } from '@/server/media';

export default async function ContentPage() {
  const { content, connected } = await getContentForAdmin().catch(() => ({ content: null, connected: false }));
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>content</h1>
          <p>everything on the public site. changes go live the moment you save.</p>
        </div>
      </div>
      {content ? <ContentEditor initial={content} connected={connected} uploads={storageKind() !== null} /> : <p className="note">could not load the content.</p>}
    </>
  );
}
