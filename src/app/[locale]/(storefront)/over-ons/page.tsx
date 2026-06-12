import { createInfoPage } from "@/lib/content/create-info-page";

const { generateMetadata, generateStaticParams, Page } = createInfoPage("over-ons");
export { generateMetadata, generateStaticParams };
export default Page;
