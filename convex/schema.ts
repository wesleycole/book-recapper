import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  recaps: defineTable({
    userId: v.id("users"),
    bookTitle: v.string(),
    bookAuthor: v.optional(v.string()),
    bookCover: v.optional(v.string()),
    content: v.string(),
    sources: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
    }))),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_book", ["userId", "bookTitle"]),

  library: defineTable({
    userId: v.id("users"),
    bookId: v.string(), // Open Library book ID
    title: v.string(),
    author: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    status: v.union(
      v.literal("want_to_read"),
      v.literal("reading"),
      v.literal("read")
    ),
    rating: v.optional(v.number()), // 1-5 stars
    notes: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_book", ["userId", "bookId"]),
});
