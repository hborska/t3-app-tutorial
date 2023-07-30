import { User } from "@clerk/nextjs/dist/types/server";

// Creating this because we don't want all of this to be returned to the FE for every user (security reasons)
// There may also be a way to do this through the clerk client
// Easier to break out since used in several API routes

export const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};
