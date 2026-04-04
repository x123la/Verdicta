export const exportMarkdown = (title: string, sections: Array<{ heading: string; body: string }>) =>
  [`# ${title}`, "", ...sections.flatMap((section) => [`## ${section.heading}`, section.body, ""])].join("\n").trim();
