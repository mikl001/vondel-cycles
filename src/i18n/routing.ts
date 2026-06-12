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
    "/contact": "/contact",
    "/verzending-en-retour": {
      nl: "/verzending-en-retour",
      en: "/shipping-and-returns",
    },
    "/privacy": "/privacy",
    "/algemene-voorwaarden": {
      nl: "/algemene-voorwaarden",
      en: "/terms-and-conditions",
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
    "/afrekenen": {
      nl: "/afrekenen",
      en: "/checkout",
    },
    "/bestelling/[orderId]": {
      nl: "/bestelling/[orderId]",
      en: "/order/[orderId]",
    },
    "/betaling/[orderId]": {
      nl: "/betaling/[orderId]",
      en: "/payment/[orderId]",
    },
    "/login": "/login",
    "/registreren": {
      nl: "/registreren",
      en: "/register",
    },
    "/wachtwoord-vergeten": {
      nl: "/wachtwoord-vergeten",
      en: "/forgot-password",
    },
    "/account": "/account",
    "/account/bestellingen": {
      nl: "/account/bestellingen",
      en: "/account/orders",
    },
    "/account/adressen": {
      nl: "/account/adressen",
      en: "/account/addresses",
    },
    "/account/verlanglijst": {
      nl: "/account/verlanglijst",
      en: "/account/wishlist",
    },
    "/account/privacy": "/account/privacy",
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
