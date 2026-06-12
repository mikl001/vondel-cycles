import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nl", "en"],
  defaultLocale: "nl",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/over-ons": {
      nl: "/over-ons",
      en: "/about",
    },
    "/categorie/[...slug]": {
      nl: "/categorie/[...slug]",
      en: "/category/[...slug]",
    },
    "/product/[slug]": {
      nl: "/product/[slug]",
      en: "/product/[slug]",
    },
    "/zoeken": {
      nl: "/zoeken",
      en: "/search",
    },
    "/winkelwagen": {
      nl: "/winkelwagen",
      en: "/cart",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
