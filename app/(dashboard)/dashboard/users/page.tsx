import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UsersManager from "./users-manager";

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role !== "FLEET_MANAGER") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return <UsersManager initialUsers={serializedUsers} currentUserId={session.user.id} />;
}
