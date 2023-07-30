import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Head from "next/head";
import { api } from "~/utils/api";

const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
    userId: props.userId,
  });

  if (isLoading) return <LoadingPage />;

  if (!data || data.length === 0) return <div>User has not posted.</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

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
        404: Page Not Found
      </div>
    );

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 border-slate-400 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            alt={`${data.username}'s profile pic`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-black"
          />
        </div>
        <div className="h-[64px]"></div>{" "}
        {/* Hidden spacer above username - want to avoid use of margins*/}
        <div className="p-4 text-xl font-bold">{`@${data.username}`}</div>
        <div className="w-full border-b border-slate-400"></div>
        <ProfileFeed userId={data.id} />
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
