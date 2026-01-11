import ReactMarkdown from "react-markdown";

function Markdown({ content }: { content: string }) {
  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-semibold mb-4 text-white">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold mb-4 text-white mt-8">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold mb-3 text-white mt-6">{children}</h3>
    ),
    p: ({ children }: any) => (
      <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-300">{children}</li>
    ),
    strong: ({ children }: any) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="text-gray-400 italic">{children}</em>
    ),
    hr: () => (
      <hr className="border-gray-600 my-8" />
    ),
    a: ({ href, children }: any) => (
      <a href={href} className="text-blue-400 hover:text-blue-300 underline">
        {children}
      </a>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm">
        {children}
      </code>
    ),
  }

  return (
    <ReactMarkdown components={markdownComponents}>
      {content}
    </ReactMarkdown>
  )
}

export default Markdown;