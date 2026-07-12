"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

interface UsersManagerProps {
  initialUsers: User[];
  currentUserId: string;
}

const ROLE_DETAILS: Record<string, { label: string; color: string; desc: string }> = {
  FLEET_MANAGER: { label: "Fleet Manager", color: "#6366f1", desc: "Full administrative access" },
  DRIVER: { label: "Driver", color: "#10b981", desc: "Operates fleet vehicles" },
  SAFETY_OFFICER: { label: "Safety Officer", color: "#f59e0b", desc: "Manages safety metrics & scorecards" },
  FINANCIAL_ANALYST: { label: "Financial Analyst", color: "#3b82f6", desc: "Oversees trip expenses & costs" },
};

export default function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DRIVER");
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("DRIVER");
    setFormErrors({});
    setServerError(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setServerError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password, role }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 422 && data.issues) {
            setFormErrors(data.issues);
          } else {
            setServerError(data.error || "Failed to create user");
          }
          return;
        }

        // Add user to state and close
        setUsers([data, ...users]);
        setIsModalOpen(false);
        resetForm();
        router.refresh();
      } catch (err) {
        setServerError("Network error. Please try again.");
      }
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }

      setUsers(users.filter((u) => u.id !== id));
      router.refresh();
    } catch (err) {
      alert("Network error. Failed to delete user.");
    }
  };

  return (
    <div className="users-root">
      {/* Header controls */}
      <div className="users-header">
        <div className="search-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <button onClick={() => setIsModalOpen(true)} className="add-user-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New User
        </button>
      </div>

      {/* Users table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="user-row">
                    <td>
                      <div className="user-details-cell">
                        <div className="user-avatar-chip">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-name-email">
                          <span className="user-name-lbl">{user.name}</span>
                          <span className="user-email-lbl">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="user-phone-cell">{user.phone || "—"}</td>
                    <td>
                      <span className="role-chip" style={{ "--role-color": ROLE_DETAILS[user.role]?.color } as React.CSSProperties}>
                        {ROLE_DETAILS[user.role]?.label || user.role}
                      </span>
                    </td>
                    <td className="user-date-cell">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      {user.id !== currentUserId ? (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="delete-user-btn"
                          title="Delete User"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      ) : (
                        <span className="self-badge">You</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Account</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="close-modal-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="modal-form">
              {serverError && (
                <div className="modal-error-banner">
                  {serverError}
                </div>
              )}

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`form-input ${formErrors.name ? "input-err" : ""}`}
                />
                {formErrors.name && (
                  <p className="field-err-lbl">{formErrors.name[0]}</p>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`form-input ${formErrors.email ? "input-err" : ""}`}
                />
                {formErrors.email && (
                  <p className="field-err-lbl">{formErrors.email[0]}</p>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`form-input ${formErrors.phone ? "input-err" : ""}`}
                />
                {formErrors.phone && (
                  <p className="field-err-lbl">{formErrors.phone[0]}</p>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 digit"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`form-input ${formErrors.password ? "input-err" : ""}`}
                />
                {formErrors.password && (
                  <p className="field-err-lbl">{formErrors.password[0]}</p>
                )}
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-select"
                >
                  {Object.entries(ROLE_DETAILS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label} — {value.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="modal-cancel-btn"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={isPending}
                >
                  {isPending ? <span className="save-spinner" /> : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .users-root {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Controls */
        .users-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .search-wrap {
          position: relative;
          flex: 1;
          max-width: 480px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #475569;
        }
        .search-input {
          width: 100%;
          height: 44px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding-left: 44px;
          padding-right: 16px;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .add-user-btn {
          height: 44px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(99,102,241,0.25);
          transition: transform 0.15s, opacity 0.2s;
        }
        .add-user-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .add-user-btn:active {
          transform: translateY(0);
        }

        /* Table Card */
        .table-card {
          background: rgba(15,15,25,0.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .users-table th {
          background: rgba(255,255,255,0.02);
          padding: 16px 24px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #475569;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .user-row {
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.2s;
        }
        .user-row:hover {
          background: rgba(255,255,255,0.01);
        }

        .users-table td {
          padding: 16px 24px;
          font-size: 14px;
          color: #cbd5e1;
        }

        .user-details-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar-chip {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #f1f5f9;
        }

        .user-name-email {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name-lbl {
          font-weight: 600;
          color: #f1f5f9;
        }

        .user-email-lbl {
          font-size: 12px;
          color: #64748b;
        }

        .user-phone-cell, .user-date-cell {
          color: #94a3b8;
        }

        .role-chip {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(var(--role-color), 0.12);
          border: 1px solid var(--role-color);
          color: var(--role-color);
          text-transform: capitalize;
        }

        .delete-user-btn {
          background: transparent;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: inline-flex;
          transition: color 0.2s, background-color 0.2s;
        }
        .delete-user-btn:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
        }

        .self-badge {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          background: rgba(255,255,255,0.03);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .empty-cell {
          text-align: center;
          padding: 48px !important;
          color: #64748b;
        }

        /* Modal styling */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .modal-content {
          width: 100%;
          max-width: 460px;
          background: #0f0f18;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          animation: scaleUp 0.2s ease;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .modal-title {
          font-size: 17px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .close-modal-btn {
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .close-modal-btn:hover {
          color: #94a3b8;
        }

        .modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #f87171;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12.5px;
          font-weight: 500;
          color: #94a3b8;
        }

        .form-input, .form-select {
          height: 42px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0 12px;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-select option {
          background: #0f0f18;
          color: #cbd5e1;
        }
        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: rgba(99,102,241,0.5);
        }
        .form-input.input-err {
          border-color: rgba(239,68,68,0.5);
        }

        .field-err-lbl {
          font-size: 11px;
          color: #ef4444;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 12px;
        }

        .modal-cancel-btn {
          height: 40px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #cbd5e1;
          font-size: 13.5px;
          font-weight: 600;
          padding: 0 16px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .modal-cancel-btn:hover {
          background: rgba(255,255,255,0.02);
        }

        .modal-save-btn {
          height: 40px;
          background: #6366f1;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 13.5px;
          font-weight: 600;
          padding: 0 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        .modal-save-btn:hover {
          opacity: 0.95;
        }
        .modal-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .save-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
