import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

// Format is [slug] in main bc url will just be /@username
const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  // Username prop is whatever /[slug] content is
  // We don't want isLoading property to be hit when it's a valid username
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });
  if (isLoading) console.log("Page is loading");

  if (!data)
    return (
      <div className="absolute right-0 top-0 flex h-10 w-screen items-center justify-center align-middle">
        404
      </div>
    );

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div>{data.username}</div>
      </PageLayout>
    </>
  );
};

import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import { PageLayout } from "~/components/layout";

// Rather than getServerSideProps() - longer to load, annoying to get types to client, etc.
// Doing this because we want this data available right away
// This is where we extract {username} from in the props
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug; //getting what user put in
  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  // Prefetch allows us to fetch this data ahead of time and hydrate it through server side props
  await ssg.profile.getUserByUsername.prefetch({ username });
  console.log("getting profile");

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" }; // generate on load
};

export default ProfilePage;
