import { createInfoPage } from "@/lib/content/create-info-page";

const { generateMetadata, generateStaticParams, Page } = createInfoPage("verzending-en-retour");
export { generateMetadata, generateStaticParams };
export default Page;
