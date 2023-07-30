import { SignInButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { api } from "~/utils/api";

import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { NextPage } from "next/types";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

const CreatePostWizard = () => {
  const { user } = useUser();
  // in production, will re render every time we call this, so wouldn't actually do this in prod (use form)
  const [tweetContent, setTweetContent] = useState("");
  const ctx = api.useContext();

  // Calling private procedure function from posts.ts
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: async () => {
      setTweetContent("");
      await ctx.posts.getAll.invalidate();
    },

    onError: (e) => {
      const errorMsg = e.data?.zodError?.fieldErrors.content;
      if (errorMsg?.[0]) {
        toast.error(errorMsg[0]!); // non null assertion with the ! here
      } else {
        toast.error("Failed to post. Please try again later.");
      }
    },
  });

  if (!user) return null;

  return (
    <div className="flex justify-between">
      <div className="flex w-full gap-3">
        <Image
          src={user.profileImageUrl}
          alt="Profile Pic"
          className="h-16 w-16 rounded-full"
          width={56}
          height={56}
          // placeholder="blur"
        />
        <input
          placeholder="Tweet some emojis!"
          className="bg-transparent outline-none"
          type="text"
          value={tweetContent}
          onChange={(e) => {
            setTweetContent(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Also want to tweet when we just press enter
              e.preventDefault();
              if (tweetContent !== "") {
                mutate({ content: tweetContent });
              }
            }
          }}
          disabled={isPosting}
        />
      </div>

      {tweetContent !== "" && !isPosting && (
        <button
          onClick={() => mutate({ content: tweetContent })}
          disabled={isPosting}
        >
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex flex-col justify-center">
          <LoadingSpinner size={24} />
        </div>
      )}
    </div>
  );
};

// Separating feed into diff component so the user section loads first
const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong!</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

// Can also bind to the NextPage type
export default function Home() {
  const { isLoaded: userLoaded, isSignedIn } = useUser(); // just binding isLoaded to a name here (not TS stuff)

  // Start fetching immediately
  api.posts.getAll.useQuery();

  // Return empty div if user isn't loaded yet
  if (!userLoaded) return <div></div>;

  return (
    <PageLayout>
      <div className="border-b border-slate-400 p-4">
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton />
          </div>
        )}
        {isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
}
