import { InquiryBoard } from '@/components/admin/InquiryBoard';
import { listInquiries } from '@/server/inquiries';

export default async function InquiriesPage() {
  const inquiries = await listInquiries().catch(() => []);
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>inquiries</h1>
          <p>everything from the book a shoot form. move each one along as you reply and book it.</p>
        </div>
      </div>
      <InquiryBoard initial={inquiries} />
    </>
  );
}
