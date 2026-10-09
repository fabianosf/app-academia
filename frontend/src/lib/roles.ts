import type { User, UserRole } from "@/types";

export function isPlatformAdmin(user: Pick<User, "role" | "isPlatformAdmin">): boolean {
  return user.role === "admin" || !!user.isPlatformAdmin;
}

export function isTeacher(user: Pick<User, "role" | "isTeacher">): boolean {
  return user.role === "teacher" || !!user.isTeacher;
}

export function isManagementUser(user: Pick<User, "role" | "isPlatformAdmin" | "isTeacher">): boolean {
  return isPlatformAdmin(user) || isTeacher(user);
}

export function homePathForUser(
  user: Pick<User, "role" | "isPlatformAdmin" | "isTeacher">,
): string {
  if (isPlatformAdmin(user)) return "/admin";
  if (isTeacher(user)) return "/professor";
  return "/";
}

export function roleLabel(role?: UserRole | string): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "teacher":
      return "Professor";
    case "student":
      return "Aluno";
    default:
      return "Aluno";
  }
}
