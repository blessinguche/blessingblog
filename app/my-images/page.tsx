import { SiteHeader } from "@/components/site-header";
import { ImageGallery } from "@/components/image-gallery";
import { listGalleryImages } from "@/lib/images";
import { isWriterAuthenticated } from "@/lib/auth";

export const metadata = {
  title: "my images ! — Blessing",
  description: "A gallery of images from Blessing.",
};

export default async function MyImagesPage() {
  const images = await listGalleryImages();
  const isWriter = await isWriterAuthenticated();

  return (
    <>
      <SiteHeader variant="page" />
      <main className="mx-auto max-w-4xl px-6 pb-24">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">my images !</h1>
        <p className="text-muted mb-10 text-base">
          Photos and pictures collected along the way.
        </p>
        <ImageGallery images={images} canManage={isWriter} />
      </main>
    </>
  );
}
