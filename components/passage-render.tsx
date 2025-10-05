"use client"

interface PassageRendererProps {
  text: string
  className?: string
}

export function PassageRenderer({ text, className = "" }: PassageRendererProps) {
  const renderFormattedText = (content: string) => {
    // Replace <b> tags with styled spans
    let formatted = content.replace(/<b>(.*?)<\/b>/g, '<strong class="font-bold">$1</strong>')

    // Replace <h3> tags with styled headings
    formatted = formatted.replace(/<h3>(.*?)<\/h3>/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')

    // Split by double newlines to create paragraphs
    const paragraphs = formatted.split("\n\n").filter((p) => p.trim())

    return paragraphs.map((para, index) => {
      // Check if paragraph contains HTML tags
      if (para.includes("<strong") || para.includes("<h3")) {
        return <div key={index} dangerouslySetInnerHTML={{ __html: para }} className="mb-4" />
      }
      return (
        <p key={index} className="mb-4">
          {para}
        </p>
      )
    })
  }

  return <div className={`prose prose-invert max-w-none ${className}`}>{renderFormattedText(text)}</div>
}
