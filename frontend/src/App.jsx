import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AuthScreen from "./components/AuthScreen.jsx";
import ExpenseForm from "./components/ExpenseForm.jsx";
import ImportView from "./components/ImportView.jsx";
import { Icon } from "./components/Icons.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Travel",
  "Other",
];
const CHART_COLORS = [
  "#39c994",
  "#7c83fd",
  "#ff9d67",
  "#f47f91",
  "#edc66a",
  "#55bfd0",
  "#b085e8",
  "#80909e",
];
const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const shortDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function getErrorMessage(data, fallback) {
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => item.msg).filter(Boolean).join(", ");
  }
  if (typeof data?.message === "string") return data.message;
  return fallback;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem("access_token")));
  const [authMode, setAuthMode] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(Boolean(localStorage.getItem("access_token")));
  const [expenseModal, setExpenseModal] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const requestHeaders = new Headers(options.headers || {});
      if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
      if (options.body && !(options.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: requestHeaders,
      });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : null;

      if (response.status === 401 && path !== "/login") {
        localStorage.removeItem("access_token");
        setToken(null);
        setExpenses([]);
      }
      if (!response.ok) {
        throw new Error(getErrorMessage(data, `Request failed (${response.status})`));
      }
      return data;
    },
    [token],
  );

  const loadExpenses = useCallback(async () => {
    try {
      const data = await apiRequest("/expenses");
      setExpenses(Array.isArray(data) ? data : []);
    } finally {
      setLoadingExpenses(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    let active = true;
    if (!token) {
      return () => {
        active = false;
      };
    }

    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (!response.ok) throw new Error("Session expired");
      })
      .then(() => active && setAuthLoading(false))
      .catch(() => {
        if (active) {
          localStorage.removeItem("access_token");
          setToken(null);
          setAuthLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || authLoading) return;
    loadExpenses().catch((error) => toast.error(error.message || "Could not load expenses."));
  }, [authLoading, loadExpenses, token]);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === "All categories" || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, expenses, search]);
  const availableCategories = useMemo(
    () => [...new Set([...CATEGORIES, ...expenses.map((expense) => expense.category).filter(Boolean)])],
    [expenses],
  );

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalsByCategory = expenses.reduce((totals, expense) => {
      const category = expense.category || "Uncategorized";
      totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
      return totals;
    }, {});
    const topCategory = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0];
    const categoryData = Object.entries(totalsByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const trendsByDate = expenses.reduce((trends, expense) => {
      const date = expense.transaction_date;
      trends[date] = (trends[date] || 0) + Number(expense.amount || 0);
      return trends;
    }, {});
    const trendData = Object.entries(trendsByDate)
      .sort(([first], [second]) => first.localeCompare(second))
      .slice(-14)
      .map(([date, amount]) => ({
        date,
        label: shortDate.format(new Date(`${date}T00:00:00`)),
        amount,
      }));

    return {
      total,
      topCategory: topCategory?.[0] || "—",
      topCategoryAmount: topCategory?.[1] || 0,
      categoryData,
      trendData,
    };
  }, [expenses]);

  async function handleLogin({ email, password }) {
    const body = new URLSearchParams({ username: email, password });
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(data, "Unable to sign in."));
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("account_email", email);
    setToken(data.access_token);
    setAuthLoading(true);
    setActivePage("dashboard");
    toast.success("Welcome back to SmartSpend.");
  }

  async function handleRegister({ name, email, password }) {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(data, "Unable to create your account."));
    toast.success("Account created. Sign in to get started.");
    setAuthMode("login");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("account_email");
    setToken(null);
    setExpenses([]);
    setActivePage("dashboard");
    setAuthMode("login");
    toast.success("You have been signed out.");
  }

  async function saveExpense(values) {
    const isEditing = Boolean(expenseModal?.id);
    const path = isEditing ? `/expenses/${expenseModal.id}` : "/expenses";
    await apiRequest(path, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(values),
    });
    try {
      await loadExpenses();
    } catch (error) {
      toast.error(`Saved, but the transaction list could not refresh: ${error.message}`);
    }
    setExpenseModal(null);
    toast.success(isEditing ? "Expense updated." : "Expense added.");
  }

  async function deleteExpense(expense) {
    if (!window.confirm(`Delete "${expense.description}"? This can't be undone.`)) return;
    try {
      await apiRequest(`/expenses/${expense.id}`, { method: "DELETE" });
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      toast.success("Expense deleted.");
    } catch (error) {
      toast.error(error.message || "Could not delete this expense.");
    }
  }

  async function importCsv(file) {
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await apiRequest("/expenses/import", { method: "POST", body });
      try {
        await loadExpenses();
      } catch (error) {
        toast.error(`Import completed, but the transaction list could not refresh: ${error.message}`);
      }
      toast.success(`${result.imported} imported · ${result.rejected} rejected`);
      return result;
    } catch (error) {
      toast.error(error.message || "CSV import failed.");
      throw error;
    }
  }

  function navigate(page) {
    setActivePage(page);
    setMobileNavOpen(false);
  }

  if (!token) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <AuthScreen
          mode={authMode}
          onModeChange={setAuthMode}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </>
    );
  }

  if (authLoading) {
    return (
      <div className="boot-screen">
        <div className="brand-mark"><Icon name="spark" /></div>
        <span>Preparing your workspace…</span>
      </div>
    );
  }

  const pageTitles = {
    dashboard: ["Overview", "Your personal finance at a glance."],
    expenses: ["Transactions", "Every purchase, organized in one place."],
    import: ["Import transactions", "Bring your recent spending into SmartSpend."],
    profile: ["Your profile", "Manage your SmartSpend workspace."],
  };
  const [pageTitle, pageSubtitle] = pageTitles[activePage];

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      {mobileNavOpen && <button className="nav-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><Icon name="spark" /></div>
          {!sidebarCollapsed && <span>smart<span className="brand-accent">spend</span></span>}
          <button className="icon-button sidebar-collapse" onClick={() => setSidebarCollapsed((value) => !value)} aria-label="Collapse sidebar">
            <Icon name="panel" />
          </button>
        </div>

        <div className="workspace-label">{!sidebarCollapsed && "WORKSPACE"}</div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavItem icon="grid" label="Dashboard" active={activePage === "dashboard"} collapsed={sidebarCollapsed} onClick={() => navigate("dashboard")} />
          <NavItem icon="receipt" label="Expenses" active={activePage === "expenses"} collapsed={sidebarCollapsed} onClick={() => navigate("expenses")} badge={expenses.length || null} />
          <NavItem icon="upload" label="CSV import" active={activePage === "import"} collapsed={sidebarCollapsed} onClick={() => navigate("import")} />
        </nav>
        <div className="sidebar-spacer" />
        <div className="nav-divider" />
        <NavItem icon="user" label="Profile" active={activePage === "profile"} collapsed={sidebarCollapsed} onClick={() => navigate("profile")} />
        <button className="nav-item logout-link" onClick={handleLogout} title={sidebarCollapsed ? "Log out" : undefined}>
          <Icon name="logout" /><span>{!sidebarCollapsed && "Log out"}</span>
        </button>
        {!sidebarCollapsed && (
          <div className="sidebar-footer">
            <span className="online-dot" /> All systems operational
          </div>
        )}
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
            <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" /><strong>{pageTitle}</strong></div>
          </div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span>
            <button className="avatar-button" onClick={() => navigate("profile")} aria-label="Open profile">S</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">{activePage === "dashboard" ? "YOUR FINANCIAL SNAPSHOT" : "SMARTSPEND WORKSPACE"}</p><h1>{pageTitle}</h1><p className="page-subtitle">{pageSubtitle}</p></div>
            {activePage !== "profile" && (
              <button className="button button-primary" onClick={() => setExpenseModal({})}>
                <Icon name="plus" /> Add expense
              </button>
            )}
          </div>

          {activePage === "dashboard" && (
            <Dashboard
              expenses={expenses}
              loading={loadingExpenses}
              metrics={metrics}
              onViewAll={() => navigate("expenses")}
              onAdd={() => setExpenseModal({})}
            />
          )}
          {activePage === "expenses" && (
            <ExpensesView
              expenses={filteredExpenses}
              allExpenses={expenses}
              loading={loadingExpenses}
              search={search}
              categoryFilter={categoryFilter}
              categories={availableCategories}
              onSearch={setSearch}
              onCategoryFilter={setCategoryFilter}
              onAdd={() => setExpenseModal({})}
              onEdit={(expense) => setExpenseModal(expense)}
              onDelete={deleteExpense}
            />
          )}
          {activePage === "import" && <ImportView onImport={importCsv} />}
          {activePage === "profile" && <ProfileView onLogout={handleLogout} />}
        </div>
      </main>

      {expenseModal && (
        <ExpenseForm
          expense={expenseModal}
          categories={CATEGORIES}
          onClose={() => setExpenseModal(null)}
          onSave={saveExpense}
        />
      )}
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </div>
  );
}

