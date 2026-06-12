import { createInfoPage } from "@/lib/content/create-info-page";

const { generateMetadata, generateStaticParams, Page } = createInfoPage("privacy");
export { generateMetadata, generateStaticParams };
export default Page;
