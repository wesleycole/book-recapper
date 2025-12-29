import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const bookStatus = v.union(
  v.literal("want_to_read"),
  v.literal("reading"),
  v.literal("read")
);

export const addBook = mutation({
  args: {
    bookId: v.string(),
    title: v.string(),
    author: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    status: bookStatus,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if book already exists in library
    const existingBook = await ctx.db
      .query("library")
      .withIndex("by_user_and_book", (q) =>
        q.eq("userId", userId).eq("bookId", args.bookId)
      )
      .unique();

    if (existingBook) {
      throw new Error("Book already in library");
    }

    const now = Date.now();
    const bookData: {
      userId: typeof userId;
      bookId: string;
      title: string;
      author?: string;
      coverUrl?: string;
      status: "want_to_read" | "reading" | "read";
      startedAt?: number;
      finishedAt?: number;
      createdAt: number;
      updatedAt: number;
    } = {
      userId,
      bookId: args.bookId,
      title: args.title,
      author: args.author,
      coverUrl: args.coverUrl,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    };

    if (args.status === "reading") {
      bookData.startedAt = now;
    } else if (args.status === "read") {
      bookData.startedAt = now;
      bookData.finishedAt = now;
    }

    return await ctx.db.insert("library", bookData);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("library"),
    status: bookStatus,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const book = await ctx.db.get(args.id);
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or not authorized");
    }

    const now = Date.now();
    const updates: {
      status: "want_to_read" | "reading" | "read";
      updatedAt: number;
      startedAt?: number;
      finishedAt?: number;
    } = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "reading" && !book.startedAt) {
      updates.startedAt = now;
    } else if (args.status === "read") {
      if (!book.startedAt) {
        updates.startedAt = now;
      }
      updates.finishedAt = now;
    }

    await ctx.db.patch(args.id, updates);
  },
});

export const updateRating = mutation({
  args: {
    id: v.id("library"),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const book = await ctx.db.get(args.id);
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or not authorized");
    }

    await ctx.db.patch(args.id, {
      rating: args.rating,
      updatedAt: Date.now(),
    });
  },
});

export const updateNotes = mutation({
  args: {
    id: v.id("library"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const book = await ctx.db.get(args.id);
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or not authorized");
    }

    await ctx.db.patch(args.id, {
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

export const removeBook = mutation({
  args: {
    id: v.id("library"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const book = await ctx.db.get(args.id);
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const listBooks = query({
  args: {
    status: v.optional(bookStatus),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    if (args.status) {
      return await ctx.db
        .query("library")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("library")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getBook = query({
  args: {
    bookId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("library")
      .withIndex("by_user_and_book", (q) =>
        q.eq("userId", userId).eq("bookId", args.bookId)
      )
      .unique();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { wantToRead: 0, reading: 0, read: 0, total: 0 };
    }

    const allBooks = await ctx.db
      .query("library")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const stats = {
      wantToRead: 0,
      reading: 0,
      read: 0,
      total: allBooks.length,
    };

    for (const book of allBooks) {
      if (book.status === "want_to_read") stats.wantToRead++;
      else if (book.status === "reading") stats.reading++;
      else if (book.status === "read") stats.read++;
    }

    return stats;
  },
});
