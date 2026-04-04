export interface DocxParagraph {
  type: "heading" | "paragraph";
  text: string;
  level?: number;
}

export const exportDocxStructure = (title: string, sections: Array<{ heading: string; body: string }>) => ({
  title,
  paragraphs: [
    { type: "heading", text: title, level: 1 },
    ...sections.flatMap((section) => [
      { type: "heading", text: section.heading, level: 2 },
      { type: "paragraph", text: section.body }
    ])
  ] satisfies DocxParagraph[]
});
