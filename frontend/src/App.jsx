
import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // =========================
  // ADD EXPENSE
  // =========================

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [category, setCategory] = useState("");
  const [expenseMessage, setExpenseMessage] = useState("");
  const [expenseError, setExpenseError] = useState("");

  // =========================
  // EXPENSES
  // =========================

  const [expenses, setExpenses] = useState([]);
  const [expensesError, setExpensesError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // =========================
  // CSV IMPORT
  // =========================

  const [csvFile, setCsvFile] = useState(null);
  const [csvMessage, setCsvMessage] = useState("");
  const [csvError, setCsvError] = useState("");

  // =========================
  // EDIT EXPENSE
  // =========================

  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editError, setEditError] = useState("");

  // =========================
  // LOGIN
  // =========================

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);

      setLoggedIn(true);
      setShowLogin(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      setError("Unable to connect to SmartSpend server.");
    }
  }

  // =========================
  // LOGOUT
  // =========================

  function handleLogout() {
    localStorage.removeItem("access_token");

    setLoggedIn(false);
    setShowAddExpense(false);
    setShowExpenses(false);
    setEditingExpense(null);
  }

  // =========================
  // ADD EXPENSE
  // =========================

  async function handleAddExpense(e) {
    e.preventDefault();

    setExpenseMessage("");
    setExpenseError("");

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          description: description,
          transaction_date: transactionDate,
          category: category || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setExpenseError(data.detail || "Failed to add expense.");
        return;
      }

      setExpenseMessage(
        `Expense added successfully. Category: ${data.category}`
      );

      setAmount("");
      setDescription("");
      setTransactionDate("");
      setCategory("");
    } catch (error) {
      setExpenseError("Unable to connect to SmartSpend server.");
    }
  }

  // =========================
  // VIEW EXPENSES
  // =========================

  async function handleViewExpenses() {
    setExpensesError("");

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setExpensesError(data.detail || "Failed to load expenses.");
        return;
      }

      setExpenses(data);
      setShowExpenses(true);
    } catch (error) {
      setExpensesError("Unable to connect to SmartSpend server.");
    }
  }

  // =========================
  // START EDIT
  // =========================

  function startEditing(expense) {
    setEditingExpense(expense);
    setEditAmount(expense.amount);
    setEditDescription(expense.description);
    setEditTransactionDate(expense.transaction_date);
    setEditCategory(expense.category || "");
    setEditError("");
  }

  // =========================
  // UPDATE EXPENSE
  // =========================

  async function handleEditExpense(e) {
    e.preventDefault();

    setEditError("");

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        `${API_URL}/expenses/${editingExpense.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(editAmount),
            description: editDescription,
            transaction_date: editTransactionDate,
            category: editCategory || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setEditError(data.detail || "Failed to update expense.");
        return;
      }

      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === editingExpense.id ? data : expense
        )
      );

      setEditingExpense(null);
    } catch (error) {
      setEditError("Unable to connect to SmartSpend server.");
    }
  }

  // =========================
  // DELETE EXPENSE
  // =========================

  async function handleDeleteExpense(expenseId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        `${API_URL}/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setExpensesError(
          data.detail || "Failed to delete expense."
        );
        return;
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) => expense.id !== expenseId
        )
      );

      setExpensesError("");
    } catch (error) {
      setExpensesError("Unable to connect to SmartSpend server.");
    }
  }

  // =========================
  // CSV IMPORT
  // =========================

  async function handleCsvImport(e) {
    e.preventDefault();

    setCsvMessage("");
    setCsvError("");

    if (!csvFile) {
      setCsvError("Please select a CSV file.");
      return;
    }

    const token = localStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const response = await fetch(
        `${API_URL}/expenses/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCsvError(data.detail || "CSV import failed.");
        return;
      }

      setCsvMessage(
        `Import completed: ${data.imported} imported, ${data.rejected} rejected.`
      );

      setCsvFile(null);

      await handleViewExpensesAfterImport();
    } catch (error) {
      setCsvError("Unable to connect to SmartSpend server.");
    }
  }

  // =========================
  // REFRESH EXPENSES AFTER CSV
  // =========================

  async function handleViewExpensesAfterImport() {
    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setExpenses(data);
      }
    } catch (error) {
      // CSV import already succeeded.
    }
  }

  // =========================
  // FILTERED EXPENSES
  // =========================

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      expense.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // =========================
  // DASHBOARD
  // =========================

  if (loggedIn) {
    return (
      <div className="app">
        <header className="navbar">
          <h1>SmartSpend</h1>

          <button onClick={handleLogout}>Logout</button>
        </header>

        <main className="container">
          {/* Dashboard */}

          {!showAddExpense &&
            !showExpenses &&
            !editingExpense && (
              <section className="dashboard">
                <h2>Welcome to SmartSpend</h2>

                <p>
                  Manage your expenses and transactions
                  from one place.
                </p>

                <div className="dashboard-cards">
                  {/* Add Expense */}

                  <div
                    className="feature-card"
                    onClick={() => {
                      setShowAddExpense(true);
                      setExpenseMessage("");
                      setExpenseError("");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <h3>Add Expense</h3>

                    <p>
                      Record a new expense manually.
                    </p>
                  </div>

                  {/* My Expenses */}

                  <div
                    className="feature-card"
                    onClick={handleViewExpenses}
                    style={{ cursor: "pointer" }}
                  >
                    <h3>My Expenses</h3>

                    <p>
                      View and manage your transactions.
                    </p>
                  </div>

                  {/* CSV Import */}

                  <div className="feature-card">
                    <h3>Import CSV</h3>

                    <p>
                      Import multiple transactions at once.
                    </p>

                    <form onSubmit={handleCsvImport}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) =>
                          setCsvFile(e.target.files[0])
                        }
                      />

                      <button
                        type="submit"
                        className="primary-button"
                      >
                        Upload CSV
                      </button>
                    </form>

                    {csvMessage && (
                      <p style={{ color: "green" }}>
                        {csvMessage}
                      </p>
                    )}

                    {csvError && (
                      <p className="error-message">
                        {csvError}
                      </p>
                    )}
                  </div>
                </div>

                {expensesError && (
                  <p className="error-message">
                    {expensesError}
                  </p>
                )}
              </section>
            )}

          {/* Add Expense */}

          {showAddExpense &&
            !showExpenses &&
            !editingExpense && (
              <section className="login-card">
                <h2>Add Expense</h2>

                <p>
                  Enter the details of your expense.
                </p>

                <form onSubmit={handleAddExpense}>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    min="0.01"
                    step="0.01"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    required
                  />

                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) =>
                      setTransactionDate(e.target.value)
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Category (optional)"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value)
                    }
                  />

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Add Expense
                  </button>

                  {expenseMessage && (
                    <p style={{ color: "green" }}>
                      {expenseMessage}
                    </p>
                  )}

                  {expenseError && (
                    <p className="error-message">
                      {expenseError}
                    </p>
                  )}
                </form>

                <button
                  className="back-button"
                  onClick={() => {
                    setShowAddExpense(false);
                    setExpenseMessage("");
                    setExpenseError("");
                  }}
                >
                  Back to Dashboard
                </button>
              </section>
            )}

          {/* My Expenses */}

          {showExpenses &&
            !showAddExpense &&
            !editingExpense && (
              <section className="login-card">
                <h2>My Expenses</h2>

                {/* Search */}

                <input
                  type="text"
                  placeholder="Search by description..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />

                {/* Category Filter */}

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                >
                  <option value="All">
                    All Categories
                  </option>

                  <option value="Food">
                    Food
                  </option>

                  <option value="Transport">
                    Transport
                  </option>

                  <option value="Shopping">
                    Shopping
                  </option>

                  <option value="Bills">
                    Bills
                  </option>

                  <option value="Entertainment">
                    Entertainment
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

                {expenses.length === 0 ? (
                  <p>No expenses found.</p>
                ) : filteredExpenses.length === 0 ? (
                  <p>
                    No expenses match your search or filter.
                  </p>
                ) : (
                  <div>
                    {filteredExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="feature-card"
                        style={{
                          marginBottom: "15px",
                        }}
                      >
                        <h3>
                          ₹{expense.amount}
                        </h3>

                        <p>
                          <strong>
                            Description:
                          </strong>{" "}
                          {expense.description}
                        </p>

                        <p>
                          <strong>Date:</strong>{" "}
                          {expense.transaction_date}
                        </p>

                        <p>
                          <strong>Category:</strong>{" "}
                          {expense.category ||
                            "Uncategorized"}
                        </p>

                        <button
                          onClick={() =>
                            startEditing(expense)
                          }
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteExpense(expense.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="back-button"
                  onClick={() => {
                    setShowExpenses(false);
                    setSearchTerm("");
                    setCategoryFilter("All");
                  }}
                >
                  Back to Dashboard
                </button>
              </section>
            )}

          {/* Edit Expense */}

          {editingExpense && (
            <section className="login-card">
              <h2>Edit Expense</h2>

              <p>
                Update the details of your expense.
              </p>

              <form onSubmit={handleEditExpense}>
                <input
                  type="number"
                  placeholder="Amount"
                  value={editAmount}
                  onChange={(e) =>
                    setEditAmount(e.target.value)
                  }
                  min="0.01"
                  step="0.01"
                  required
                />

                <input
                  type="text"
                  placeholder="Description"
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(e.target.value)
                  }
                  required
                />

                <input
                  type="date"
                  value={editTransactionDate}
                  onChange={(e) =>
                    setEditTransactionDate(
                      e.target.value
                    )
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(e.target.value)
                  }
                />

                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Changes
                </button>

                {editError && (
                  <p className="error-message">
                    {editError}
                  </p>
                )}
              </form>

              <button
                className="back-button"
                onClick={() =>
                  setEditingExpense(null)
                }
              >
                Cancel
              </button>
            </section>
          )}
        </main>
      </div>
    );
  }

  // =========================
  // LOGIN PAGE
  // =========================

  if (showLogin) {
    return (
      <div className="app">
        <header className="navbar">
          <h1>SmartSpend</h1>
        </header>

        <main className="container">
          <section className="login-card">
            <h2>Welcome back</h2>

            <p>
              Login to your SmartSpend account.
            </p>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <button
                type="submit"
                className="primary-button"
              >
                Login
              </button>

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}
            </form>

            <button
              className="back-button"
              onClick={() => {
                setShowLogin(false);
                setError("");
              }}
            >
              Back
            </button>
          </section>
        </main>
      </div>
    );
  }

  // =========================
  // LANDING PAGE
  // =========================

  return (
    <div className="app">
      <header className="navbar">
        <h1>SmartSpend</h1>

        <button
          onClick={() => setShowLogin(true)}
        >
          Login
        </button>
      </header>

      <main className="container">
        <section className="welcome">
          <h2>
            Manage your expenses smarter.
          </h2>

          <p>
            Track expenses, import transactions,
            and automatically categorize your spending.
          </p>

          <button
            className="primary-button"
            onClick={() => setShowLogin(true)}
          >
            Get Started
          </button>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>Expense Management</h3>

            <p>
              Add, edit, delete, and manage your
              transactions.
            </p>
          </div>

          <div className="feature-card">
            <h3>Smart Categorization</h3>

            <p>
              Automatically categorize transactions
              using intelligent rules.
            </p>
          </div>

          <div className="feature-card">
            <h3>CSV Import</h3>

            <p>
              Import multiple transactions quickly
              from a CSV file.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
