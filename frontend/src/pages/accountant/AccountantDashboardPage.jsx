import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BarChart3, TrendingUp, DollarSign, Users, FileText } from "lucide-react";

const AccountantDashboardPage = () => {
  const { user } = useAuth();
  const financialStats = {
    totalRevenue: 45250,
    totalExpenses: 18500,
    netIncome: 26750,
    pendingPayments: 5420,
  };

  const quickLinks = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Invoices",
      description: "Manage invoices",
      link: "/accountant/invoices",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Payments",
      description: "Payment processing",
      link: "/accountant/payments",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Revenue Reports",
      description: "Financial analytics",
      link: "/accountant/revenue",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Salary Management",
      description: "Staff payments",
      link: "/accountant/salary",
      color: "bg-orange-50 text-orange-600",
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#E06666] to-[#D85555] rounded-lg shadow-md p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.full_name}! 💰</h1>
        <p className="text-white/90 text-lg">Financial overview and accounting management dashboard.</p>
        <div className="mt-4 flex gap-3 text-sm text-white/80">
          <span>📅 {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-text-main mt-2">{formatCurrency(financialStats.totalRevenue)}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-text-main mt-2">{formatCurrency(financialStats.totalExpenses)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Net Income</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(financialStats.netIncome)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-text-main mt-2">{formatCurrency(financialStats.pendingPayments)}</p>
            </div>
            <FileText className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-text-main mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.link}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-slate-700 hover:border-[#E06666]/30"
            >
              <div className={`w-12 h-12 rounded-lg ${link.color} flex items-center justify-center mb-4`}>
                {link.icon}
              </div>
              <h3 className="font-semibold text-text-main mb-1">{link.title}</h3>
              <p className="text-sm text-text-dim">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-text-main mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[
            { desc: "Invoice #2024-001", amount: "+$2,500.00", time: "Today, 10:30 AM" },
            { desc: "Payroll Payment", amount: "-$8,500.00", time: "Yesterday" },
            { desc: "Supplies Purchase", amount: "-$350.00", time: "2 days ago" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-750 rounded-lg">
              <div>
                <p className="font-medium text-text-main">{tx.desc}</p>
                <p className="text-xs text-text-dim">{tx.time}</p>
              </div>
              <p className={`font-semibold ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboardPage;
