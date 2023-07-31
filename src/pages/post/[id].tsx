import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Head from "next/head";
import { api } from "~/utils/api";

// Format is [slug] in main bc url will just be /@username
const SinglePostPage: NextPage<{ postId: string }> = ({ postId }) => {
  const { data, isLoading } = api.posts.getSinglePostById.useQuery({
    postId,
  });
  if (isLoading) console.log("Page is loading");

  if (!data)
    return (
      <div className="absolute right-0 top-0 flex h-10 w-screen items-center justify-center align-middle">
        404: Page Not Found
      </div>
    );

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} key={data.post.id} />
      </PageLayout>
    </>
  );
};

import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { PostView } from "~/components/postview";

// Rather than getServerSideProps() - longer to load, annoying to get types to client, etc.
// Doing this because we want this data available right away
// This is where we extract {username} from in the props
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const postId = context.params?.id; //getting what user put in
  if (typeof postId !== "string") throw new Error("no slug");

  // Prefetch allows us to fetch this data ahead of time and hydrate it through server side props
  await ssg.posts.getSinglePostById.prefetch({ postId });
  console.log("getting profile");

  return {
    props: {
      trpcState: ssg.dehydrate(),
      postId,
    },
  };
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" }; // generate on load
};

export default SinglePostPage;
