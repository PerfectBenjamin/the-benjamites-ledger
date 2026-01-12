import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CustomerForm from "@/components/customer-form";

export const metadata = {
  title: "Add New Customer - Debt Ledger",
  description: "Add a new customer to your debt ledger",
};

export default function NewCustomerPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-slate-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-3">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Customers</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2">
            Add New Customer
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-6 md:mb-8">
            Enter customer details to get started
          </p>
          <CustomerForm />
        </div>
      </div>
    </main>
  );
}
