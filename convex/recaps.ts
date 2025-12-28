import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const save = mutation({
  args: {
    bookTitle: v.string(),
    bookAuthor: v.optional(v.string()),
    bookCover: v.optional(v.string()),
    content: v.string(),
    sources: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if recap for this book already exists
    const existingRecap = await ctx.db
      .query("recaps")
      .withIndex("by_user_and_book", (q) =>
        q.eq("userId", userId).eq("bookTitle", args.bookTitle)
      )
      .unique();

    if (existingRecap) {
      // Update existing recap
      await ctx.db.patch(existingRecap._id, {
        content: args.content,
        sources: args.sources,
        bookAuthor: args.bookAuthor ?? existingRecap.bookAuthor,
        bookCover: args.bookCover ?? existingRecap.bookCover,
      });
      return existingRecap._id;
    }

    // Create new recap
    const recapId = await ctx.db.insert("recaps", {
      userId,
      bookTitle: args.bookTitle,
      bookAuthor: args.bookAuthor,
      bookCover: args.bookCover,
      content: args.content,
      sources: args.sources,
      createdAt: Date.now(),
    });

    return recapId;
  },
});

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const recaps = await ctx.db
      .query("recaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return recaps;
  },
});

export const get = query({
  args: { bookTitle: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const recap = await ctx.db
      .query("recaps")
      .withIndex("by_user_and_book", (q) =>
        q.eq("userId", userId).eq("bookTitle", args.bookTitle)
      )
      .unique();

    return recap;
  },
});

export const remove = mutation({
  args: { id: v.id("recaps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const recap = await ctx.db.get(args.id);
    if (!recap || recap.userId !== userId) {
      throw new Error("Recap not found or not authorized");
    }

    await ctx.db.delete(args.id);
  },
});
