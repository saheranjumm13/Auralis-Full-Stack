import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  contactSubmissions,
  InsertContactSubmission,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createContactSubmission(input: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(contactSubmissions).values(input);
  return Number(result[0].insertId);
}

export type ContactListFilters = {
  search?: string;
  status?: "all" | "new" | "read" | "replied";
  sortBy?: "createdAt" | "name" | "status";
  sortDir?: "asc" | "desc";
};

export async function listContactSubmissions(filters: ContactListFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const conditions = [];
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(contactSubmissions.status, filters.status));
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(or(like(contactSubmissions.name, term), like(contactSubmissions.email, term), like(contactSubmissions.message, term)));
  }

  const sortColumn = filters.sortBy === "name"
    ? contactSubmissions.name
    : filters.sortBy === "status"
      ? contactSubmissions.status
      : contactSubmissions.createdAt;
  const order = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  return db.select().from(contactSubmissions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order);
}

export async function updateContactSubmission(
  id: number,
  values: Partial<Pick<typeof contactSubmissions.$inferInsert, "status" | "replyMessage" | "repliedAt">>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(contactSubmissions).set(values).where(eq(contactSubmissions.id, id));
}
