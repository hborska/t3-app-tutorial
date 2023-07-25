import { clerkClient } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

// Creating this because we don't want all of this to be returned to the FE for every user (security reasons)
// There may also be a way to do this through the clerk client
const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

// Good to attaach auth state to context inside of each query (Ctx)
export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    const users = (
      await clerkClient.users.getUserList({
        // Getting users matching this userId, max of 100
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author || !author.username)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for post not found",
        });
      return { post, author };
    });
  }),

  // Route to create a post: must be private TRPC procedure
  // privateProcedure was exported from trpc.ts
  // Since we know it's not undefined (in trpc.ts), no need to worry about null/undefined behavior
  create: privateProcedure
    .input(z.object({ content: z.string().emoji().min(1).max(280) })) // we know content is a string that is 1 or more char, 280 or less and an emoji
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      // User creating post
      const post = ctx.prisma.post.create({
        data: { authorId, content: input.content },
      });

      return post;
    }),
});
