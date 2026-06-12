import { createInfoPage } from "@/lib/content/create-info-page";

const { generateMetadata, generateStaticParams, Page } = createInfoPage("contact");
export { generateMetadata, generateStaticParams };
export default Page;
