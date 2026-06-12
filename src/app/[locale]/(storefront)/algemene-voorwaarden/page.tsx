import { createInfoPage } from "@/lib/content/create-info-page";

const { generateMetadata, generateStaticParams, Page } = createInfoPage("algemene-voorwaarden");
export { generateMetadata, generateStaticParams };
export default Page;
