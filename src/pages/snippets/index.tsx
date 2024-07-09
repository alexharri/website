import { Post } from "@alexharri/blog";
import { getPosts } from "@alexharri/blog/posts";
import { GetStaticProps } from "next";
import { Layout } from "../../components/Layout";
import { SnippetLink } from "../../components/Snippet/Snippet";
import { SnippetList } from "../../components/SnippetList/SnippetList";

interface Props {
  posts: Post[];
}

export default function Page(props: Props) {
  return (
    <Layout constrainWidth>
      <h1>Snippets</h1>
      <SnippetList>
        {props.posts.map((post) => (
          <SnippetLink post={post} key={post.slug} />
        ))}
      </SnippetList>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      posts: getPosts({ postsPath: "snippets/" }),
    },
  };
};

// export const getStaticProps: GetStaticProps<Props> = async () => {
//   const snippets: Snippet[] = [];

//   for (const fileName of snippetFileNames) {
//     const filePath = path.join(SNIPPETS_PATH, fileName);
//     const fileContent = fs.readFileSync(filePath, "utf8");

//     const { data } = matter(fileContent);

//     const {
//       title,
//       description = "",
//       showPreview,
//     } = data as {
//       title: string;
//       description?: string;
//       showPreview?: boolean;
//     };

//     let snippet: Snippet["snippet"] = null;

//     if (showPreview) {
//       const lines = fileContent.split("\n");
//       const lineIndex = lines.findIndex((line) => line.startsWith("```"));
//       const language = lines[lineIndex].substring(3);
//       const after = lines.slice(lineIndex + 1);
//       const content = after.slice(
//         0,
//         after.findIndex((line) => line.startsWith("```")),
//       );
//       snippet = { text: content.join("\n") + "\n", language };
//     }

//     const slug = fileName.replace(/\.mdx?$/, "");

//     snippets.push({ title, description, slug, snippet });
//   }

//   return { props: { snippets } };
// };
