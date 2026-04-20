export interface Profile {
  _id: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}
