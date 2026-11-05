/** Root metadata `title.default` / home document title. */
export const SITE_TITLE = "Oscar Rode · Design Portfolio";

/** Root metadata `title.template`. Case-study pages set `title: study.title`. */
export const TITLE_TEMPLATE = "%s · Oscar Rode";

export function documentTitleForStudy(studyTitle: string): string {
  return TITLE_TEMPLATE.replace(/%s/g, studyTitle);
}
