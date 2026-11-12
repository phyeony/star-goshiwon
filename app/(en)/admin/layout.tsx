import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 print:bg-white">
      {/* Hidden when printing so the document print route comes out chrome-free. */}
      <div className="print:hidden">
        <AdminNav />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-[15px] sm:py-10 sm:text-base [&_button]:text-[15px] [&_input]:text-[15px] [&_select]:text-[15px] [&_textarea]:text-[15px] print:max-w-none print:p-0">
        {children}
      </div>
    </div>
  );
}
