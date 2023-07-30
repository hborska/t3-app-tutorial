import Link from "next/link";
import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// Type of PostView is whatever getAll returns, so no need to put all fields in manually
type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
  const { post, author } = props; // deconstructing to get fields we need
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.profileImageUrl}
        alt={`@${author.username}'s profile picture`}
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
        // placeholder="blur"
      />
      <div>
        <div className="flex gap-1 font-thin text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username!}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span>{` · ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl"> {post.content}</span>
      </div>
    </div>
  );
};
