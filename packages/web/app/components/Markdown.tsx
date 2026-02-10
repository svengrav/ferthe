import ReactMarkdown from "react-markdown";

function Markdown({ content }: { content: string }) {
  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-semibold mb-4">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold mb-2">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold mb-2">{children}</h3>
    ),
    p: ({ children }: any) => <p className="mb-4 ">{children}</p>,
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 mb-4">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 mb-4">
        {children}
      </ol>
    ),
    li: ({ children }: any) => <li>{children}</li>,
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-8 text-gray-700" />,
    a: ({ href, children }: any) => (
      <a href={href} className="underline">
        {children}
      </a>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-700 pl-4 italic my-4">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="px-2 py-1 rounded text-sm">
        {children}
      </code>
    ),
  };

  return (
    <ReactMarkdown components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}

export default Markdown;
