import { createContext, useContext } from "react";
import { PostDataStore } from "../types/Post";

const PostDataContext = createContext<PostDataStore>({});

export const PostDataProvider: React.FC<{ children: React.ReactNode; data: PostDataStore }> = (
  props,
) => {
  return <PostDataContext.Provider value={props.data}>{props.children}</PostDataContext.Provider>;
};

export function usePostData<T = unknown>(slug: string): T {
  const dataStore = useContext(PostDataContext);
  const data = dataStore[slug];
  if (!data) throw new Error(`No data with slug '${slug}'`);
  return data as T;
}