function NavItem({ icon, label, active, collapsed, onClick, badge }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick} title={collapsed ? label : undefined}>
      <Icon name={icon} />
      {!collapsed && <><span>{label}</span>{badge != null && <span className="nav-badge">{badge}</span>}</>}
    </button>
  );
}

function Dashboard({ expenses, loading, metrics, onViewAll, onAdd }) {
  const recent = [...expenses]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 5);

  return (
    <>
      <section className="metric-grid">
        <MetricCard icon="wallet" label="Total spending" value={currency.format(metrics.total)} footnote="Across all transactions" tone="green" />
        <MetricCard icon="receipt" label="Transactions" value={expenses.length.toLocaleString()} footnote="Recorded expenses" tone="blue" />
        <MetricCard icon="tag" label="Top category" value={metrics.topCategory} footnote={metrics.topCategoryAmount ? `${currency.format(metrics.topCategoryAmount)} spent` : "No category data yet"} tone="violet" />
      </section>

      <section className="chart-grid">
        <div className="panel trend-panel">
          <div className="panel-heading"><div><h2>Spending trends</h2><p>Your daily spending over time</p></div><span className="panel-kicker">LAST 14 ACTIVE DAYS</span></div>
          <div className="chart-wrap trend-chart">
            {metrics.trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trendData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                  <defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39c994" stopOpacity={0.25} /><stop offset="95%" stopColor="#39c994" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="#242b33" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#828d98", fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#828d98", fontSize: 11 }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#39c994" strokeWidth={2.5} fill="url(#spendFill)" activeDot={{ r: 5, fill: "#39c994", stroke: "#14221e", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart icon="activity" title="No spending to chart" text="Add a few transactions and your trends will show up here." />}
          </div>
        </div>

        <div className="panel category-panel">
          <div className="panel-heading"><div><h2>By category</h2><p>Where your money goes</p></div><button className="text-button" onClick={onViewAll}>Details <Icon name="arrow" /></button></div>
          <div className="category-chart">
            {metrics.categoryData.length ? (
              <>
                <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.categoryData} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={4} stroke="none">{metrics.categoryData.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{currency.format(metrics.total)}</strong><span>total spend</span></div></div>
                <div className="legend-list">{metrics.categoryData.slice(0, 5).map((item, index) => <div className="legend-row" key={item.name}><span className="legend-name"><i style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />{item.name}</span><strong>{currency.format(item.value)}</strong></div>)}</div>
              </>
            ) : <EmptyChart icon="pie" title="Nothing to break down yet" text="Your category insights will appear when you add expenses." />}
          </div>
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><h2>Recent transactions</h2><p>Your latest activity at a glance</p></div><button className="text-button" onClick={onViewAll}>View all <Icon name="arrow" /></button></div>
        {loading ? <LoadingRows /> : recent.length ? <TransactionTable expenses={recent} onEdit={null} onDelete={null} compact /> : <div className="empty-transactions"><div className="empty-icon"><Icon name="receipt" /></div><h3>Your spending story starts here</h3><p>Add an expense or import your transactions to see your financial picture.</p><button className="button button-primary" onClick={onAdd}><Icon name="plus" /> Add your first expense</button></div>}
      </section>
    </>
  );
}

