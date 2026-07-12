"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, X, Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  driver?: {
    status: string;
  } | null;
}

interface UsersManagerProps {
  initialUsers: User[];
  currentUserId: string;
}

const ROLE_DETAILS: Record<string, { label: string; bg: string; text: string; desc: string }> = {
  FLEET_MANAGER: { label: "Fleet Manager", bg: "bg-indigo-500/10", text: "text-indigo-400", desc: "Full administrative access" },
  DRIVER: { label: "Driver", bg: "bg-emerald-500/10", text: "text-emerald-400", desc: "Operates fleet vehicles" },
  SAFETY_OFFICER: { label: "Safety Officer", bg: "bg-amber-500/10", text: "text-amber-400", desc: "Manages safety metrics & scorecards" },
  FINANCIAL_ANALYST: { label: "Financial Analyst", bg: "bg-blue-500/10", text: "text-blue-400", desc: "Oversees trip expenses & costs" },
};

const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ON_TRIP: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  OFF_DUTY: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
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
  
  // Driver Form State
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setPassword(""); setRole("DRIVER");
    setLicenseNumber(""); setLicenseCategory(""); setLicenseExpiryDate("");
    setFormErrors({}); setServerError(null);
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
          body: JSON.stringify({ 
            name, email, phone, password, role,
            licenseNumber: role === "DRIVER" ? licenseNumber : undefined,
            licenseCategory: role === "DRIVER" ? licenseCategory : undefined,
            licenseExpiryDate: role === "DRIVER" ? licenseExpiryDate : undefined,
          }),
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

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverStatus: newStatus }),
      });
      if (!res.ok) {
        alert("Failed to update status");
        return;
      }
      setUsers(users.map(u => {
        if (u.id === userId && u.driver) {
          return { ...u, driver: { status: newStatus } };
        }
        return u;
      }));
    } catch (err) {
      alert("Network error.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>

        <button 
          onClick={() => setIsModalOpen(true)} 
          className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <Plus size={18} />
          Add New User
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Driver Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Registered</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700/50">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{user.name}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${ROLE_DETAILS[user.role]?.bg} ${ROLE_DETAILS[user.role]?.text}`}>
                        {ROLE_DETAILS[user.role]?.label || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "DRIVER" && user.driver ? (
                        <select
                          className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border outline-none cursor-pointer ${STATUS_COLORS[user.driver.status]}`}
                          value={user.driver.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                        >
                          {DRIVER_STATUSES.map(s => (
                            <option key={s} value={s} className="bg-slate-900 text-slate-200">{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-600 text-sm pl-4">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.id !== currentUserId ? (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-flex"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-md">You</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100">Create New Account</h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-5">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className={`bg-slate-950 border text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${formErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"}`} />
                  {formErrors.name && <p className="text-[10px] text-red-400">{formErrors.name[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <input type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`bg-slate-950 border text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${formErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"}`} />
                  {formErrors.email && <p className="text-[10px] text-red-400">{formErrors.email[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number (Optional)</label>
                  <input type="text" placeholder="+15551234567" value={phone} onChange={(e) => setPhone(e.target.value)} className={`bg-slate-950 border text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${formErrors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"}`} />
                  {formErrors.phone && <p className="text-[10px] text-red-400">{formErrors.phone[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                  <input type="password" placeholder="Min. 8 chars, 1 uppercase, 1 digit" value={password} onChange={(e) => setPassword(e.target.value)} className={`bg-slate-950 border text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${formErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"}`} />
                  {formErrors.password && <p className="text-[10px] text-red-400">{formErrors.password[0]}</p>}
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">System Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                    {Object.entries(ROLE_DETAILS).map(([key, value]) => (
                      <option key={key} value={key} className="bg-slate-900">{value.label} — {value.desc}</option>
                    ))}
                  </select>
                </div>

                {role === "DRIVER" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Number</label>
                      <input type="text" placeholder="D-1234567" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className={`bg-slate-950 border text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${formErrors.licenseNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"}`} />
                      {formErrors.licenseNumber && <p className="text-[10px] text-red-400">{formErrors.licenseNumber[0]}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Category</label>
                      <input type="text" placeholder="CDL Class A" value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)} className={`bg-slate-950 border text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${formErrors.licenseCategory ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"}`} />
                      {formErrors.licenseCategory && <p className="text-[10px] text-red-400">{formErrors.licenseCategory[0]}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Expiry Date</label>
                      <input type="date" value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)} className={`bg-slate-950 border text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-all ${formErrors.licenseExpiryDate ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"}`} />
                      {formErrors.licenseExpiryDate && <p className="text-[10px] text-red-400">{formErrors.licenseExpiryDate[0]}</p>}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-slate-800 pt-5">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-70"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
