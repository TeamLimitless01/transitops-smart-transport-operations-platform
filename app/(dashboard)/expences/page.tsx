import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ExpensesManager from "@/components/expenses/ExpensesManager";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowedRoles = ["FLEET_MANAGER", "ADMIN", "FINANCIAL_ANALYST"];
  if (!allowedRoles.includes(session.user.role)) redirect("/dashboard");

  const expenses = await prisma.expense.findMany({
    where: { type: { not: "FUEL" } },
    include: {
      vehicle: { select: { id: true, name: true, registrationNumber: true } },
      trip: { select: { id: true, source: true, destination: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Expenses</h1>
        <p className="text-sm text-slate-400 mt-1">
          View all vehicle and trip expenses (excluding fuel — see Fuel Logs tab).
        </p>
      </div>
      <ExpensesManager initialExpenses={JSON.parse(JSON.stringify(expenses))} />
    </div>
  );
}