function MetricCard({ icon, label, value, footnote, tone }) {
  return (
    <div className="metric-card">
      <div className="metric-card-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon name={icon} /></div></div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-footnote">{footnote}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{label || payload[0].name}</span><strong>{currency.format(payload[0].value)}</strong></div>;
}

function EmptyChart({ icon, title, text }) {
  return <div className="empty-chart"><div className="empty-icon"><Icon name={icon} /></div><strong>{title}</strong><span>{text}</span></div>;
}

function ExpensesView({ expenses, allExpenses, loading, search, categoryFilter, categories, onSearch, onCategoryFilter, onAdd, onEdit, onDelete }) {
  return (
    <section className="panel transactions-panel">
      <div className="table-toolbar">
        <div><h2>All transactions <span className="result-count">{allExpenses.length}</span></h2><p>Search, filter, and manage your expenses.</p></div>
        <button className="button button-primary" onClick={onAdd}><Icon name="plus" /> Add expense</button>
      </div>
      <div className="filter-row">
        <label className="search-field"><Icon name="search" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search descriptions…" aria-label="Search descriptions" />{search && <button className="clear-search" onClick={() => onSearch("")} aria-label="Clear search">×</button>}</label>
        <label className="select-field"><Icon name="filter" /><select value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)} aria-label="Filter by category"><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}<option>Uncategorized</option></select><Icon name="chevron" /></label>
      </div>
      {loading ? <LoadingRows /> : expenses.length ? <TransactionTable expenses={expenses} onEdit={onEdit} onDelete={onDelete} /> : <div className="empty-transactions"><div className="empty-icon"><Icon name="search" /></div><h3>{allExpenses.length ? "No matching transactions" : "No transactions yet"}</h3><p>{allExpenses.length ? "Try a different search or category filter." : "Add an expense to start keeping track of your spending."}</p>{!allExpenses.length && <button className="button button-primary" onClick={onAdd}><Icon name="plus" /> Add expense</button>}</div>}
      <div className="table-footer"><span>Showing {expenses.length} of {allExpenses.length} transactions</span><span className="secure-label"><Icon name="shield" /> Your data is private</span></div>
    </section>
  );
}

function TransactionTable({ expenses, onEdit, onDelete, compact = false }) {
  return (
    <div className={`table-scroll ${compact ? "compact-table" : ""}`}>
      <table className="transaction-table">
        <thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>CONFIDENCE</th><th className="amount-heading">AMOUNT</th>{onEdit && <th aria-label="Actions" />}</tr></thead>
        <tbody>{expenses.map((expense) => <tr key={expense.id}>
          <td><div className="transaction-name"><div className={`transaction-icon ${categoryTone(expense.category)}`}><Icon name={categoryIcon(expense.category)} /></div><div><strong>{expense.description}</strong><span>Expense · #{expense.id}</span></div></div></td>
          <td><span className={`category-pill ${categoryTone(expense.category)}`}>{expense.category || "Uncategorized"}</span></td>
          <td className="date-cell">{shortDate.format(new Date(`${expense.transaction_date}T00:00:00`))}, {new Date(`${expense.transaction_date}T00:00:00`).getFullYear()}</td>
          <td><ConfidenceBadge expense={expense} /></td>
          <td className="amount-cell">−{currency.format(Number(expense.amount))}</td>
          {onEdit && <td><div className="row-actions"><button className="icon-button" onClick={() => onEdit(expense)} title="Edit expense" aria-label={`Edit ${expense.description}`}><Icon name="edit" /></button><button className="icon-button danger-hover" onClick={() => onDelete(expense)} title="Delete expense" aria-label={`Delete ${expense.description}`}><Icon name="trash" /></button></div></td>}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function ConfidenceBadge({ expense }) {
  if (expense.category_confidence == null) return <span className="confidence-badge muted">—</span>;
  const confidence = Math.round(Number(expense.category_confidence) * 100);
  const label = expense.categorization_method === "user" ? "Manual" : `${confidence}%`;
  return <span className={`confidence-badge ${confidence >= 75 ? "high" : confidence >= 45 ? "medium" : "low"}`} title={`Categorized by ${expense.categorization_method || "SmartSpend"} with ${confidence}% confidence`}><i />{label}</span>;
}

function categoryTone(category = "") {
  const normalized = category.toLowerCase();
  if (normalized.includes("food")) return "tone-green";
  if (normalized.includes("transport") || normalized.includes("travel")) return "tone-blue";
  if (normalized.includes("shop")) return "tone-violet";
  if (normalized.includes("entertain")) return "tone-pink";
  if (normalized.includes("bill")) return "tone-amber";
  return "tone-neutral";
}

function categoryIcon(category = "") {
  const normalized = category.toLowerCase();
  if (normalized.includes("food")) return "utensils";
  if (normalized.includes("transport") || normalized.includes("travel")) return "car";
  if (normalized.includes("shop")) return "bag";
  if (normalized.includes("entertain")) return "play";
  if (normalized.includes("bill")) return "bolt";
  return "receipt";
}

function LoadingRows() {
  return <div className="loading-rows"><span /><span /><span /><span /></div>;
}

function ProfileView({ onLogout }) {
  const email = localStorage.getItem("account_email") || "Signed in with your SmartSpend account";
  return (
    <div className="profile-layout">
      <section className="panel profile-card">
        <div className="profile-hero"><div className="profile-avatar">S</div><div><h2>SmartSpend member</h2><p>Your personal finance workspace</p></div></div>
        <div className="profile-details"><div><span>ACCOUNT</span><strong>{email}</strong></div><div><span>SECURITY</span><strong><i className="online-dot" /> JWT protected session</strong></div></div>
        <button className="button button-danger-outline" onClick={onLogout}><Icon name="logout" /> Log out of SmartSpend</button>
      </section>
      <section className="panel privacy-card"><div className="privacy-icon"><Icon name="shield" /></div><h3>Your finances stay yours.</h3><p>Your transactions are protected by authenticated requests and can only be accessed by your account.</p></section>
    </div>
  );
}

export default App;
